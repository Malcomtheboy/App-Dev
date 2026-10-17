"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth";
import { authErrorMessage } from "@/lib/admin-session";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/content", label: "Content" },
  { href: "/users", label: "Users" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(authErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  const nav = (
    <>
      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-accent text-accent-on" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <p className="truncate px-2 text-xs text-zinc-500">{user?.email}</p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
        {signOutError && <p role="alert" className="mt-2 px-2 text-xs text-red-600 dark:text-red-400">{signOutError}</p>}
      </div>
    </>
  );

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <Brand />
        <button
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open && <div className="flex flex-col border-b border-zinc-200 bg-white px-4 pb-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">{nav}</div>}

      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <Brand />
        {nav}
      </aside>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/rihla-logo.png" alt="Rihla" className="h-9 w-auto" />
      <span className="text-sm font-semibold tracking-tight text-zinc-500">Admin</span>
    </div>
  );
}
