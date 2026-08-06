"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardRouteByRole } from "@/config/dashboard-routes";
import { useAuth } from "@/providers/AuthProvider";

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export default function HomePage() {
  const router = useRouter();
  const { profile, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const standalone = isStandaloneMode();
    if ((mobile || standalone) && isAuthenticated) {
      router.replace(getDashboardRouteByRole(profile?.role));
      return;
    }
    router.replace(mobile || standalone ? "/connexion" : "/fr");
  }, [isAuthenticated, loading, profile?.role, router]);

  return <main className="state-page"><div className="state-spinner" /><span>RowMotion AI</span></main>;
}
