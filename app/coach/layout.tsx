"use client";
import { RoleGuard } from "@/components/RoleGuard";
export default function Layout({ children }: { children: React.ReactNode }) { return <RoleGuard allowedRoles={["coach"]}>{children}</RoleGuard>; }
