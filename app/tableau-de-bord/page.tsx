"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardRouteByRole } from "@/config/dashboard-routes";
import { useAuth } from "@/providers/AuthProvider";

export default function LegacyDashboardPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(profile ? getDashboardRouteByRole(profile.role) : "/connexion");
  }, [loading, profile, router]);
  return <div className="auth-loading"><span /><p>Redirection vers votre espace…</p></div>;
}
