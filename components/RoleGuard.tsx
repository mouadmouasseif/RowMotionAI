"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDashboardRouteByRole } from "@/config/dashboard-routes";
import { useAuth } from "@/providers/AuthProvider";
import type { UserRole } from "@/types/user";

function GuardLoader({ label = "Verification de votre acces..." }: { label?: string }) {
  return <div className="auth-loading"><span /><p>{label}</p></div>;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) router.replace(`/connexion?next=${encodeURIComponent(pathname)}`);
    else if (!profile.active) router.replace("/compte-desactive");
  }, [loading, pathname, profile, router, user]);

  if (loading || !user || !profile || !profile.active) return <GuardLoader />;
  return <>{children}</>;
}

export function RoleGuard({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const allowed = Boolean(user && profile?.active && (profile.role === "SUPER_ADMIN" || allowedRoles.includes(profile.role)));

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) {
      router.replace(`/connexion?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!profile.active) {
      router.replace("/compte-desactive");
      return;
    }
    if (profile.role !== "SUPER_ADMIN" && !allowedRoles.includes(profile.role)) {
      router.replace(getDashboardRouteByRole(profile.role));
    }
  }, [allowedRoles, loading, pathname, profile, router, user]);

  if (loading || !allowed) return <GuardLoader />;
  return <>{children}</>;
}
