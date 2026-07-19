"use client";

import { LogOut, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/providers/AuthProvider";
import { getDashboardPath } from "@/types/user";

export default function UnauthorizedPage() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  return <main className="unauthorized-page"><Brand /><section><span><ShieldX /></span><h1>Accès non autorisé</h1><p>Votre rôle ne permet pas d’accéder à cette zone de RowMotion AI.</p><div><button className="button primary" onClick={() => router.replace(profile ? getDashboardPath(profile.role) : "/connexion")}>Retour au tableau de bord</button><button className="button ghost" onClick={async () => { await logout(); router.replace("/connexion"); }}><LogOut /> Se déconnecter</button></div></section></main>;
}
