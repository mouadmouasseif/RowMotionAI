"use client";

import { HelpCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";

export default function HelpDashboardPage() {
  return (
    <ProtectedPage>
      <AppShell referenceMode title="Aide & support" subtitle="Retrouvez l’assistance RowMotion AI.">
        <section className="settings-reference-card">
          <HelpCircle />
          <div>
            <h2>Comment pouvons-nous vous aider ?</h2>
            <p>Consultez les fonctions principales depuis le menu ou contactez l’administrateur de votre club pour les autorisations liées aux athlètes, coachs et compétitions.</p>
          </div>
        </section>
      </AppShell>
    </ProtectedPage>
  );
}
