"use client";
import { RoleGuard } from "@/components/RoleGuard";
export default function Layout({ children }: { children: React.ReactNode }) { return <RoleGuard allowedRoles={["TECHNICAL_DIRECTOR", "FEDERATION_PRESIDENT"]}>{children}</RoleGuard>; }
