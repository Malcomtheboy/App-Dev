import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type VerifyToken = (token: string) => Promise<{ uid: string }>;

const APP_NAME = "rihla-gemini";
const INVALID_TOKEN_CODES = new Set([
  "auth/argument-error",
  "auth/invalid-argument",
  "auth/invalid-id-token",
  "auth/id-token-expired",
]);

export async function verifyFirebaseIdToken(token: string): Promise<{ uid: string }> {
  // Read lazily, after index.ts loads dotenv. Never trust a project ID from a request.
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("Firebase token verification needs FIREBASE_PROJECT_ID and production Auth verification");
  }

  // ID-token verification uses Google's public certificates; no private key is needed.
  const app = getApps().find((candidate) => candidate.name === APP_NAME)
    ?? initializeApp({ projectId }, APP_NAME);
  if (app.options.projectId !== projectId) {
    throw new Error("Firebase verification project changed; restart the API");
  }
  return getAuth(app).verifyIdToken(token);
}

export function createAiSecurity(verifyToken: VerifyToken = verifyFirebaseIdToken): RequestHandler[] {
  const requireUser: RequestHandler = async (req, res, next) => {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get("Authorization") ?? "");
    if (!match) {
      res.set("WWW-Authenticate", "Bearer").status(401).json({ error: "Sign in to use the AI." });
      return;
    }

    try {
      const decoded = await verifyToken(match[1]);
      res.locals.firebaseUid = decoded.uid;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code && INVALID_TOKEN_CODES.has(code)) {
        res.set("WWW-Authenticate", "Bearer").status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
      } else {
        // Do not log tokens, credential contents or SDK error messages.
        console.error("Firebase token verification unavailable:", code ?? "configuration-or-service-error");
        res.status(503).json({ error: "Sign-in verification is unavailable. Please try again later." });
      }
      return;
    }
    next();
  };

  const perUser = rateLimit({
    windowMs: 60_000,
    limit: 5,
    keyGenerator: (_req, res) => res.locals.firebaseUid,
    standardHeaders: "draft-8",
    identifier: "ai-user",
    legacyHeaders: false,
    message: { error: "You have sent too many AI messages. Please try again in a minute." },
  });

  // Keep the existing shared Gemini budget, after authentication and the user limit.
  const sharedBudget = rateLimit({
    windowMs: 60_000,
    limit: 8,
    keyGenerator: () => "global",
    standardHeaders: "draft-8",
    identifier: "ai-global",
    legacyHeaders: false,
    message: { error: "AI requests are limited right now — try again in a minute." },
  });

  return [requireUser, perUser, sharedBudget];
}
