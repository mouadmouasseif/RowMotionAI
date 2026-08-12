"use client";
import { RoleGuard } from "@/components/RoleGuard";
import type { UserRole } from "@/types/user";
const roles: UserRole[] = ["ATHLETE", "COACH", "CLUB_ADMIN", "TECHNICAL_DIRECTOR", "FEDERATION_PRESIDENT", "SUPER_ADMIN", "JURY"];
export function ProtectedPage({ children, allowedRoles = roles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) { return <RoleGuard allowedRoles={allowedRoles}>{children}</RoleGuard>; }
