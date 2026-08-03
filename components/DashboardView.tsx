"use client";

import { Activity, AlertTriangle, BarChart3, Bell, CalendarDays, Dumbbell, FileVideo, Gauge, Medal, Radio, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
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

          {role === "TECHNICAL_DIRECTOR" && (
            <section className="technical-hero reference-card">
              <div>
                <small>Performance globale</small>
                <strong>{data?.kpis.find((item) => item.label === "Score technique moyen")?.value ?? "0"} / 100</strong>
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
