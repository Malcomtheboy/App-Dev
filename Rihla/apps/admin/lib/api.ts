// The Rihla API (apps/api) that the mobile app also talks to. Only public,
// non-personal endpoints are read from here — anything about users has to go
// through the database with proper access rules, never this client.
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
    ai: UpstreamStats;
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

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { signal });
  if (!response.ok) throw new Error(`The API answered ${response.status}`);
  return (await response.json()) as T;
}
