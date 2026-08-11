"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BarChart3, ChevronRight, FileBarChart, Target, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DATA_UNAVAILABLE } from "@/lib/data-availability";
import { useAuth } from "@/providers/AuthProvider";
import { getTechnicalDirectorOverview, type TechnicalDirectorOverview } from "@/services/technical-director-service";

function TechnicalDirectorDashboard() {
  const { profile } = useAuth();
  const [overview, setOverview] = useState<TechnicalDirectorOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    void getTechnicalDirectorOverview(profile)
      .then(setOverview)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Impossible de charger la direction technique."));
  }, [profile]);

  if (!profile) return null;

  return (
    <AppShell
      dashboardMode
      title="Direction Technique"
      subtitle="Supervision sportive basee sur les donnees Firebase du scope."
      headerActions={<><Link className="button primary" href="/technical-director/athletes-a-surveiller"><Target />Athletes a surveiller</Link><Link className="button ghost" href="/rapports"><FileBarChart />Rapport technique</Link></>}
    >
      <div className="role-dashboard technical-director-workspace">
        {error && <div className="error-card">{error}</div>}
        {!overview ? (
          <div className="loading-card">Chargement...</div>
        ) : (
          <>
            <section className="reference-stats">
              {overview.kpis.map((item, index) => {
                const Icon = [Users, Users, Users, BarChart3, BarChart3, Target][index] ?? BarChart3;
                return <article key={item.label}><Icon /><div><small>{item.label}</small><strong>{item.value}</strong><em>{item.detail}</em></div></article>;
              })}
            </section>

            <section className="technical-hero reference-card">
              <div>
                <small>Scope Firebase</small>
                <strong>{overview.scopeClubIds.length ? overview.scopeClubIds.join(", ") : DATA_UNAVAILABLE}</strong>
                <span>La Direction Technique ne voit que les clubs autorises dans son profil Firebase.</span>
              </div>
              <div>
                <small>Priorite terrain</small>
                <strong>{overview.watchedAthletes.length ? `${overview.watchedAthletes.length} athlete(s)` : DATA_UNAVAILABLE}</strong>
                <span>Liste construite depuis les analyses, affectations coach et champs de profil disponibles.</span>
              </div>
            </section>

            <section className="role-widget-grid">
              <article className="role-widget reference-card">
                <div className="reference-card-title"><h2>Alertes techniques</h2><AlertTriangle /></div>
                {overview.alerts.length ? overview.alerts.map((alert) => <p key={alert.title}><strong>{alert.title}</strong><br />{alert.detail}</p>) : <p>{DATA_UNAVAILABLE}</p>}
              </article>
              <article className="role-widget reference-card">
                <div className="reference-card-title"><h2>Athletes a surveiller</h2><Target /></div>
                {overview.watchedAthletes.length ? overview.watchedAthletes.slice(0, 5).map((row) => <p key={row.athlete.uid}>{row.athlete.firstName} {row.athlete.lastName} - {row.reasons.join(", ")}</p>) : <p>{DATA_UNAVAILABLE}</p>}
                <Link href="/technical-director/athletes-a-surveiller">Voir la liste <ChevronRight /></Link>
              </article>
              <article className="role-widget reference-card">
                <div className="reference-card-title"><h2>Performance technique</h2><BarChart3 /></div>
                <p>{overview.analyses.length ? `${overview.analyses.length} analyse(s) Firebase dans le scope.` : DATA_UNAVAILABLE}</p>
                <Link href="/analyses">Voir les analyses <ChevronRight /></Link>
              </article>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function Page() {
  return <TechnicalDirectorDashboard />;
}
