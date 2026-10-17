import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test, type TestContext } from "node:test";
import express, { type RequestHandler } from "express";
import { createAdminUsersRouter, type AdminUserDetails, type AdminUsersService } from "../src/admin-users.js";

const baseUser: AdminUserDetails = {
  uid: "user-a",
  displayName: "Test User",
  email: "test@example.com",
  disabled: false,
  emailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  lastSignInAt: null,
  providers: ["password"],
};

async function harness(t: TestContext, actorUid = "admin-a") {
  const updates: { uid: string; disabled: boolean }[] = [];
  const security: RequestHandler = (_req, res, next) => {
    res.locals.firebaseUid = actorUid;
    next();
  };
  const service: AdminUsersService = {
    getUser: async (uid) => ({ ...baseUser, uid }),
    setDisabled: async (uid, disabled) => {
      updates.push({ uid, disabled });
      return { ...baseUser, uid, disabled };
    },
  };
  const app = express();
  app.use(express.json());
  app.use("/users", createAdminUsersRouter({ security: [security], service }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/users`;
  return {
    updates,
    get: (uid: string) => fetch(`${baseUrl}/${uid}`),
    patch: (uid: string, body: unknown) => fetch(`${baseUrl}/${uid}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  };
}

test("an admin can read a user and change account status", async (t) => {
  const api = await harness(t);
  const getResponse = await api.get("user-a");
  assert.equal(getResponse.status, 200);
  assert.equal((await getResponse.json()).uid, "user-a");

  const patchResponse = await api.patch("user-a", { disabled: true });
  assert.equal(patchResponse.status, 200);
  assert.equal((await patchResponse.json()).disabled, true);
  assert.deepEqual(api.updates, [{ uid: "user-a", disabled: true }]);
});

test("invalid status updates are rejected", async (t) => {
  const api = await harness(t);
  for (const body of [{}, { disabled: "yes" }, { disabled: null }]) {
    const response = await api.patch("user-a", body);
    assert.equal(response.status, 400);
  }
  assert.deepEqual(api.updates, []);
});

test("an administrator cannot disable their own account", async (t) => {
  const api = await harness(t, "admin-a");
  const response = await api.patch("admin-a", { disabled: true });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /own administrator account/i);
  assert.deepEqual(api.updates, []);
});
