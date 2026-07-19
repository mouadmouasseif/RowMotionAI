"use client";
import { RoleGuard } from "@/components/RoleGuard";
import type { UserRole } from "@/types/user";
const roles: UserRole[] = ["athlete", "coach", "club_admin", "superadmin"];
export function ProtectedPage({ children, allowedRoles = roles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) { return <RoleGuard allowedRoles={allowedRoles}>{children}</RoleGuard>; }
