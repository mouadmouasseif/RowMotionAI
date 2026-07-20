"use client";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
export function SmartStartLink({ children, className }: { children: React.ReactNode; className?: string }) { const { user, loading } = useAuth(); return <Link className={className} aria-disabled={loading} href={user ? "/tableau-de-bord" : "/inscription"}>{children}</Link>; }
