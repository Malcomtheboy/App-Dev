"use client";

import { useEffect, useState } from "react";
import { API_URL, type Health, type UpstreamStats } from "@/lib/api";
import { describeFirestoreError, fetchUserCount, type FirestoreProblem } from "@/lib/users";
import { useApi, useNow } from "@/lib/use-api";
import { Card, formatDuration, Notice, PageHeader, Pill, Spinner, Stat, timeAgo } from "@/components/ui";

const GROUP_LABELS: Record<string, string> = { quran: "Quran", hadith: "Hadith", ai: "Ask (AI)" };

export default function DashboardPage() {
  const { data: health, error, updatedAt, loading } = useApi<Health>("/api/health", 10_000);
  const now = useNow();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="How the Rihla API and its connected services are doing right now."
        action={
          <Pill tone={health ? "good" : error ? "bad" : "neutral"}>
            {health ? `Live · updated ${timeAgo(updatedAt, now)}` : error ? "API unreachable" : "Connecting…"}
          </Pill>
        }
      />

      {error && !health && (
        <Notice tone="bad" title="Can't reach the API">
          Tried {API_URL}/api/health. Start the API with <code>npm run dev</code> in <code>apps/api</code>, or point
          the admin at another server with <code>NEXT_PUBLIC_API_URL</code>.
        </Notice>
      )}
      {loading && !error && <Spinner label="Checking the API…" />}

      {health && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="API" value={health.status === "ok" ? "Online" : health.status} tone="good" hint={`Up ${formatDuration(health.uptimeSeconds)}`} />
            <Stat label="Requests handled" value={health.traffic.total.toLocaleString()} hint="Since the API last started" />
            <Stat label="Server errors" value={health.traffic.serverErrors} tone={health.traffic.serverErrors > 0 ? "bad" : "good"} hint="5xx responses" />
            <Stat label="Client errors" value={health.traffic.clientErrors} hint="4xx, incl. rate-limited" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ServiceCard name="Quran" detail="Quran Foundation API" stats={health.services.quran} now={now} />
            <ServiceCard
              name="Hadith"
              detail={`fawazahmed0 CDN · ${health.services.hadith.cachedCollections.length} collection(s) cached`}
              stats={health.services.hadith}
              now={now}
            />
            <ServiceCard
              name="Ask (AI)"
              detail="Gemini"
              stats={health.services.ai}
              now={now}
              extra={{ label: "Answered from the Hadith library", value: health.services.ai.libraryAnswers ?? 0 }}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Traffic by area">
              <TrafficBars byGroup={health.traffic.byGroup} total={health.traffic.total} />
            </Card>
            <UsersCard />
          </div>
        </>
      )}
    </div>
  );
}

function ServiceCard({
  name,
  detail,
  stats,
  now,
  extra,
}: {
  name: string;
  detail: string;
  stats: UpstreamStats;
  now: number;
  extra?: { label: string; value: number };
}) {
  const total = stats.ok + stats.failed;
  const failing = stats.lastError !== null && (stats.lastOk === null || stats.lastError > stats.lastOk);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{name}</h2>
        {!stats.configured ? <Pill tone="warn">Not configured</Pill> : failing ? <Pill tone="bad">Last call failed</Pill> : total === 0 ? <Pill>No calls yet</Pill> : <Pill tone="good">Healthy</Pill>}
      </div>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
      <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-zinc-500">Successful</dt>
        <dd className="text-right tabular-nums">{stats.ok}</dd>
        <dt className="text-zinc-500">Failed</dt>
        <dd className="text-right tabular-nums">{stats.failed}</dd>
        <dt className="text-zinc-500">Last success</dt>
        <dd className="text-right">{timeAgo(stats.lastOk, now)}</dd>
        <dt className="text-zinc-500">Last failure</dt>
        <dd className="text-right">{timeAgo(stats.lastError, now)}</dd>
        {extra && (
          <>
            <dt className="text-zinc-500">{extra.label}</dt>
            <dd className="text-right tabular-nums">{extra.value}</dd>
          </>
        )}
      </dl>
    </Card>
  );
}

function TrafficBars({ byGroup, total }: { byGroup: Record<string, number>; total: number }) {
  const rows = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-zinc-500">No traffic yet. Use the app and it will show up here.</p>;
  return (
    <ul className="space-y-3">
      {rows.map(([group, count]) => (
        <li key={group}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{GROUP_LABELS[group] ?? group}</span>
            <span className="tabular-nums text-zinc-500">{count}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-900">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(4, (count / total) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function UsersCard() {
  const [state, setState] = useState<{ count: number } | { problem: FirestoreProblem } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUserCount()
      .then((count) => !cancelled && setState({ count }))
      .catch((error) => !cancelled && setState({ problem: describeFirestoreError(error) }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card title="Accounts">
      {state === null && <Spinner />}
      {state && "count" in state && (
        <div>
          <p className="text-3xl font-semibold tabular-nums">{state.count.toLocaleString()}</p>
          <p className="mt-1 text-sm text-zinc-500">registered accounts</p>
        </div>
      )}
      {state && "problem" in state && (
        <Notice tone={state.problem.kind === "denied" ? "warn" : "bad"} title={state.problem.kind === "denied" ? "Waiting for database access" : "Database error"}>
          {state.problem.message}
        </Notice>
      )}
    </Card>
  );
}
