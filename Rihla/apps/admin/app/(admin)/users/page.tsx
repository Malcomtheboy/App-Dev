"use client";

import { useEffect, useMemo, useState } from "react";
import { describeFirestoreError, fetchUsers, type AdminUser, type FirestoreProblem } from "@/lib/users";
import { useNow } from "@/lib/use-api";
import { Card, Notice, PageHeader, Spinner, Stat } from "@/components/ui";

const DAY = 86_400_000;

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [problem, setProblem] = useState<FirestoreProblem | null>(null);
  const [search, setSearch] = useState("");
  const now = useNow(60_000);

  useEffect(() => {
    let cancelled = false;
    fetchUsers()
      .then((rows) => !cancelled && setUsers(rows))
      .catch((error) => !cancelled && setProblem(describeFirestoreError(error)));
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!users || !term) return users ?? [];
    return users.filter((user) => `${user.displayName} ${user.email} ${user.uid}`.toLowerCase().includes(term));
  }, [users, search]);

  const joinedThisWeek = (users ?? []).filter((user) => user.createdAt && now - user.createdAt.getTime() <= 7 * DAY).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Everyone who has created a Rihla account, newest first." />

      {problem && (
        <Notice tone={problem.kind === "denied" ? "warn" : "bad"} title={problem.kind === "denied" ? "Waiting for database access" : "Database error"}>
          {problem.message}
        </Notice>
      )}
      {!users && !problem && <Spinner label="Loading accounts…" />}

      {users && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Stat label="Accounts loaded" value={users.length} hint={users.length >= 200 ? "Showing the newest 200" : undefined} />
            <Stat label="Joined in the last 7 days" value={joinedThisWeek}  />
          </div>

          <Card>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or UID"
              className="mb-4 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent dark:border-zinc-700"
            />
            {visible.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">{users.length === 0 ? "No accounts yet." : "No one matches that search."}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Joined</th>
                      <th className="py-2 font-medium">UID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {visible.map((user) => (
                      <tr key={user.uid}>
                        <td className="py-2.5 pr-4 font-medium">{user.displayName || "—"}</td>
                        <td className="py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">{user.email || "—"}</td>
                        <td className="py-2.5 pr-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{formatDate(user.createdAt)}</td>
                        <td className="py-2.5 font-mono text-xs text-zinc-500">{user.uid.slice(0, 8)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="text-xs text-zinc-500">
            Disabling or deleting accounts needs the Firebase Admin SDK on a server, so it isn&apos;t offered here yet.
          </p>
        </>
      )}
    </div>
  );
}
