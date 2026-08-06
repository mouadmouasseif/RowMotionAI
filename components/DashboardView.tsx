"use client";

import { Activity, AlertTriangle, Award, BarChart3, Bell, CalendarDays, ChevronRight, Clock, Dumbbell, FileVideo, Gauge, MapPin, Medal, Play, Radio, Star, TrendingUp, Trophy, Upload, Users, Utensils, Zap } from "lucide-react";
import Image from "next/image";
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
const athleteTrend = [
  { day: "Lun", distance: 800, power: 150, score: 45 },
  { day: "Mar", distance: 900, power: 190, score: 55 },
  { day: "Mer", distance: 960, power: 175, score: 52 },
  { day: "Jeu", distance: 1080, power: 205, score: 58 },
  { day: "Ven", distance: 1250, power: 245, score: 70 },
  { day: "Sam", distance: 1360, power: 220, score: 62 },
  { day: "Dim", distance: 1248, power: 268, score: 76 },
];

const zoneRows = [
  { label: "UT2", value: 45, time: "26h 18m", color: "#2388ff" },
  { label: "UT1", value: 25, time: "14h 36m", color: "#38d39a" },
  { label: "AT", value: 15, time: "8h 46m", color: "#ffbb45" },
  { label: "TR", value: 10, time: "5h 50m", color: "#8c5cff" },
  { label: "AN", value: 5, time: "2h 54m", color: "#ff5d74" },
];

const analysisSplit = [
  { label: "Ergometre", value: 52, color: "#2388ff" },
  { label: "Sur l'eau", value: 28, color: "#38d39a" },
  { label: "Force", value: 12, color: "#ffbb45" },
  { label: "Mobilite", value: 8, color: "#8c5cff" },
];

const muscleRows = [
  ["Dos", 92],
  ["Jambes", 88],
  ["Bras", 76],
  ["Gainage", 85],
  ["Epaules", 70],
] as const;

const heartValues = [78, 102, 88, 124, 108, 132, 162];

function sparkline(values: number[], max = Math.max(...values)) {
  const width = 320;
  const height = 150;
  const step = width / (values.length - 1);
  return values.map((value, index) => `${index * step},${height - (value / max) * (height - 12)}`).join(" ");
}

function donutGradient(rows: { value: number; color: string }[]) {
  let cursor = 0;
  return `conic-gradient(${rows.map((row) => {
    const start = cursor;
    cursor += row.value;
    return `${row.color} ${start}% ${cursor}%`;
  }).join(", ")})`;
}

function getKpiValue(data: RoleDashboardData | null, label: string, fallback: string) {
  return data?.kpis.find((item) => item.label === label)?.value || fallback;
}

