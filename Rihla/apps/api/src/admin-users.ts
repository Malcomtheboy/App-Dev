import { Router, type RequestHandler } from "express";
import type { UserRecord } from "firebase-admin/auth";
import { createAdminSecurity } from "./admin-security.js";
import { getPrivilegedFirebaseServices } from "./firebase-admin-server.js";

export type AdminUserDetails = {
  uid: string;
  displayName: string;
  email: string;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  providers: string[];
};

export type AdminUsersService = {
  getUser: (uid: string) => Promise<AdminUserDetails>;
  setDisabled: (uid: string, disabled: boolean) => Promise<AdminUserDetails>;
};

function toIsoDate(value: unknown): string | null {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof (value as { toDate?: unknown } | null)?.toDate === "function") {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }
  return null;
}

function formatUser(record: UserRecord, profile: Record<string, unknown> | undefined): AdminUserDetails {
  return {
    uid: record.uid,
    displayName: typeof profile?.displayName === "string" ? profile.displayName : record.displayName ?? "",
    email: typeof profile?.email === "string" ? profile.email : record.email ?? "",
    disabled: record.disabled,
    emailVerified: record.emailVerified,
    createdAt: toIsoDate(profile?.createdAt) ?? toIsoDate(record.metadata.creationTime),
    lastSignInAt: toIsoDate(record.metadata.lastSignInTime),
    providers: [...new Set(record.providerData.map((provider) => provider.providerId))],
  };
}

function createFirebaseAdminUsersService(): AdminUsersService {
  async function detailsForRecord(record: UserRecord) {
    const { db } = getPrivilegedFirebaseServices();
    const profile = await db.doc(`users/${record.uid}`).get();
    return formatUser(record, profile.exists ? profile.data() : undefined);
  }

  return {
    async getUser(uid) {
      const { auth } = getPrivilegedFirebaseServices();
      return detailsForRecord(await auth.getUser(uid));
    },
    async setDisabled(uid, disabled) {
      const { auth } = getPrivilegedFirebaseServices();
      return detailsForRecord(await auth.updateUser(uid, { disabled }));
    },
  };
}

function validUid(value: string): boolean {
  return value.length > 0 && value.length <= 128 && value.trim() === value && !value.includes("/");
}

function sendServiceError(res: Parameters<RequestHandler>[1], error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "auth/user-not-found") {
    res.status(404).json({ error: "The user no longer exists." });
    return;
  }
  if (code === "auth/invalid-uid") {
    res.status(400).json({ error: "The user ID is invalid." });
    return;
  }
  console.error("Admin user operation unavailable:", code ?? "configuration-or-service-error");
  res.status(503).json({ error: "User management is unavailable. Check the API server credentials." });
}

export function createAdminUsersRouter(options: {
  security?: RequestHandler[];
  service?: AdminUsersService;
} = {}) {
  const router = Router();
  const security = options.security ?? createAdminSecurity();
  const service = options.service ?? createFirebaseAdminUsersService();

  router.use(...security);

  router.get("/:uid", async (req, res) => {
    const { uid } = req.params;
    if (!validUid(uid)) {
      res.status(400).json({ error: "The user ID is invalid." });
      return;
    }
    try {
      res.json(await service.getUser(uid));
    } catch (error) {
      sendServiceError(res, error);
    }
  });

  router.patch("/:uid/status", async (req, res) => {
    const { uid } = req.params;
    if (!validUid(uid) || typeof req.body?.disabled !== "boolean") {
      res.status(400).json({ error: "A valid user ID and disabled status are required." });
      return;
    }
    if (uid === res.locals.firebaseUid && req.body.disabled) {
      res.status(409).json({ error: "You cannot disable your own administrator account." });
      return;
    }
    try {
      res.json(await service.setDisabled(uid, req.body.disabled));
    } catch (error) {
      sendServiceError(res, error);
    }
  });

  return router;
}
