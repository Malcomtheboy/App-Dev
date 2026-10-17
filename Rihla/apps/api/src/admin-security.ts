import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { getPrivilegedFirebaseServices } from "./firebase-admin-server.js";

type VerifyToken = (token: string) => Promise<{ uid: string }>;
type CheckAdminRole = (uid: string) => Promise<boolean>;

const INVALID_TOKEN_CODES = new Set([
  "auth/argument-error",
  "auth/invalid-argument",
  "auth/invalid-id-token",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/user-disabled",
  "auth/user-not-found",
]);

export async function verifyAdminIdToken(token: string): Promise<{ uid: string }> {
  const { auth } = getPrivilegedFirebaseServices();
  return auth.verifyIdToken(token, true);
}

export async function hasAdminRole(uid: string): Promise<boolean> {
  const { db } = getPrivilegedFirebaseServices();
  return (await db.doc(`admins/${uid}`).get()).exists;
}

export function createAdminSecurity(
  verifyToken: VerifyToken = verifyAdminIdToken,
  checkAdminRole: CheckAdminRole = hasAdminRole,
): RequestHandler[] {
  const requireAdmin: RequestHandler = async (req, res, next) => {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get("Authorization") ?? "");
    if (!match) {
      res.set("WWW-Authenticate", "Bearer").status(401).json({ error: "Sign in as an administrator." });
      return;
    }

    let uid: string;
    try {
      uid = (await verifyToken(match[1])).uid;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code && INVALID_TOKEN_CODES.has(code)) {
        res.set("WWW-Authenticate", "Bearer").status(401).json({ error: "Your admin session is invalid or expired." });
      } else {
        console.error("Admin token verification unavailable:", code ?? "configuration-or-service-error");
        res.status(503).json({ error: "Admin verification is unavailable. Check the API server configuration." });
      }
      return;
    }

    try {
      if (!(await checkAdminRole(uid))) {
        res.status(403).json({ error: "This account does not have administrator access." });
        return;
      }
    } catch (error) {
      const code = (error as { code?: string })?.code;
      console.error("Admin role verification unavailable:", code ?? "configuration-or-service-error");
      res.status(503).json({ error: "Admin verification is unavailable. Check the API server credentials." });
      return;
    }

    res.locals.firebaseUid = uid;
    next();
  };

  const perAdmin = rateLimit({
    windowMs: 60_000,
    limit: 60,
    keyGenerator: (_req, res) => res.locals.firebaseUid,
    standardHeaders: "draft-8",
    identifier: "admin-user",
    legacyHeaders: false,
    message: { error: "Too many admin requests. Please try again in a minute." },
  });

  return [requireAdmin, perAdmin];
}
