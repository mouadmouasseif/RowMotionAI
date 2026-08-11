"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Eye, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { DATA_UNAVAILABLE } from "@/lib/data-availability";
import { useAuth } from "@/providers/AuthProvider";
import { getTechnicalDirectorOverview, type TechnicalDirectorOverview } from "@/services/technical-director-service";

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : DATA_UNAVAILABLE;
}

function WatchedAthletesPage() {
  const { profile } = useAuth();
  const [overview, setOverview] = useState<TechnicalDirectorOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    void getTechnicalDirectorOverview(profile)
      .then(setOverview)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Impossible de charger les athletes."));
  }, [profile]);

  if (!profile) return null;
  const rows = overview?.watchedAthletes ?? [];

  return (
    <AppShell
      referenceMode
      title="Athletes a surveiller"
      subtitle="Profils avec affectation, analyse ou donnees Firebase incompletes."
      headerActions={<Link className="button ghost" href="/technical-director/dashboard"><Target />Vue strategique</Link>}
    >
      {error && <div className="error-card">{error}</div>}
      {!overview ? (
        <div className="loading-card">Chargement...</div>
      ) : rows.length ? (
        <section className="directory-table technical-watch-table">
          <header><span>Athlete</span><span>Club</span><span>Coach</span><span>Analyses</span><span>Derniere analyse</span><span>Score moyen</span><span>Points a traiter</span><span>Action</span></header>
          {rows.map(({ athlete, analysisCount, lastAnalysisAt, averageScore, reasons }) => (
            <article key={athlete.uid}>
              <div className="directory-person"><ProfileAvatar photoUrl={athlete.profilePhotoUrl} firstName={athlete.firstName} lastName={athlete.lastName} /><span><strong>{athlete.firstName} {athlete.lastName}</strong><small>{athlete.email || DATA_UNAVAILABLE}</small></span></div>
              <span>{athlete.clubId ?? DATA_UNAVAILABLE}</span>
              <span>{athlete.coachId ?? athlete.coachIds?.join(", ") ?? DATA_UNAVAILABLE}</span>
              <span>{analysisCount}</span>
              <span>{formatDate(lastAnalysisAt)}</span>
              <span>{averageScore == null ? DATA_UNAVAILABLE : averageScore.toFixed(1)}</span>
              <span>{reasons.join(", ")}</span>
              <span className="directory-actions"><Link href={`/athletes/${athlete.uid}`} aria-label="Voir"><Eye /></Link></span>
            </article>
          ))}
        </section>
      ) : (
        <div className="empty-state"><AlertTriangle /><h2>{DATA_UNAVAILABLE}</h2><p>Aucun athlete a surveiller dans le scope Firebase actuel.</p></div>
      )}
    </AppShell>
  );
}

export default function Page() {
  return <WatchedAthletesPage />;
}
