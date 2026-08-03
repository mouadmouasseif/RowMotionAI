"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function DisabledAccountPage() {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <main className="auth-loading disabled-account">
      <h1>Compte desactive</h1>
      <p>Votre compte RowMotion AI existe, mais il n&apos;est pas actif. Contactez l&apos;administrateur de votre structure.</p>
      <button className="button primary" onClick={() => void logout().then(() => router.replace("/connexion"))}>Retour a la connexion</button>
    </main>
  );
}
