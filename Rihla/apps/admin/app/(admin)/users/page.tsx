"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminUser, setAdminUserDisabled, type AdminUserDetails } from "@/lib/api";
import { useAdminAuth } from "@/lib/admin-auth";
import { describeFirestoreError, fetchUsers, type AdminUser, type FirestoreProblem } from "@/lib/users";
import { useNow } from "@/lib/use-api";
import { Card, Notice, PageHeader, Pill, Spinner, Stat } from "@/components/ui";

const DAY = 86_400_000;

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function formatApiDate(value: string | null) {
  return value ? formatDate(new Date(value)) : "—";
}

export default function UsersPage() {
  const { user: currentAdmin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [problem, setProblem] = useState<FirestoreProblem | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [details, setDetails] = useState<AdminUserDetails | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const detailsRequest = useRef(0);
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

  async function loadDetails(uid: string) {
    const request = ++detailsRequest.current;
    setSelectedUid(uid);
    setDetails(null);
    setDetailsError(null);
    setActionMessage(null);
    setDetailsLoading(true);
    try {
      const next = await fetchAdminUser(uid);
      if (request === detailsRequest.current) setDetails(next);
    } catch (error) {
      if (request === detailsRequest.current) {
        setDetailsError(error instanceof Error ? error.message : "Could not load the account.");
      }
    } finally {
      if (request === detailsRequest.current) setDetailsLoading(false);
    }
  }

  async function toggleDisabled() {
    if (!details || saving) return;
    const willDisable = !details.disabled;
    if (willDisable && !window.confirm(`Disable ${details.email || details.uid}? They will no longer be able to sign in.`)) return;

    setSaving(true);
    setDetailsError(null);
    setActionMessage(null);
    try {
      const next = await setAdminUserDisabled(details.uid, willDisable);
      setDetails(next);
      setActionMessage(willDisable ? "The account is now disabled." : "The account is active again.");
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : "Could not update the account.");
    } finally {
      setSaving(false);
    }
  }

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
                      <th className="py-2 pr-4 font-medium">UID</th>
                      <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {visible.map((user) => (
                      <tr key={user.uid}>
                        <td className="py-2.5 pr-4 font-medium">{user.displayName || "—"}</td>
                        <td className="py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">{user.email || "—"}</td>
                        <td className="py-2.5 pr-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{formatDate(user.createdAt)}</td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-zinc-500">{user.uid.slice(0, 8)}…</td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => loadDetails(user.uid)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selectedUid === user.uid ? "bg-accent text-accent-on" : "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"}`}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {selectedUid && (
            <Card title="Account details">
              {detailsLoading && <Spinner label="Loading account details…" />}
              {detailsError && <Notice tone="bad" title="Could not complete the request">{detailsError}</Notice>}
              {details && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{details.displayName || "Unnamed account"}</p>
                      <p className="text-sm text-zinc-500">{details.email || "No email address"}</p>
                    </div>
                    <Pill tone={details.disabled ? "bad" : "good"}>{details.disabled ? "Disabled" : "Active"}</Pill>
                  </div>

                  <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><dt className="text-xs uppercase tracking-wide text-zinc-500">Created</dt><dd className="mt-1">{formatApiDate(details.createdAt)}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-zinc-500">Last sign-in</dt><dd className="mt-1">{formatApiDate(details.lastSignInAt)}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-zinc-500">Email</dt><dd className="mt-1">{details.emailVerified ? "Verified" : "Not verified"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-zinc-500">Provider</dt><dd className="mt-1">{details.providers.join(", ") || "Unknown"}</dd></div>
                  </dl>

                  <div className="rounded-xl bg-zinc-50 p-3 font-mono text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">UID: {details.uid}</div>
                  {actionMessage && <Notice title="Account updated">{actionMessage}</Notice>}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleDisabled}
                      disabled={saving || (details.uid === currentAdmin?.uid && !details.disabled)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${details.disabled ? "bg-accent text-accent-on" : "bg-red-600 text-white hover:bg-red-700"}`}
                    >
                      {saving ? "Saving…" : details.disabled ? "Activate account" : "Disable account"}
                    </button>
                    <button type="button" onClick={() => loadDetails(details.uid)} disabled={saving} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
                      Refresh
                    </button>
                    {details.uid === currentAdmin?.uid && !details.disabled && <p className="text-xs text-zinc-500">You cannot disable your own administrator account.</p>}
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
