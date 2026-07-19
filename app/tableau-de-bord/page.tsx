"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/types/user";

export default function LegacyDashboardPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(profile ? getDashboardPath(profile.role) : "/connexion");
  }, [loading, profile, router]);
  return <div className="auth-loading"><span /><p>Redirection vers votre espace…</p></div>;
}
