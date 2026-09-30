"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth";

export default function Home() {
  const { user, isAdmin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user && isAdmin ? "/dashboard" : "/login");
  }, [loading, user, isAdmin, router]);

  return null;
}
