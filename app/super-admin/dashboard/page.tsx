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
import { DATA_UNAVAILABLE } from "@/lib/data-availability";
import { useAuth } from "@/providers/AuthProvider";
import { getSuperAdminDashboardData, type RoleDashboardData } from "@/services/dashboard-service";

const kpiFallback = [
  ["Athletes", Users, "blue"],
  ["Coaches", UserPlus, "green"],
  ["Clubs", Landmark, "purple"],
  ["Competitions", Trophy, "red"],
  ["Jury / Jurees", Mic, "violet"],
  ["Analyses totales", LineChart, "purple"],
] as const;

const managementCards = [
  ["Gestion des athletes", "Athletes", Users, "#2589ff", "/super-admin/athletes"],
  ["Gestion des coachs", "Coaches", UserPlus, "#26d59b", "/super-admin/coachs"],
  ["Gestion des clubs", "Clubs", Landmark, "#ffbd39", "/super-admin/clubs"],
  ["Gestion des competitions", "Competitions", Trophy, "#ff566a", "/competitions"],
  ["Gestion des jury / juree", "Jury / Jurees", Mic, "#9b63ff", "/jury/dashboard"],
] as const;

const platformStats = [
  ["Sessions actives", DATA_UNAVAILABLE, ShieldCheck],
  ["Videos importees", DATA_UNAVAILABLE, Upload],
  ["Heures d'entrainement", DATA_UNAVAILABLE, CalendarDays],
  ["Distance totale ramee", DATA_UNAVAILABLE, LineChart],
  ["Ergometre", DATA_UNAVAILABLE, Activity],
  ["Utilisateurs actifs", "Utilisateurs actifs", Users],
] as const;

const topClubs = [
  [DATA_UNAVAILABLE, DATA_UNAVAILABLE, DATA_UNAVAILABLE],
] as const;

const topCompetitions = [
  [DATA_UNAVAILABLE, DATA_UNAVAILABLE, DATA_UNAVAILABLE],
] as const;

const alerts = [
  [DATA_UNAVAILABLE, DATA_UNAVAILABLE, DATA_UNAVAILABLE, "blue"],
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

function getKpi(data: RoleDashboardData | null, label: string) {
  return data?.kpis.find((item) => item.label === label)?.value ?? DATA_UNAVAILABLE;
}

function getAnalysisChart(data: RoleDashboardData | null) {
  const count = data?.analyses.length ?? 0;
  if (!count) return [];
  const values = Array.from({ length: Math.min(count, 12) }, (_, index) => index + 1);
  return [{ label: "Analyses Firebase", color: "#2589ff", values }];
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
  const chartRows = getAnalysisChart(data);
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
          {kpiFallback.map(([label, Icon, tone]) => (
            <article key={label} className={`superadmin-card kpi ${tone}`}>
              <span><Icon /></span>
              <small>{label}</small>
              <strong>{getKpi(data, label)}</strong>
              <em>Donnees Firebase</em>
            </article>
          ))}
        </section>

        <section className="superadmin-grid top">
          <article className="superadmin-card chart-card-main">
            <header><h2>Evolution globale des analyses</h2><button>30 jours <ChevronDown /></button></header>
            {chartRows.length ? (
              <>
                <svg viewBox="0 0 360 190" role="img" aria-label="Evolution globale des analyses">
                  {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="26" x2="342" y1={25 + line * 31} y2={25 + line * 31} />)}
                  {chartRows.map((row) => <path key={row.label} d={pathFromValues(row.values, 316, 138)} transform="translate(26 22)" style={{ stroke: row.color }} />)}
                </svg>
                <footer>{chartRows.map((row) => <span key={row.label}><i style={{ background: row.color }} />{row.label}</span>)}</footer>
              </>
            ) : <p>{DATA_UNAVAILABLE}</p>}
          </article>

          <article className="superadmin-card live-card">
            <h2>Activite en temps reel</h2>
            {data?.rows.length ? data.rows.map((row, index) => (
              <p key={`${row.cells.join("-")}-${index}`}><i className="blue"><Users /></i><span><strong>{row.cells[0] ?? DATA_UNAVAILABLE}</strong><small>{row.cells[1] ?? DATA_UNAVAILABLE}</small></span><em>{row.cells[2] ?? DATA_UNAVAILABLE}</em></p>
            )) : <p><i className="blue"><Users /></i><span><strong>{DATA_UNAVAILABLE}</strong><small>{DATA_UNAVAILABLE}</small></span><em>{DATA_UNAVAILABLE}</em></p>}
            <Link href="/notifications">Voir toute l&apos;activite en direct</Link>
          </article>

          <article className="superadmin-card global-split">
            <h2>Repartition globale</h2>
            <div className="superadmin-donut"><strong>{getKpi(data, "Utilisateurs actifs")}</strong><small>Total utilisateurs</small></div>
            <div className="split-legend">
              {["Athletes", "Coaches", "Clubs", "Competitions", "Jury / Jurees"].map((label, index) => <span key={label} className={`dot-${index}`}>{label} {getKpi(data, label)}</span>)}
            </div>
          </article>
        </section>

        <section className="superadmin-management">
          {managementCards.map(([title, label, Icon, color, href]) => (
            <article className="superadmin-card manage-card" key={title}>
              <h2>{title}</h2>
              <span style={{ color }}><Icon /></span>
              <strong>{getKpi(data, label)}</strong>
              <small>{label}</small>
              <em>Donnees Firebase</em>
              <svg viewBox="0 0 150 52"><path d={pathFromValues([1, 1], 140, 46)} style={{ stroke: color }} /></svg>
              <Link href={href}>Voir tous les {label.toLowerCase()} <ChevronRight /></Link>
            </article>
          ))}
        </section>

        <section className="superadmin-grid middle">
          <article className="superadmin-card platform-stats">
            <header><h2>Statistiques de la plateforme</h2><button>30 jours <ChevronDown /></button></header>
            {platformStats.map(([label, value, Icon]) => <p key={label}><i><Icon /></i><span>{label}</span><strong>{value === "Utilisateurs actifs" ? getKpi(data, value) : value}</strong><em>Firebase</em></p>)}
          </article>
          <TopList title="Top 5 clubs actifs" rows={topClubs} href="/super-admin/clubs" />
          <TopList title="Top 5 competitions" rows={topCompetitions} href="/competitions" />
        </section>

        <section className="superadmin-grid bottom">
          <article className="superadmin-card geo-card">
            <h2>Repartition geographique</h2>
            <div className="map-visual" />
            {[DATA_UNAVAILABLE].map((row, index) => <p key={row} className={`dot-${index}`}><span>{row}</span></p>)}
            <div className="geo-total">{DATA_UNAVAILABLE}<small>Total</small></div>
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
            <Link href="/athletes"><UserPlus />Ajouter un athlete</Link>
            <Link href="/coaches"><Users />Ajouter un coach</Link>
            <Link href="/super-admin/clubs"><Landmark />Creer un club</Link>
            <Link href="/competitions/nouvelle"><Trophy />Creer competition</Link>
            <Link href="/super-admin/users"><Mic />Ajouter jury / juree</Link>
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
