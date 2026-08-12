"use client";

import { Activity, AlertTriangle, BarChart3, Bell, CalendarDays, ChevronRight, Clock, Dumbbell, FileVideo, Gauge, MapPin, Medal, Play, Radio, Star, TrendingUp, Upload, Users, Utensils, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DATA_UNAVAILABLE } from "@/lib/data-availability";
import { useAuth } from "@/providers/AuthProvider";
import {
  getAthleteDashboardData,
  getClubDashboardData,
  getCoachDashboardData,
  getJuryDashboardData,
  getSuperAdminDashboardData,
  getTechnicalDirectorDashboardData,
  type RoleDashboardData,
} from "@/services/dashboard-service";
import type { UserRole } from "@/types/user";

const roleCopy: Record<UserRole, { title: string; subtitle: (firstName: string) => string; widgets: string[] }> = {
  ATHLETE: {
    title: "Tableau de bord athlete",
    subtitle: (firstName) => `Bonjour ${firstName}. Voici un apercu de vos performances aujourd'hui.`,
    widgets: ["Evolution de vos performances", "Zones d'entrainement", "Derniere analyse", "Meilleures performances", "Repartition des analyses", "Groupes musculaires", "Frequence cardiaque", "Activite recente", "Plan d'entrainement actuel", "Notifications"],
  },
  COACH: {
    title: "Tableau de bord coach",
    subtitle: (firstName) => `Bonjour Coach ${firstName}. Voici un apercu de votre equipe aujourd'hui.`,
    widgets: ["Evolution de l'equipe", "Repartition zones equipe", "Activite des athletes", "Performances cles", "Repartition des analyses", "Types d'analyses frequents", "Score technique moyen", "Plan equipe", "Calendrier", "Notifications", "Messages", "Charge d'entrainement"],
  },
  CLUB_ADMIN: {
    title: "Tableau de bord club",
    subtitle: () => "Vue d'ensemble des activites et performances du club.",
    widgets: ["Evolution performance club", "Repartition entrainements", "Top athletes", "Activite club", "Analyses par type", "Statistiques saison", "Top competitions", "Calendrier club", "Infrastructures", "Equipements", "Notifications", "Performance par groupe"],
  },
  TECHNICAL_DIRECTOR: {
    title: "Directeur Technique",
    subtitle: () => "Vue strategique multi-equipe et supervision de la performance sportive.",
    widgets: ["Indice de performance globale", "Etat des athletes", "Top progressions", "Athletes a surveiller", "Coaches", "Repartition entrainement", "Tests", "Biomecanique moyenne", "Puissance musculaire", "Prochaines competitions", "Planification", "Alertes"],
  },
  FEDERATION_PRESIDENT: {
    title: "President de federation",
    subtitle: () => "Vue federation et supervision globale de la performance sportive.",
    widgets: ["Indice de performance globale", "Etat des athletes", "Top progressions", "Athletes a surveiller", "Coaches", "Repartition entrainement", "Tests", "Biomecanique moyenne", "Puissance musculaire", "Prochaines competitions", "Planification", "Alertes"],
  },
  SUPER_ADMIN: {
    title: "Tableau de bord Superadmin",
    subtitle: () => "Vue plateforme globale RowMotion AI.",
    widgets: ["Evolution globale analyses", "Activite temps reel", "Repartition utilisateurs", "Gestion athletes", "Coaches", "Directeurs techniques", "Clubs", "Competitions", "Jury", "Statistiques plateforme", "Top clubs", "Alertes systeme", "Etat systeme", "Actions rapides"],
  },
  JURY: {
    title: "Tableau de bord Jury",
    subtitle: () => "Affectations, courses et resultats a valider.",
    widgets: ["Competitions assignees", "Courses aujourd'hui", "Departs", "Resultats a valider", "Penalites", "Protestations", "Prochaines affectations"],
  },
};

