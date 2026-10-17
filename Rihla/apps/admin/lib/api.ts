// The Rihla API (apps/api) that the mobile app also talks to. Only public,
// non-personal endpoints are read from here — anything about users has to go
// through the database with proper access rules, never this client.
import { getFirebaseServices } from "./firebase";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type UpstreamStats = {
  configured: boolean;
  ok: number;
  failed: number;
  lastOk: number | null;
  lastError: number | null;
};

export type Health = {
  status: string;
  startedAt: number;
  uptimeSeconds: number;
  traffic: {
    total: number;
    clientErrors: number;
    serverErrors: number;
    byGroup: Record<string, number>;
  };
  services: {
    quran: UpstreamStats;
    hadith: UpstreamStats & { cachedCollections: string[] };
    ai: UpstreamStats & { libraryAnswers?: number };
  };
};

export type HadithCollection = { key: string; name: string };
export type HadithSection = {
  number: number;
  title: string;
  hadithCount: number;
  firstHadith: number;
  lastHadith: number;
};
export type HadithEntry = {
  hadithnumber: number;
  text?: string;
  grades: { name?: string; grade?: string }[];
  reference: { book: number; hadith: number };
};

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

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { signal });
  if (!response.ok) throw new Error(`The API answered ${response.status}`);
  return (await response.json()) as T;
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new ApiRequestError("Your admin session has ended. Sign in again.", 401);

  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: unknown } | null;
    const message = typeof body?.error === "string" ? body.error : `The API answered ${response.status}`;
    throw new ApiRequestError(message, response.status);
  }
  return (await response.json()) as T;
}

export function fetchAdminUser(uid: string): Promise<AdminUserDetails> {
  return adminRequest(`/api/admin/users/${encodeURIComponent(uid)}`);
}

export function setAdminUserDisabled(uid: string, disabled: boolean): Promise<AdminUserDetails> {
  return adminRequest(`/api/admin/users/${encodeURIComponent(uid)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ disabled }),
  });
}
