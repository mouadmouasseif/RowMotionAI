"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardPlus,
  Database,
  FileBarChart,
  Landmark,
  LineChart,
  Mic,
  PlayCircle,
  Radio,
  Server,
  ShieldCheck,
  Trophy,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { getSuperAdminDashboardData, type RoleDashboardData } from "@/services/dashboard-service";

const kpiFallback = [
  ["Athletes", "1,248", "+ 18%", Users, "blue"],
  ["Coachs", "156", "+ 12%", UserPlus, "green"],
  ["Clubs", "48", "+ 9%", Landmark, "purple"],
  ["Competitions", "32", "+ 22%", Trophy, "red"],
  ["Jury / Juree", "84", "+ 14%", Mic, "violet"],
  ["Analyses totales", "5,632", "+ 16%", LineChart, "purple"],
] as const;

const chartRows = [
  { label: "Analyses", color: "#2589ff", values: [320, 430, 480, 560, 690, 610, 745, 820, 795, 875, 835, 960] },
  { label: "Ergometre", color: "#26d59b", values: [160, 230, 300, 335, 320, 350, 410, 515, 510, 545, 490, 650] },
  { label: "Sur l'eau", color: "#ffbd39", values: [92, 145, 105, 160, 150, 142, 170, 230, 205, 185, 200, 235] },
];

const activityRows = [
  ["Nouvelle analyse ajoutee", "Par Yassine El.", "Il y a 2 min", Users, "blue"],
  ["Athlete inscrit", "Sofia Benali", "Il y a 4 min", UserPlus, "cyan"],
  ["Coach ajoute", "Mohamed Tahiri", "Il y a 6 min", Users, "blue"],
  ["Resultat competition publie", "Championnat du Maroc", "Il y a 8 min", Trophy, "gold"],
  ["Juge affecte", "Salma Kaddouri", "Il y a 11 min", Mic, "purple"],
] as const;

const managementCards = [
  ["Gestion des athletes", "Athletes", "1,248", "+ 18%", Users, "#2589ff", "/super-admin/athletes"],
  ["Gestion des coachs", "Coachs", "156", "+ 12%", UserPlus, "#26d59b", "/super-admin/coachs"],
  ["Gestion des clubs", "Clubs", "48", "+ 9%", Landmark, "#ffbd39", "/super-admin/clubs"],
  ["Gestion des competitions", "Competitions", "32", "+ 22%", Trophy, "#ff566a", "/competitions"],
  ["Gestion des jury / juree", "Jury / Juree", "84", "+ 14%", Mic, "#9b63ff", "/jury/dashboard"],
] as const;

const platformStats = [
  ["Sessions actives", "3,856", "+ 15%", ShieldCheck],
  ["Videos importees", "2,145", "+ 18%", Upload],
  ["Heures d'entrainement", "8,432 h", "+ 16%", CalendarDays],
  ["Distance totale ramee", "12,547 km", "+ 14%", LineChart],
  ["Ergometre", "4,210 h", "+ 17%", Activity],
  ["Utilisateurs actifs", "1,124", "+ 13%", Users],
] as const;

const topClubs = [
  ["Yacht Club Rabat", "238 athletes", "+12%"],
  ["CASABLANCA Rowing Club", "186 athletes", "+9%"],
  ["AS-SALE Nautique", "142 athletes", "+7%"],
  ["Club Aviron Marrakech", "118 athletes", "+5%"],
  ["CNPR Aviron", "96 athletes", "+4%"],
] as const;

const topCompetitions = [
  ["Championnat du Maroc", "156 participants", "En cours"],
  ["Coupe du Trone", "132 participants", "Terminee"],
  ["Regate Internationale Rabat", "98 participants", "En cours"],
  ["Open Rowing Casablanca", "87 participants", "A venir"],
  ["Beach Rowing Sprint Cup", "76 participants", "Terminee"],
] as const;

