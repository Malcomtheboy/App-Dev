"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth";
import { Sidebar } from "./sidebar";

const DEMO_MODE = process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE === "true";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Checking access…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {DEMO_MODE && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Demo mode: the admin check is skipped, so any signed-in account gets in. Switch it off before sharing this.
        </div>
      )}
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
