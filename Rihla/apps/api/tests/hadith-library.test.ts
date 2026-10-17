import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express from "express";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const EDITIONS: Record<string, { name: string; hadiths: { hadithnumber: number; text: string; reference: { book: number; hadith: number } }[] }> = {
  bukhari: { name: "Sahih al-Bukhari", hadiths: [{ hadithnumber: 1, text: "The reward of deeds depends upon intentions.", reference: { book: 1, hadith: 1 } }] },
  muslim: { name: "Sahih Muslim", hadiths: [{ hadithnumber: 10, text: "Be patient and steadfast.", reference: { book: 2, hadith: 10 } }] },
  nawawi: { name: "40 Hadith Nawawi", hadiths: [{ hadithnumber: 1, text: "Actions are judged by intentions.", reference: { book: 1, hadith: 1 } }] },
};

test("plain hadith lookups are answered from the library without using Gemini or its limits", async (t) => {
  const originalEnv = { ...process.env };
  process.env.FIREBASE_PROJECT_ID = "rihla-library-test";
  process.env.GEMINI_API_KEY = "library-test-placeholder";
  process.env.QF_CLIENT_ID = "library-test-placeholder";
  process.env.QF_CLIENT_SECRET = "library-test-placeholder";
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  t.after(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  const firebase = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }, "rihla-gemini");
  t.after(() => deleteApp(firebase));
  t.mock.method(getAuth(firebase), "verifyIdToken", async (token: string) => {
    if (token === "invalid-test-token") {
      throw Object.assign(new Error("Rejected test token"), { code: "auth/invalid-id-token" });
    }
    return { uid: token };
  });

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
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const realFetch = globalThis.fetch;
  let geminiCalls = 0;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.startsWith(`${baseUrl}/`)) return realFetch(input, init);
    if (url.startsWith("https://generativelanguage.googleapis.com/")) {
      geminiCalls += 1;
      return Response.json({
        candidates: [{ content: { role: "model", parts: [{ text: "Gemini answered.\nSOURCES: none" }] }, finishReason: "STOP" }],
      });
    }
    const edition = /editions\/eng-(\w+)\.min\.json$/.exec(url)?.[1];
    if (edition && EDITIONS[edition]) {
      const { name, hadiths } = EDITIONS[edition];
      return Response.json({
        metadata: { name, sections: { "1": "One", "2": "Two" } },
        hadiths: hadiths.map((h) => ({ ...h, grades: [] })),
      });
    }
    throw new Error(`Unexpected external request: ${url}`);
  });

  const ask = (message: string, token: string | null = "library-user") =>
    fetch(`${baseUrl}/api/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ message }),
    });

  // Still needs a signed-in user, like every AI request.
  assert.equal((await ask("Nawawi 1", null)).status, 401);
  assert.equal((await ask("Nawawi 1", "invalid-test-token")).status, 401);

  // A numbered lookup quotes the hadith and links its source.
  const lookup = await (await ask("show me Nawawi hadith 1")).json();
  assert.equal(lookup.via, "library");
  assert.match(lookup.reply, /^40 Hadith Nawawi, hadith 1:\n\nActions are judged by intentions\.$/);
  assert.deepEqual(lookup.sources.map((s: { label: string; number: number; section: number }) => [s.label, s.number, s.section]), [
    ["40 Hadith Nawawi 1", 1, 1],
  ]);

  // A number that doesn't exist gets a helpful local answer, not an AI call.
  const missing = await (await ask("bukhari 999")).json();
  assert.equal(missing.via, "library");
  assert.match(missing.reply, /couldn't find hadith number 999 in Sahih al-Bukhari\. It goes up to 1\./);
  assert.deepEqual(missing.sources, []);

  // A topic request searches every collection.
  const topic = await (await ask("show me hadith about intentions")).json();
  assert.equal(topic.via, "library");
  assert.match(topic.reply, /found 2 hadith about "intentions"/);
  assert.deepEqual(topic.sources.map((s: { label: string }) => s.label).sort(), ["40 Hadith Nawawi 1", "Sahih al-Bukhari 1"]);

  assert.equal(geminiCalls, 0);

  // Library answers don't spend the per-user limit (5 a minute) or the shared one.
  for (let i = 0; i < 8; i++) {
    const response = await ask("nawawi 1");
    assert.equal(response.status, 200);
    assert.equal((await response.json()).via, "library");
  }
  assert.equal(geminiCalls, 0);

  // Explanations and questions with no library match still go to Gemini.
  const explained = await (await ask("What does Nawawi 1 mean?")).json();
  assert.equal(explained.reply, "Gemini answered.");
  assert.equal("via" in explained, false);
  const unmatched = await (await ask("show me hadith about zzzzqx")).json();
  assert.equal(unmatched.reply, "Gemini answered.");
  assert.equal(geminiCalls, 2);

  // The health page counts how many requests the library absorbed.
  const health = await (await fetch(`${baseUrl}/api/health`)).json();
  assert.equal(health.services.ai.libraryAnswers, 11);
});
