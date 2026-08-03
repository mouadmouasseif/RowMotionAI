"use client";

import { useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { DashboardView } from "@/components/DashboardView";
import { normalizeUserRole } from "@/types/user";

export default function SuperAdminPreviewPage() {
  const params = useSearchParams();
  const role = normalizeUserRole(params.get("role")) ?? "COACH";
  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <DashboardView previewRole={role === "SUPER_ADMIN" ? "COACH" : role} />
    </RoleGuard>
  );
}