function AthleteDashboard({
  data,
}: {
  data: RoleDashboardData | null;
}) {
  const latest = data?.analyses[0];
  const score100 = Number(getKpiValue(data, "Score technique", "67.5")) || 67.5;
  const score10 = score100 > 10 ? score100 / 10 : score100;
  const analysisCount = Number(getKpiValue(data, "Nombre d'analyses", "15").replace(/\D/g, "")) || 15;
  const rows = data?.rows.length ? data.rows : [
    { cells: ["Analyse terminee", "2000m Test", "10:34"], href: latest ? `/analyses/${latest.id}` : "/analyses" },
    { cells: ["Entrainement termine", "Ergometre - Endurance", "09:00"], href: "/sessions" },
    { cells: ["Nouvelle performance", "6,310 m sur ergometre", "Record"], href: "/progression" },
    { cells: ["Plan d'entrainement", "Endurance fondamentale", "0%"], href: "/plans-entrainement" },
  ];
  const kpis = [
    { label: "Distance totale", value: getKpiValue(data, "Distance totale", "1,248"), unit: "km", trend: "+ 8%", icon: MapPin },
    { label: "Temps total", value: getKpiValue(data, "Temps total", "58h 24m"), unit: "", trend: "+ 6%", icon: Clock },
    { label: "Puissance moyenne", value: getKpiValue(data, "Puissance moyenne", "268"), unit: "w", trend: "+ 7%", icon: Zap },
    { label: "Cadence moyenne", value: getKpiValue(data, "Cadence moyenne", "27"), unit: "spm", trend: "+ 3%", icon: Activity },
    { label: "Score technique", value: score10.toFixed(1), unit: "/10", trend: "+ 9%", icon: Star },
  ];

  return (
    <div className="athlete-reference-dashboard">
      <section className="athlete-kpis">
        {kpis.map(({ icon: Icon, ...card }) => (
          <article className="athlete-kpi-card" key={card.label}>
            <span><Icon /></span>
            <small>{card.label}</small>
            <strong>{card.value} <i>{card.unit}</i></strong>
            <em>{card.trend} <b>vs semaine derniere</b></em>
          </article>
        ))}
      </section>

      <section className="athlete-dashboard-grid">
        <article className="athlete-panel athlete-wide">
          <header><h2>Evolution de vos performances</h2><button>7 jours</button></header>
          <div className="athlete-line-chart">
            <svg viewBox="0 0 360 210" role="img" aria-label="Evolution hebdomadaire">
              {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="28" x2="340" y1={30 + line * 36} y2={30 + line * 36} />)}
              <polyline className="line-distance" points={sparkline(athleteTrend.map((item) => item.distance), 1500)} />
              <polyline className="line-power" points={sparkline(athleteTrend.map((item) => item.power), 400)} />
              <polyline className="line-score" points={sparkline(athleteTrend.map((item) => item.score), 100)} />
              {athleteTrend.map((item, index) => <text key={item.day} x={28 + index * 52} y="202">{item.day}</text>)}
            </svg>
          </div>
          <footer><span className="blue-dot">Distance (km)</span><span className="purple-dot">Puissance (W)</span><span className="green-dot">Score technique (/10)</span></footer>
        </article>

        <article className="athlete-panel athlete-zones">
          <header><h2>Zones d&apos;entrainement</h2></header>
          <div className="athlete-donut-layout">
            <div className="athlete-donut" style={{ background: donutGradient(zoneRows) }}><strong>58h 24m</strong><small>Total</small></div>
            <div className="athlete-zone-list">
              {zoneRows.map((zone) => <p key={zone.label}><i style={{ background: zone.color }} /> <span>{zone.label}</span><b>{zone.value}%</b><small>{zone.time}</small></p>)}
            </div>
          </div>
          <Link href="/training-zones">Voir le detail des zones <ChevronRight /></Link>
        </article>

        <article className="athlete-panel athlete-analysis-card">
          <header><h2>Derniere analyse</h2><strong>2000m Test</strong></header>
          <Link className="athlete-video-thumb" href={latest ? `/analyses/${latest.id}` : "/analyses"}>
            <Image src="/rowing-analysis.png" alt="" fill sizes="220px" />
            <span><Play /></span>
            <small>0:08</small>
          </Link>
          <div className="analysis-meta">
            <p><Clock /> Duree <b>06:10.4</b></p>
            <p><Activity /> Distance <b>2,000 m</b></p>
            <p><Zap /> Puissance moy. <b>312 w</b></p>
            <p><Gauge /> Cadence moy. <b>29 spm</b></p>
            <strong>Score technique <span>{score10.toFixed(1)} /10</span><em>Excellent</em></strong>
          </div>
          <Link href={latest ? `/analyses/${latest.id}` : "/analyses"}>Voir l&apos;analyse complete <ChevronRight /></Link>
        </article>

        <article className="athlete-panel">
          <header><h2>Meilleures performances</h2><Link href="/progression">Voir toutes</Link></header>
          {[["6,310 m", "Ergometre - 03 aout 2026", "Nouveau record"], ["2:18.4 /500m", "Ergometre - 03 aout 2026", ""], ["1,024 w", "Puissance max - 03 aout 2026", ""], ["28 spm", "Cadence max - 28 juil. 2026", ""], [`${score10.toFixed(1)} /10`, "Score technique - 03 aout 2026", ""]].map((record, index) => (
            <div className="athlete-record" key={record[0]}><span>{index === 0 || index === 2 ? <Trophy /> : index === 4 ? <Star /> : <Award />}</span><div><strong>{record[0]}</strong><small>{record[1]}</small></div>{record[2] && <em>{record[2]}</em>}</div>
          ))}
        </article>

        <article className="athlete-panel athlete-compact">
          <header><h2>Repartition des analyses</h2></header>
          <div className="athlete-donut-layout compact">
            <div className="athlete-donut small" style={{ background: donutGradient(analysisSplit) }}><strong>{analysisCount}</strong><small>Analyses</small></div>
            <div className="athlete-zone-list">
              {analysisSplit.map((item) => <p key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><b>{item.value}%</b></p>)}
            </div>
          </div>
        </article>

        <article className="athlete-panel athlete-compact athlete-muscles">
          <header><h2>Groupes musculaires</h2></header>
          <div className="muscle-body"><Dumbbell />{muscleRows.map(([label, value]) => <p key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></p>)}</div>
          <Link href="/analyses">Voir le detail <ChevronRight /></Link>
        </article>

        <article className="athlete-panel athlete-heart">
          <header><h2>Frequence cardiaque (moyenne)</h2><button>bpm</button></header>
          <strong>142 <i>bpm</i></strong>
          <em>+ 6 bpm vs semaine derniere</em>
          <svg viewBox="0 0 320 150" role="img" aria-label="Frequence cardiaque moyenne">
            {[0, 1, 2, 3].map((line) => <line key={line} x1="20" x2="310" y1={25 + line * 32} y2={25 + line * 32} />)}
            <polyline points={sparkline(heartValues, 180)} />
          </svg>
        </article>

        <article className="athlete-panel athlete-wide">
          <header><h2>Activite recente</h2></header>
          <div className="athlete-activity-list">
            {rows.slice(0, 4).map((row, index) => <Link href={row.href ?? "#"} key={`${row.cells[0]}-${index}`}><span><Activity /></span><div><strong>{row.cells[0]}</strong><small>{row.cells[1] ?? "RowMotion AI"}</small></div><em>{row.cells[2] ?? "Aujourd'hui"}</em></Link>)}
          </div>
          <Link href="/analyses">Voir tout l&apos;historique <ChevronRight /></Link>
        </article>

        <article className="athlete-panel">
          <header><h2>Plan d&apos;entrainement actuel</h2><small>Semaine 1/8</small></header>
          <h3>Endurance Fondamentale</h3>
          <p>35% complete <span>4h 20m / 12h 00m</span></p>
          <div className="athlete-progress"><i style={{ width: "35%" }} /></div>
          <div className="next-session"><small>Prochaine seance</small><strong>Demain - 10:00 - Ergometre</strong><em>1h00</em></div>
          <Link href="/plans-entrainement">Voir le plan complet <ChevronRight /></Link>
        </article>

        <article className="athlete-panel athlete-wide nutrition-panel">
          <header><h2>Nutrition du jour</h2></header>
          <div className="nutrition-layout"><div className="athlete-donut nutrition"><Utensils /><strong>1,850</strong><small>/2,400 kcal</small></div><div>{[["Proteines", "126 g / 160 g", 79], ["Glucides", "219 g / 280 g", 75], ["Lipides", "58 g / 70 g", 83]].map(([label, value, pct]) => <p key={label as string}><span>{label}<small>{value}</small></span><i><b style={{ width: `${pct}%` }} /></i><strong>{pct}%</strong></p>)}</div></div>
          <Link href="/plans-entrainement">Voir le journal alimentaire <ChevronRight /></Link>
        </article>

        <article className="athlete-panel">
          <header><h2>Notifications</h2><Link href="/notifications">Tout marquer comme lu</Link></header>
          {["Votre analyse est prete", "Rappel d'entrainement", "Nouveau conseil", "Mise a jour du plan"].map((note, index) => <Link className="athlete-note" href="/notifications" key={note}><Bell /><span>{note}<small>{index === 0 ? "Aujourd'hui" : `Il y a ${index} h`}</small></span><ChevronRight /></Link>)}
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
