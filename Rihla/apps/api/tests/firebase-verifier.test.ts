import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { deleteApp, getApps } from "firebase-admin/app";
import { verifyFirebaseIdToken } from "../src/ai-security.js";

const originalProject = process.env.FIREBASE_PROJECT_ID;
const originalEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;

beforeEach(() => {
  process.env.FIREBASE_PROJECT_ID = "rihla-verifier-test";
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
});

after(async () => {
  if (originalProject === undefined) delete process.env.FIREBASE_PROJECT_ID;
  else process.env.FIREBASE_PROJECT_ID = originalProject;
  if (originalEmulator === undefined) delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  else process.env.FIREBASE_AUTH_EMULATOR_HOST = originalEmulator;
  await Promise.all(getApps().filter((app) => app.name === "rihla-gemini").map(deleteApp));
});

function testToken(overrides: Record<string, unknown> = {}, header: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return [
    { alg: "RS256", kid: "test-key", ...header },
    {
      aud: "rihla-verifier-test",
      iss: "https://securetoken.google.com/rihla-verifier-test",
      sub: "test-user",
      iat: now,
      auth_time: now,
      exp: now + 3600,
      ...overrides,
    },
  ].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".") + ".test-signature";
}

test("missing server project fails closed before Firebase verification", async () => {
  delete process.env.FIREBASE_PROJECT_ID;
  await assert.rejects(verifyFirebaseIdToken("anything"), /FIREBASE_PROJECT_ID/);
});

test("Auth emulator configuration cannot disable signature verification", async () => {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  await assert.rejects(verifyFirebaseIdToken("anything"), /production Auth verification/);
});

// These exercise the installed Admin SDK's claim checks, without contacting Google.
test("the real SDK rejects malformed tokens and reuses its server app", async () => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await assert.rejects(verifyFirebaseIdToken("not-a-jwt"), { code: "auth/argument-error" });
  }
  assert.equal(getApps().filter((app) => app.name === "rihla-gemini").length, 1);
});

test("the real SDK rejects a token from a different Firebase project", async () => {
  await assert.rejects(verifyFirebaseIdToken(testToken({ aud: "another-project" })), {
    code: "auth/argument-error",
  });
});

test("the real SDK rejects a mismatched token issuer", async () => {
  await assert.rejects(verifyFirebaseIdToken(testToken({ iss: "https://untrusted.example" })), {
    code: "auth/argument-error",
  });
});

test("the real SDK rejects unsigned tokens", async () => {
  await assert.rejects(verifyFirebaseIdToken(testToken({}, { alg: "none" })), {
    code: "auth/argument-error",
  });
});
