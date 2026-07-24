"use client";

import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";

export default function PrivacyDashboardPage() {
  return (
    <ProtectedPage>
      <AppShell referenceMode title="Confidentialité" subtitle="Contrôlez la protection et l’utilisation de vos données.">
        <section className="settings-reference-card">
          <ShieldCheck />
          <div>
            <h2>Protection des données</h2>
            <p>Vos vidéos d’analyse restent dans ce navigateur. Les données de compte et de performance sont protégées par les règles d’accès Firebase associées à votre rôle.</p>
          </div>
        </section>
      </AppShell>
    </ProtectedPage>
  );
}
