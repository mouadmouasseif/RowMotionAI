"use client";

import { CheckCircle2, LogOut } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/providers/AuthProvider";

function PendingContent() {
  const role = useSearchParams().get("role");
  const { logout } = useAuth();
  const label = role === "club_admin" ? "administrateur de club" : "entraîneur";
  return <main className="pending-page"><Brand /><section><span><CheckCircle2 /></span><h1>Inscription enregistrée</h1><p>Votre compte {label} doit être validé avant de pouvoir accéder aux fonctionnalités de RowMotion AI.</p><div><Link className="button primary" href="/">Retour à l’accueil</Link><button className="button ghost" onClick={() => void logout()}><LogOut /> Se déconnecter</button></div></section></main>;
}
export default function PendingPage() { return <Suspense><PendingContent /></Suspense>; }
