"use client";

import { Info } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";

export default function AboutDashboardPage() {
  return (
    <ProtectedPage>
      <AppShell referenceMode title="À propos" subtitle="RowMotion AI, analyse biomécanique pour l’aviron.">
        <section className="settings-reference-card">
          <Info />
          <div>
            <h2>RowMotion AI</h2>
            <p>Une plateforme dédiée au suivi des athlètes, aux analyses techniques, aux plans d’entraînement, aux clubs et aux compétitions d’aviron.</p>
          </div>
        </section>
      </AppShell>
    </ProtectedPage>
  );
}
