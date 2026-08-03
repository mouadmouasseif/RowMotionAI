"use client";
import { RoleGuard } from "@/components/RoleGuard";
export default function Layout({ children }: { children: React.ReactNode }) { return <RoleGuard allowedRoles={["SUPER_ADMIN"]}>{children}</RoleGuard>; }