const widgetIcons = [BarChart3, Gauge, FileVideo, Medal, Activity, Dumbbell, TrendingUp, CalendarDays, Bell, Radio, Users, AlertTriangle];

function sparkline(values: number[], max = Math.max(...values)) {
  const width = 320;
  const height = 150;
  const step = width / (values.length - 1);
  return values.map((value, index) => `${index * step},${height - (value / max) * (height - 12)}`).join(" ");
}

function getKpiValue(data: RoleDashboardData | null, label: string, fallback: string) {
  return data?.kpis.find((item) => item.label === label)?.value || fallback;
}

function numericKpi(data: RoleDashboardData | null, label: string) {
  const value = getKpiValue(data, label, DATA_UNAVAILABLE);
  if (value === DATA_UNAVAILABLE) return null;
  const parsed = Number(value.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function AthleteDashboard({
  data,
}: {
  data: RoleDashboardData | null;
}) {
  const latest = data?.analyses[0];
  const score100 = numericKpi(data, "Score technique");
  const score10 = score100 == null ? null : score100 > 10 ? score100 / 10 : score100;
  const analysisCount = Number(getKpiValue(data, "Nombre d'analyses", "0").replace(/\D/g, "")) || 0;
  const rows = data?.rows ?? [];
  const kpis = [
    { label: "Distance totale", value: getKpiValue(data, "Distance totale", DATA_UNAVAILABLE), unit: "km", icon: MapPin },
    { label: "Temps total", value: getKpiValue(data, "Temps total", DATA_UNAVAILABLE), unit: "", icon: Clock },
    { label: "Puissance moyenne", value: getKpiValue(data, "Puissance moyenne", DATA_UNAVAILABLE), unit: "w", icon: Zap },
    { label: "Cadence moyenne", value: getKpiValue(data, "Cadence moyenne", DATA_UNAVAILABLE), unit: "spm", icon: Activity },
    { label: "Score technique", value: score10 == null ? DATA_UNAVAILABLE : score10.toFixed(1), unit: "/10", icon: Star },
  ];

  return (
    <div className="athlete-reference-dashboard">
      <section className="athlete-kpis">
        {kpis.map(({ icon: Icon, ...card }) => (
          <article className="athlete-kpi-card" key={card.label}>
            <span><Icon /></span>
            <small>{card.label}</small>
            <strong>{card.value} <i>{card.value === DATA_UNAVAILABLE ? "" : card.unit}</i></strong>
            <em>{card.value === DATA_UNAVAILABLE ? DATA_UNAVAILABLE : "Donnees Firebase"}</em>
          </article>
        ))}
      </section>

      <section className="athlete-dashboard-grid">
        <article className="athlete-panel athlete-wide">
          <header><h2>Evolution de vos performances</h2><button>7 jours</button></header>
          {latest?.cadenceTimeline?.length ? <div className="athlete-line-chart">
            <svg viewBox="0 0 360 210" role="img" aria-label="Evolution hebdomadaire">
              {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="28" x2="340" y1={30 + line * 36} y2={30 + line * 36} />)}
              <polyline className="line-score" points={sparkline(latest.cadenceTimeline.map((item) => item.value), Math.max(...latest.cadenceTimeline.map((item) => item.value), 1))} />
            </svg>
          </div> : <EmptyState label={DATA_UNAVAILABLE} />}
          <footer><span className="green-dot">Cadence depuis Firebase</span></footer>
        </article>

        <article className="athlete-panel athlete-zones">
          <header><h2>Zones d&apos;entrainement</h2></header>
          <EmptyState label={DATA_UNAVAILABLE} />
          <Link href="/training-zones">Voir le detail des zones <ChevronRight /></Link>
        </article>

        <article className="athlete-panel athlete-analysis-card">
          <header><h2>Derniere analyse</h2><strong>{latest?.fileName || latest?.athleteName || DATA_UNAVAILABLE}</strong></header>
          <Link className="athlete-video-thumb" href={latest ? `/analyses/${latest.id}` : "/analyses"}>
            <Image src="/rowing-analysis.png" alt="" fill sizes="220px" />
            <span><Play /></span>
            <small>{latest?.durationSeconds ? `${Math.floor(latest.durationSeconds / 60)}:${String(Math.round(latest.durationSeconds % 60)).padStart(2, "0")}` : DATA_UNAVAILABLE}</small>
          </Link>
          <div className="analysis-meta">
            <p><Clock /> Duree <b>{latest?.durationSeconds ? `${Math.floor(latest.durationSeconds / 60)}:${String(Math.round(latest.durationSeconds % 60)).padStart(2, "0")}` : DATA_UNAVAILABLE}</b></p>
            <p><Activity /> Distance <b>{latest?.distance ? `${latest.distance} m` : DATA_UNAVAILABLE}</b></p>
            <p><Zap /> Puissance moy. <b>{latest?.metrics?.estimatedPower == null ? DATA_UNAVAILABLE : `${Math.round(latest.metrics.estimatedPower)} w`}</b></p>
            <p><Gauge /> Cadence moy. <b>{latest?.metrics?.strokeRate == null ? DATA_UNAVAILABLE : `${Math.round(latest.metrics.strokeRate)} spm`}</b></p>
            <strong>Score technique <span>{score10 == null ? DATA_UNAVAILABLE : `${score10.toFixed(1)} /10`}</span><em>{latest ? "Firebase" : DATA_UNAVAILABLE}</em></strong>
          </div>
          <Link href={latest ? `/analyses/${latest.id}` : "/analyses"}>Voir l&apos;analyse complete <ChevronRight /></Link>
        </article>

        <article className="athlete-panel">
          <header><h2>Meilleures performances</h2><Link href="/progression">Voir toutes</Link></header>
          <EmptyState label={DATA_UNAVAILABLE} />
        </article>

        <article className="athlete-panel athlete-compact">
          <header><h2>Repartition des analyses</h2></header>
          <div className="athlete-donut-layout compact">
            <div className="athlete-donut small"><strong>{analysisCount}</strong><small>Analyses</small></div>
            {analysisCount ? <div className="athlete-zone-list"><p><i style={{ background: "#2388ff" }} /><span>Firebase</span><b>100%</b></p></div> : <EmptyState label={DATA_UNAVAILABLE} />}
          </div>
        </article>

        <article className="athlete-panel athlete-compact athlete-muscles">
          <header><h2>Groupes musculaires</h2></header>
          <div className="muscle-body"><Dumbbell /><EmptyState label={DATA_UNAVAILABLE} /></div>
          <Link href="/analyses">Voir le detail <ChevronRight /></Link>
        </article>

        <article className="athlete-panel athlete-heart">
          <header><h2>Frequence cardiaque (moyenne)</h2><button>bpm</button></header>
          <strong>{DATA_UNAVAILABLE}</strong>
          <em>{DATA_UNAVAILABLE}</em>
          <EmptyState label={DATA_UNAVAILABLE} />
        </article>

        <article className="athlete-panel athlete-wide">
          <header><h2>Activite recente</h2></header>
          <div className="athlete-activity-list">
            {rows.length ? rows.slice(0, 4).map((row, index) => <Link href={row.href ?? "#"} key={`${row.cells[0]}-${index}`}><span><Activity /></span><div><strong>{row.cells[0]}</strong><small>{row.cells[1] ?? DATA_UNAVAILABLE}</small></div><em>{row.cells[2] ?? DATA_UNAVAILABLE}</em></Link>) : <EmptyState label={DATA_UNAVAILABLE} />}
          </div>
          <Link href="/analyses">Voir tout l&apos;historique <ChevronRight /></Link>
        </article>

        <article className="athlete-panel">
          <header><h2>Plan d&apos;entrainement actuel</h2><small>{DATA_UNAVAILABLE}</small></header>
          <h3>{DATA_UNAVAILABLE}</h3>
          <p>{DATA_UNAVAILABLE} <span>{DATA_UNAVAILABLE}</span></p>
          <div className="athlete-progress"><i style={{ width: "0%" }} /></div>
          <div className="next-session"><small>Prochaine seance</small><strong>{DATA_UNAVAILABLE}</strong><em>{DATA_UNAVAILABLE}</em></div>
          <Link href="/plans-entrainement">Voir le plan complet <ChevronRight /></Link>
        </article>

        <article className="athlete-panel athlete-wide nutrition-panel">
          <header><h2>Nutrition du jour</h2></header>
          <div className="nutrition-layout"><div className="athlete-donut nutrition"><Utensils /><strong>{DATA_UNAVAILABLE}</strong></div><EmptyState label={DATA_UNAVAILABLE} /></div>
          <Link href="/plans-entrainement">Voir le journal alimentaire <ChevronRight /></Link>
        </article>

        <article className="athlete-panel">
          <header><h2>Notifications</h2><Link href="/notifications">Tout marquer comme lu</Link></header>
          <EmptyState label={DATA_UNAVAILABLE} />
          <Link href="/notifications">Voir toutes les notifications <ChevronRight /></Link>
        </article>
      </section>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="role-dashboard">
      <section className="reference-stats">
        {Array.from({ length: 6 }, (_, index) => <article className="skeleton-card" key={index} />)}
      </section>
      <section className="role-widget-grid">
        {Array.from({ length: 6 }, (_, index) => <article className="role-widget skeleton-card" key={index} />)}
      </section>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="empty-inline">
      <AlertTriangle />
      <span>{label}</span>
    </div>
  );
}

function useRoleDashboardData(role: UserRole | null, enabled: boolean) {
  const { profile } = useAuth();
  const [data, setData] = useState<RoleDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile || !role || !enabled) return;
    let disposed = false;
    setLoading(true);
    setError("");
    const loaders = {
      ATHLETE: () => getAthleteDashboardData(profile),
      COACH: () => getCoachDashboardData(profile),
      CLUB_ADMIN: () => getClubDashboardData(profile),
      TECHNICAL_DIRECTOR: () => getTechnicalDirectorDashboardData(profile),
      FEDERATION_PRESIDENT: () => getTechnicalDirectorDashboardData(profile),
      SUPER_ADMIN: () => getSuperAdminDashboardData(profile),
      JURY: () => getJuryDashboardData(),
    } satisfies Record<UserRole, () => Promise<RoleDashboardData>>;

    loaders[role]()
      .then((value) => { if (!disposed) setData(value); })
      .catch((reason) => { if (!disposed) setError(reason instanceof Error ? reason.message : "Impossible de charger le dashboard."); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [enabled, profile, role]);

  return { data, loading, error };
}

export function DashboardView({ previewRole }: { previewRole?: UserRole }) {
  const { profile } = useAuth();
  const role = previewRole ?? profile?.role ?? null;
  const firstName = profile?.firstName || profile?.displayName || "RowMotion";
  const copy = role ? roleCopy[role] : null;
  const { data, loading, error } = useRoleDashboardData(role, Boolean(profile));
  const todayLabel = useMemo(() => new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }), []);

  if (!profile || !role || !copy) return null;

  if (role === "ATHLETE") {
    const athleteHeaderActions = (
      <div className="athlete-header-actions">
        <button className="athlete-date-button"><CalendarDays /> Aujourd&apos;hui, {todayLabel}</button>
        <Link className="button primary" href="/analyses/nouvelle"><Upload /> Importer une video</Link>
        <Link className="athlete-bell" href="/notifications" aria-label="Notifications"><Bell /><span>3</span></Link>
      </div>
    );

    return (
      <AppShell dashboardMode title={`Bonjour ${firstName} !`} subtitle="Voici un apercu de vos performances aujourd'hui." headerActions={athleteHeaderActions}>
        {previewRole && <div className="preview-banner">Mode previsualisation Superadmin</div>}
        {loading ? <SkeletonDashboard /> : (
          <>
            {error && <div className="auth-error">{error}</div>}
            <AthleteDashboard data={data} />
          </>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell dashboardMode title={copy.title} subtitle={copy.subtitle(firstName)}>
      {previewRole && <div className="preview-banner">Mode previsualisation Superadmin</div>}
      {loading ? <SkeletonDashboard /> : (
        <div className="role-dashboard">
          {error && <div className="auth-error">{error}</div>}
          <section className="reference-stats">
            {(data?.kpis ?? []).map((card, index) => {
              const Icon = widgetIcons[index % widgetIcons.length];
              return (
                <article key={card.label}>
                  <Icon className={card.tone ?? ""} />
                  <div>
                    <small>{card.label}</small>
                    <strong>{card.value} <i>{card.unit ?? ""}</i></strong>
                    <em>{data?.analyses.length ? "Donnees Firebase" : "Aucune donnee"}</em>
                  </div>
                </article>
              );
            })}
          </section>

          {(role === "TECHNICAL_DIRECTOR" || role === "FEDERATION_PRESIDENT") && (
            <section className="technical-hero reference-card">
              <div>
                <small>Performance globale</small>
                <strong>{data?.kpis.find((item) => item.label === "Score technique moyen")?.value ?? DATA_UNAVAILABLE} / 100</strong>
                <span>Technique, puissance, endurance, regularite et progression sont calculees depuis les analyses disponibles.</span>
              </div>
              <div>
                <small>Etat de preparation competition</small>
                <strong>Aucune competition planifiee</strong>
                <span>Les competitions s&apos;afficheront ici lorsque Firestore contient des evenements de scope.</span>
              </div>
            </section>
          )}

          {role === "SUPER_ADMIN" && (
            <section className="quick-actions reference-card">
              {["+ Ajouter athlete", "+ Ajouter coach", "+ Ajouter directeur technique", "+ Creer club", "+ Creer competition", "+ Ajouter jury", "+ Generer rapport global"].map((label) => (
                <Link className="button ghost" href={label.includes("club") ? "/super-admin/clubs" : label.includes("rapport") ? "/rapports" : "/super-admin/users"} key={label}>{label}</Link>
              ))}
              <Link className="button primary" href="/super-admin/preview?role=COACH">Voir comme</Link>
            </section>
          )}

          <section className="role-widget-grid">
            {copy.widgets.map((label, index) => {
              const Icon = widgetIcons[index % widgetIcons.length];
              return (
                <article className="role-widget reference-card" key={label}>
                  <div className="reference-card-title"><h2>{label}</h2><Icon /></div>
                  {index === 0 && data?.analyses.length ? (
                    <p>{data.analyses.length} analyse(s) chargee(s) depuis Firebase au {todayLabel}.</p>
                  ) : index === 2 && data?.analyses[0] ? (
                    <Link href={`/analyses/${data.analyses[0].id}`}>{data.analyses[0].fileName || data.analyses[0].athleteName || "Derniere analyse"}</Link>
                  ) : (
                    <EmptyState label="Aucune donnee Firebase disponible pour ce widget." />
                  )}
                </article>
              );
            })}
          </section>

          {data?.rows.length ? (
            <section className="role-table reference-card">
              <h2>{role === "COACH" ? "Activite athlete" : "Activite recente"}</h2>
              <div>
                {data.rows.map((row, index) => (
                  <Link href={row.href ?? "#"} key={`${row.cells.join("-")}-${index}`}>
                    {row.cells.map((cell) => <span key={cell}>{cell}</span>)}
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="reference-card"><EmptyState label="Aucune ligne d'activite disponible." /></section>
          )}
        </div>
      )}
    </AppShell>
  );
}
