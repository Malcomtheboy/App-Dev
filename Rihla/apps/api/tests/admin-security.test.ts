import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import express from "express";
import { createAdminSecurity } from "../src/admin-security.js";

function authError(code: string): Error & { code: string } {
  return Object.assign(new Error("Rejected test token"), { code });
}

async function harness(
  t: TestContext,
  verifyToken: Parameters<typeof createAdminSecurity>[0],
  checkRole: Parameters<typeof createAdminSecurity>[1],
) {
  const app = express();
  app.get("/admin", ...createAdminSecurity(verifyToken, checkRole), (_req, res) => {
    res.json({ uid: res.locals.firebaseUid });
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return (authorization?: string) => fetch(`${baseUrl}/admin`, {
    headers: authorization ? { Authorization: authorization } : undefined,
  });
}

test("admin endpoints reject missing and invalid tokens", async (t) => {
  let roleChecks = 0;
  const request = await harness(t, async (token) => {
    if (token === "bad") throw authError("auth/invalid-id-token");
    return { uid: "admin-a" };
  }, async () => {
    roleChecks += 1;
    return true;
  });

  for (const authorization of [undefined, "Basic nope", "Bearer bad"]) {
    const response = await request(authorization);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("WWW-Authenticate"), "Bearer");
  }
  assert.equal(roleChecks, 0);
});

test("a signed-in non-admin is denied", async (t) => {
  const request = await harness(t, async () => ({ uid: "user-a" }), async () => false);
  const response = await request("Bearer valid-user-token");
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /administrator access/i);
});

test("a verified admin reaches the handler with its UID", async (t) => {
  const checked: string[] = [];
  const request = await harness(t, async () => ({ uid: "admin-a" }), async (uid) => {
    checked.push(uid);
    return true;
  });
  const response = await request("Bearer valid-admin-token");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { uid: "admin-a" });
  assert.deepEqual(checked, ["admin-a"]);
});

test("verification and role service failures fail closed without leaking tokens", async (t) => {
  const logs: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => { logs.push(args); });
  const tokenFailure = await harness(t, async () => { throw new Error("private detail"); }, async () => true);
  const roleFailure = await harness(t, async () => ({ uid: "admin-a" }), async () => { throw new Error("private detail"); });

  for (const request of [tokenFailure, roleFailure]) {
    const response = await request("Bearer secret-test-token");
    assert.equal(response.status, 503);
    assert.ok(!JSON.stringify(await response.json()).includes("private detail"));
  }
  assert.ok(!JSON.stringify(logs).includes("secret-test-token"));
  assert.ok(!JSON.stringify(logs).includes("private detail"));
});
