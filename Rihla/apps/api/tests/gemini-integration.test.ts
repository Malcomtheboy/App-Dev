import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express from "express";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

test("the real Gemini route preserves authentication, experience levels and verified sources together", async (t) => {
  const originalEnv = { ...process.env };
  process.env.FIREBASE_PROJECT_ID = "rihla-integration-test";
  process.env.GEMINI_API_KEY = "integration-test-placeholder";
  process.env.QF_CLIENT_ID = "integration-test-placeholder";
  process.env.QF_CLIENT_SECRET = "integration-test-placeholder";
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  t.after(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  const firebase = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }, "rihla-gemini");
  t.after(() => deleteApp(firebase));
  const tokens: string[] = [];
  t.mock.method(getAuth(firebase), "verifyIdToken", async (token: string) => {
    tokens.push(token);
    if (token === "invalid-test-token") {
      throw Object.assign(new Error("Rejected test token"), { code: "auth/invalid-id-token" });
    }
    return { uid: token };
  });

  // Capture the production Express app without starting its configured port.
  const originalListen = express.application.listen;
  const listen = t.mock.method(express.application, "listen", function () {
    return {} as Server;
  });
  await import("../src/index.js");
  const captured = listen.mock.calls[0]?.this as express.Application | undefined;
  listen.mock.restore();
  assert.ok(captured);
  captured.listen = originalListen;
  const server = captured.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const realFetch = globalThis.fetch;
  const geminiBodies: Record<string, unknown>[] = [];
  let hadithFetches = 0;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.startsWith(`${baseUrl}/`)) return realFetch(input, init);
    if (url.startsWith("https://generativelanguage.googleapis.com/")) {
      const body = input instanceof Request ? await input.text() : String(init?.body);
      geminiBodies.push(JSON.parse(body));
      return Response.json({
        candidates: [{
          content: {
            role: "model",
            parts: [{ text: "Prayer begins with intention.\nSOURCES: nawawi 1; nawawi 99999" }],
          },
          finishReason: "STOP",
        }],
      });
    }
    if (url === "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-nawawi.min.json") {
      hadithFetches += 1;
      return Response.json({
        metadata: { name: "40 Hadith Nawawi", sections: { "1": "Intention" } },
        hadiths: [{
          hadithnumber: 1,
          text: "Actions are judged by intentions.",
          grades: [],
          reference: { book: 1, hadith: 1 },
        }],
      });
    }
    throw new Error("Unexpected external request during Gemini integration test");
  });

  const ask = (token?: string, level: unknown = "beginner") => fetch(`${baseUrl}/api/ai/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: "How do I prepare for prayer?",
      history: [{ role: "user", text: "I want to learn." }],
      level,
    }),
  });

  for (const token of [undefined, "invalid-test-token"]) {
    const response = await ask(token);
    assert.equal(response.status, 401);
    await response.json();
  }
  assert.equal(geminiBodies.length, 0);
  assert.equal(hadithFetches, 0);

  const cases = [
    { level: "new", note: "The user is new to Islam." },
    { level: "beginner", note: "The user knows the basics" },
    { level: "advanced", note: "The user is experienced." },
    { level: "unrecognised-level", note: "The user knows the basics" },
  ];
  for (const [index, entry] of cases.entries()) {
    const response = await ask(`integration-user-${index}`, entry.level);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      reply: "Prayer begins with intention.",
      sources: [{
        kind: "hadith",
        label: "40 Hadith Nawawi 1",
        collection: "nawawi",
        section: 1,
        excerpt: "Actions are judged by intentions.",
      }],
    });
    const body = JSON.stringify(geminiBodies[index]);
    assert.ok(body.includes(entry.note));
    assert.ok(body.includes("How do I prepare for prayer?"));
    assert.ok(body.includes("I want to learn."));
  }
  assert.equal(geminiBodies.length, 4);
  assert.equal(hadithFetches, 1);
  assert.deepEqual(tokens, ["invalid-test-token", ...cases.map((_, index) => `integration-user-${index}`)]);
});
