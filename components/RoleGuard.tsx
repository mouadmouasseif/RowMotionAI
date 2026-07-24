"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import type { UserRole } from "@/types/user";

export function RoleGuard({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const allowed = Boolean(user && profile && (profile.role === "superadmin" || allowedRoles.includes(profile.role)));

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) router.replace(`/connexion?next=${encodeURIComponent(pathname)}`);
    else if (profile.role !== "superadmin" && !allowedRoles.includes(profile.role)) router.replace("/unauthorized");
  }, [allowedRoles, loading, pathname, profile, router, user]);

  if (loading || !allowed) return <div className="auth-loading"><span /><p>Vérification de votre accès…</p></div>;
  return <>{children}</>;
}
