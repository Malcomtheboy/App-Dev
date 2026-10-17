import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import express from "express";
import { createAiSecurity } from "../src/ai-security.js";

type VerifyToken = Parameters<typeof createAiSecurity>[0];

function authError(code: string): Error & { code: string } {
  return Object.assign(new Error("Rejected test token"), { code });
}

async function harness(t: TestContext, verifyToken: VerifyToken) {
  const app = express();
  const handledBodies: unknown[] = [];
  app.use(express.json());
  app.get("/api/ai/status", (_req, res) => res.json({ configured: true }));
  app.get("/api/hadith/collections", (_req, res) => res.json([{ key: "bukhari" }]));
  app.post("/api/ai/ask", ...createAiSecurity(verifyToken), (req, res) => {
    handledBodies.push(req.body);
    res.json({ reply: "Preserved Gemini reply." });
  });

  const server = app.listen(0, "127.0.0.1");
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

  return {
    handledBodies,
    get: (path: string) => fetch(`${baseUrl}${path}`),
    ask: (authorization?: string, body: unknown = { message: "Hello", history: [] }) => fetch(`${baseUrl}/api/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization === undefined ? {} : { Authorization: authorization }),
      },
      body: JSON.stringify(body),
    }),
  };
}

function assertRetryAfter(response: Response) {
  const retryAfter = response.headers.get("Retry-After");
  assert.match(retryAfter ?? "", /^\d+$/);
  assert.ok(Number(retryAfter) > 0 && Number(retryAfter) <= 60);
}

test("missing or malformed Bearer headers are rejected before token verification", async (t) => {
  const verifiedTokens: string[] = [];
  const api = await harness(t, async (token) => {
    verifiedTokens.push(token);
    return { uid: "user-a" };
  });

  for (const authorization of [undefined, "", "Basic abc", "Bearer", "Bearer ", "Bearer one two"]) {
    const response = await api.ask(authorization);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("WWW-Authenticate"), "Bearer");
    assert.equal(typeof (await response.json()).error, "string");
  }
  assert.deepEqual(verifiedTokens, []);
  assert.deepEqual(api.handledBodies, []);
});

for (const code of ["auth/invalid-id-token", "auth/id-token-expired", "auth/argument-error", "auth/invalid-argument"]) {
  test(`${code} returns 401 without reaching the Gemini handler`, async (t) => {
    const api = await harness(t, async () => { throw authError(code); });
    const response = await api.ask("Bearer rejected-test-token");
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("WWW-Authenticate"), "Bearer");
    assert.equal(typeof (await response.json()).error, "string");
    assert.deepEqual(api.handledBodies, []);
  });
}

test("configuration or verification-service failures fail closed with 503", async (t) => {
  const logged: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => { logged.push(args); });
  let calls = 0;
  const api = await harness(t, async () => {
    calls += 1;
    if (calls === 1) throw new Error("Internal configuration detail");
    throw authError("auth/internal-error");
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await api.ask("Bearer test-token-never-to-be-logged");
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(typeof body.error, "string");
    assert.ok(!JSON.stringify(body).includes("Internal configuration detail"));
  }
  assert.deepEqual(api.handledBodies, []);
  assert.equal(logged.length, 2);
  assert.ok(!JSON.stringify(logged).includes("test-token-never-to-be-logged"));
  assert.ok(!JSON.stringify(logged).includes("Internal configuration detail"));
});

test("a verified user retains the request body and existing reply format", async (t) => {
  const verifiedTokens: string[] = [];
  const api = await harness(t, async (token) => {
    verifiedTokens.push(token);
    return { uid: "user-a" };
  });
  const body = {
    message: "How do I prepare for prayer?",
    history: [{ role: "assistant", text: "How can I help?" }],
  };

  const response = await api.ask("Bearer valid-test-token", body);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reply: "Preserved Gemini reply." });
  assert.deepEqual(api.handledBodies, [body]);
  assert.deepEqual(verifiedTokens, ["valid-test-token"]);
});

test("the sixth call is limited by UID, including refreshed tokens; another user on the same IP is allowed", async (t) => {
  const api = await harness(t, async (token) => ({ uid: token.split(":")[0] }));

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await api.ask("Bearer user-a:original-token");
    assert.equal(response.status, 200);
    await response.json();
  }

  for (const token of ["user-a:original-token", "user-a:refreshed-token"]) {
    const response = await api.ask(`Bearer ${token}`);
    assert.equal(response.status, 429);
    assertRetryAfter(response);
    assert.match((await response.json()).error, /too many AI messages/i);
  }

  const differentUser = await api.ask("Bearer user-b:token");
  assert.equal(differentUser.status, 200);
  await differentUser.json();
  assert.equal(api.handledBodies.length, 6);
});

test("the shared Gemini budget limits the ninth request across distinct users", async (t) => {
  const api = await harness(t, async (token) => ({ uid: token }));

  for (let user = 0; user < 8; user += 1) {
    const response = await api.ask(`Bearer user-${user}`);
    assert.equal(response.status, 200);
    await response.json();
  }
  const response = await api.ask("Bearer user-9");
  assert.equal(response.status, 429);
  assertRetryAfter(response);
  assert.match((await response.json()).error, /AI requests are limited/i);
  assert.equal(api.handledBodies.length, 8);
});

test("anonymous and invalid calls consume neither the user nor shared Gemini allowance", async (t) => {
  const api = await harness(t, async (token) => {
    if (token === "invalid") throw authError("auth/invalid-id-token");
    return { uid: token };
  });

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await api.ask(attempt % 2 ? "Bearer invalid" : undefined);
    assert.equal(response.status, 401);
    await response.json();
  }

  for (const uid of ["user-a", "user-a", "user-a", "user-a", "user-a", "user-b", "user-b", "user-b"]) {
    const response = await api.ask(`Bearer ${uid}`);
    assert.equal(response.status, 200);
    await response.json();
  }
  const exhausted = await api.ask("Bearer user-c");
  assert.equal(exhausted.status, 429);
  assert.match((await exhausted.json()).error, /AI requests are limited/i);
  assert.equal(api.handledBodies.length, 8);
});

test("security stays scoped to the ask route", async (t) => {
  let verificationCalls = 0;
  const api = await harness(t, async () => {
    verificationCalls += 1;
    throw authError("auth/invalid-id-token");
  });

  const status = await api.get("/api/ai/status");
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), { configured: true });
  const hadith = await api.get("/api/hadith/collections");
  assert.equal(hadith.status, 200);
  assert.deepEqual(await hadith.json(), [{ key: "bukhari" }]);
  assert.equal(verificationCalls, 0);
});