const alerts = [
  ["3 competitions arrivent a echeance", "Verifier les dates limites", "Il y a 15 min", "red"],
  ["12 athletes sans coach", "Affectation recommandee", "Il y a 1 h", "gold"],
  ["5 videos en attente d'analyse", "Dans la file de traitement", "Il y a 2 h", "blue"],
  ["Mises a jour disponibles", "Version 2.0.1 prete", "Il y a 3 h", "green"],
  ["Sauvegarde automatique", "Systeme OK", "Il y a 4 h", "green"],
] as const;

const systemRows = [
  ["Serveur principal", "En ligne", Server],
  ["Base de donnees", "En ligne", Database],
  ["Stockage", "En ligne", Upload],
  ["Traitement video IA", "En ligne", PlayCircle],
  ["Notifications", "En ligne", Bell],
  ["Sauvegarde", "OK - a jour", ShieldCheck],
] as const;

function pathFromValues(values: number[], width = 320, height = 120) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const spread = Math.max(max - min, 1);
  return values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / spread) * (height - 18) - 8;
    return `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function getKpi(data: RoleDashboardData | null, label: string, fallback: string) {
  return data?.kpis.find((item) => item.label === label)?.value ?? fallback;
}

function SuperAdminDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<RoleDashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    let disposed = false;
    void getSuperAdminDashboardData(profile)
      .then((value) => { if (!disposed) setData(value); })
      .catch((reason) => { if (!disposed) setError(reason instanceof Error ? reason.message : "Impossible de charger les donnees."); });
    return () => { disposed = true; };
  }, [profile]);

  const todayLabel = useMemo(() => new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }), []);
  const headerActions = (
    <div className="superadmin-actions">
      <Link className="button primary" href="/rapports"><FileBarChart />Rapport global</Link>
      <Link className="button ghost" href="/analyses/live"><Radio />Analyse en direct</Link>
      <Link className="superadmin-bell" href="/notifications" aria-label="Notifications"><Bell /><span>3</span></Link>
      <button className="superadmin-date"><CalendarDays />Aujourd&apos;hui, {todayLabel}<ChevronDown /></button>
    </div>
  );

  return (
    <AppShell dashboardMode title="Tableau de bord Superadmin" subtitle="Vue globale de toute la plateforme RowMotion AI." headerActions={headerActions}>
      <div className="superadmin-dashboard">
        {error && <div className="error-card">{error}</div>}

        <section className="superadmin-kpis">
          {kpiFallback.map(([label, fallback, trend, Icon, tone]) => (
            <article key={label} className={`superadmin-card kpi ${tone}`}>
              <span><Icon /></span>
              <small>{label}</small>
              <strong>{getKpi(data, label, fallback)}</strong>
              <em>{trend} <b>vs semaine derniere</b></em>
            </article>
          ))}
        </section>

        <section className="superadmin-grid top">
          <article className="superadmin-card chart-card-main">
            <header><h2>Evolution globale des analyses</h2><button>30 jours <ChevronDown /></button></header>
            <svg viewBox="0 0 360 190" role="img" aria-label="Evolution globale des analyses">
              {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="26" x2="342" y1={25 + line * 31} y2={25 + line * 31} />)}
              {chartRows.map((row) => <path key={row.label} d={pathFromValues(row.values, 316, 138)} transform="translate(26 22)" style={{ stroke: row.color }} />)}
            </svg>
            <footer>{chartRows.map((row) => <span key={row.label}><i style={{ background: row.color }} />{row.label}</span>)}</footer>
          </article>

          <article className="superadmin-card live-card">
            <h2>Activite en temps reel</h2>
            {activityRows.map(([title, body, time, Icon, tone]) => (
              <p key={title}><i className={tone}><Icon /></i><span><strong>{title}</strong><small>{body}</small></span><em>{time}</em></p>
            ))}
            <Link href="/notifications">Voir toute l&apos;activite en direct</Link>
          </article>

          <article className="superadmin-card global-split">
            <h2>Repartition globale</h2>
            <div className="superadmin-donut"><strong>1,568</strong><small>Total utilisateurs</small></div>
            <div className="split-legend">
              {["Athletes 52%", "Coachs 20%", "Clubs 15%", "Competitions 8%", "Jury / Juree 5%"].map((row, index) => <span key={row} className={`dot-${index}`}>{row}</span>)}
            </div>
          </article>
        </section>

        <section className="superadmin-management">
          {managementCards.map(([title, label, value, trend, Icon, color, href]) => (
            <article className="superadmin-card manage-card" key={title}>
              <h2>{title}</h2>
              <span style={{ color }}><Icon /></span>
              <strong>{value}</strong>
              <small>{label}</small>
              <em>{trend} cette semaine</em>
              <svg viewBox="0 0 150 52"><path d={pathFromValues([18, 32, 31, 36, 29, 42, 45, 58], 140, 46)} style={{ stroke: color }} /></svg>
              <Link href={href}>Voir tous les {label.toLowerCase()} <ChevronRight /></Link>
            </article>
          ))}
        </section>

        <section className="superadmin-grid middle">
          <article className="superadmin-card platform-stats">
            <header><h2>Statistiques de la plateforme</h2><button>30 jours <ChevronDown /></button></header>
            {platformStats.map(([label, value, trend, Icon]) => <p key={label}><i><Icon /></i><span>{label}</span><strong>{value}</strong><em>{trend}</em></p>)}
          </article>
          <TopList title="Top 5 clubs actifs" rows={topClubs} href="/super-admin/clubs" />
          <TopList title="Top 5 competitions" rows={topCompetitions} href="/competitions" />
        </section>

        <section className="superadmin-grid bottom">
          <article className="superadmin-card geo-card">
            <h2>Repartition geographique</h2>
            <div className="map-visual" />
            {["Maroc 806 51%", "France 214 14%", "Algerie 156 10%", "Espagne 98 6%", "Autres pays 294 19%"].map((row, index) => <p key={row} className={`dot-${index}`}><span>{row}</span></p>)}
            <div className="geo-total">1,568<small>Total</small></div>
          </article>
          <article className="superadmin-card alerts-card">
            <h2>Alertes & notifications systeme</h2>
            {alerts.map(([title, body, time, tone]) => <p key={title} className={tone}><AlertTriangle /><span><strong>{title}</strong><small>{body}</small></span><em>{time}</em></p>)}
            <Link href="/notifications">Voir toutes les alertes <ChevronRight /></Link>
          </article>
          <article className="superadmin-card system-card">
            <h2>Etat du systeme</h2>
            {systemRows.map(([label, status, Icon]) => <p key={label}><Icon /><span>{label}</span><strong>{status}</strong></p>)}
            <Link href="/admin/system/pwa">Voir les details systeme <ChevronRight /></Link>
          </article>
        </section>

        <section className="superadmin-card quick-superadmin-actions">
          <h2>Actions rapides</h2>
          <div>
            <Link href="/super-admin/users/new"><UserPlus />Ajouter un athlete</Link>
            <Link href="/super-admin/users/new"><Users />Ajouter un coach</Link>
            <Link href="/super-admin/clubs"><Landmark />Creer un club</Link>
            <Link href="/competitions/nouvelle"><Trophy />Creer competition</Link>
            <Link href="/super-admin/users/new"><Mic />Ajouter jury / juree</Link>
            <Link href="/rapports"><ClipboardPlus />Generer rapport global</Link>
          </div>
        </section>

        <footer className="superadmin-footer"><span>RowMotion AI Superadmin Dashboard</span><span>© 2026 RowMotion AI. Tous droits reserves.</span><span>Developpe par Mouad Mouasseif</span></footer>
      </div>
    </AppShell>
  );
}

function TopList({ title, rows, href }: { title: string; rows: readonly (readonly [string, string, string])[]; href: string }) {
  return (
    <article className="superadmin-card top-list">
      <h2>{title}</h2>
      {rows.map(([name, meta, status], index) => <p key={name}><b>{index + 1}</b><span><strong>{name}</strong><small>{meta}</small></span><em>{status}</em></p>)}
      <Link href={href}>Voir tous <ChevronRight /></Link>
    </article>
  );
}

export default function Page() {
  return <SuperAdminDashboard />;
}
