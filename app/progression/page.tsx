"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Download, Flame, Gauge, Star, Timer, Waves, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { toDate } from "@/lib/user-profile";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses } from "@/services/analysis-service";
import type { RowingAnalysis } from "@/types/analysis";

function average(values: Array<number | null | undefined>) {
  const available = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return available.length ? available.reduce((sum, value) => sum + value, 0) / available.length : null;
}

function formatDuration(seconds: number) {
  if (!seconds) return "Non disponible";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes} min`;
}

function analysisDate(value: unknown) {
  const date = toDate(value);
  return date ? date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "Date non disponible";
}

function ProgressChart({ analyses }: { analyses: RowingAnalysis[] }) {
  const points = analyses
    .filter((item) => item.status === "completed" && item.technicalScore != null)
    .slice(-12)
    .map((item) => ({ label: analysisDate(item.createdAt), value: (item.technicalScore ?? 0) / 10 }));

  if (points.length < 2) {
    return <div className="empty-state"><Gauge /><h2>Donnees insuffisantes</h2><p>Au moins deux analyses terminees sont necessaires pour tracer une progression.</p></div>;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const path = points.map((point, index) => {
    const x = 20 + index * (780 / Math.max(points.length - 1, 1));
    const y = 160 - ((point.value - min) / spread) * 120;
    return `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="progress-main-chart">
      <svg viewBox="0 0 820 190">
        <g>{[35, 75, 115, 155].map((y) => <line key={y} x1="20" y1={y} x2="800" y2={y} />)}</g>
        <path d={path} />
        {points.map((point, index) => {
          const x = 20 + index * (780 / Math.max(points.length - 1, 1));
          const y = 160 - ((point.value - min) / spread) * 120;
          return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="4" />;
        })}
      </svg>
      <div>{points.map((point, index) => <span key={`${point.label}-${index}`}>{point.label}</span>)}</div>
    </div>
  );
}

function ProgressionContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<RowingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    void listAnalyses(profile)
      .then(setItems)
      .catch(() => setError("Impossible de charger la progression."))
      .finally(() => setLoading(false));
  }, [profile]);

  const completed = useMemo(() => items.filter((item) => item.status === "completed"), [items]);
  const totalDuration = completed.reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0);
  const totalDistance = completed.reduce((sum, item) => sum + (item.distance ?? 0), 0);
  const averagePower = average(completed.map((item) => item.metrics?.estimatedPower));
  const averageScore = average(completed.map((item) => item.technicalScore));
  const averageCadence = average(completed.map((item) => item.metrics?.strokeRate));
  const bestSessions = [...completed]
    .filter((item) => item.technicalScore != null)
    .sort((a, b) => (b.technicalScore ?? 0) - (a.technicalScore ?? 0))
    .slice(0, 3);
  const hasEnoughForComparison = completed.length >= 2;

  if (!profile) return null;

  return (
    <AppShell referenceMode title="Progression" subtitle="Suivez votre evolution a partir des analyses terminees." headerActions={<><select className="header-select"><option>Periode - toutes les donnees</option></select><button className="button ghost"><Download />Exporter le rapport</button></>}>
      <div className="progress-reference">
        <nav className="directory-tabs"><button className="active">Vue d&apos;ensemble</button><button>Performances</button><button>Technique</button><button>Puissance</button><button>Endurance</button><button>Comparaison</button></nav>

        {loading ? <div className="loading-card">Chargement de la progression...</div> : error ? <div className="error-card">{error}</div> : (
          <>
            <section className="progress-stats">{([
              [Waves, "Distance totale", totalDistance ? (totalDistance / 1000).toFixed(1) : "Non disponible", totalDistance ? "km" : "", ""],
              [Timer, "Temps total", totalDuration ? formatDuration(totalDuration) : "Non disponible", "", ""],
              [Zap, "Puissance moyenne", averagePower == null ? "Non disponible" : averagePower.toFixed(0), averagePower == null ? "" : "w", ""],
              [Star, "Score technique moyen", averageScore == null ? "Non disponible" : (averageScore / 10).toFixed(1), averageScore == null ? "" : "/10", ""],
              [CalendarDays, "Seances", String(items.length), "", ""],
              [Flame, "Cadence moyenne", averageCadence == null ? "Non disponible" : averageCadence.toFixed(1), averageCadence == null ? "" : "spm", ""],
            ] as const).map(([Icon, label, value, unit]) => <article key={String(label)}><Icon /><span><small>{label}</small><strong>{value}<i>{unit}</i></strong><em>{completed.length ? "Donnees calculees" : "Insufficient data"}</em></span></article>)}</section>

            <div className="progress-layout">
              <main>
                <section className="progress-chart-card"><div className="reference-card-title"><h2>Evolution des performances</h2><nav><button className="active">Toutes</button></nav></div><div className="chart-legend"><span>Score technique (/10)</span></div><ProgressChart analyses={completed} /></section>
                <div className="progress-duo">
                  <section><h2>Repartition par zones d&apos;entrainement</h2><div className="empty-state"><Gauge /><h2>Analysis unavailable</h2><p>Les zones d&apos;entrainement necessitent des donnees de seance qualifiees.</p></div></section>
                  <section><div className="reference-card-title"><h2>Evolution de la distance</h2><select><option>Distance</option></select></div>{totalDistance ? <div className="distance-summary"><span><small>Distance totale</small><strong>{(totalDistance / 1000).toFixed(1)} km</strong></span><span><small>Analyses terminees</small><strong>{completed.length}</strong></span><span><small>Temps analyse</small><strong>{formatDuration(totalDuration)}</strong></span><span><small>Objectif hebdo</small><strong>Non disponible</strong></span></div> : <div className="empty-state"><Waves /><h2>Donnees insuffisantes</h2><p>Aucune distance valide n&apos;est encore disponible.</p></div>}</section>
                </div>
                <section className="records-card"><h2>Records personnels</h2><div>{[
                  ["Distance max", totalDistance ? `${(totalDistance / 1000).toFixed(1)} km` : "Non disponible"],
                  ["Puissance max", averagePower == null ? "Non disponible" : `${averagePower.toFixed(0)} w`],
                  ["Cadence moyenne", averageCadence == null ? "Non disponible" : `${averageCadence.toFixed(1)} spm`],
                  ["Score technique", averageScore == null ? "Non disponible" : `${(averageScore / 10).toFixed(1)}/10`],
                ].map(([label, value]) => <article key={label}><Gauge /><small>{label}</small><strong>{value}</strong><span>{value === "Non disponible" ? "Insufficient data" : "Calcule"}</span></article>)}</div><Link href="/analyses">Voir les analyses</Link></section>
              </main>
              <aside className="progress-sidebar">
                <section><h2>Resume de progression</h2><div className="progress-ring">{averageScore == null ? "—" : `${Math.round(averageScore)}%`}</div><strong>{hasEnoughForComparison ? "Progression mesurable" : "Donnees insuffisantes"}</strong><em>{hasEnoughForComparison ? "Base de comparaison disponible" : "Ajoutez plus d'analyses terminees"}</em><p>{hasEnoughForComparison ? "Les indicateurs sont calcules depuis vos analyses." : "La progression globale sera calculee apres plusieurs analyses completes."}</p></section>
                <section><div className="reference-card-title"><h2>Meilleures seances</h2><Link href="/analyses">Voir toutes</Link></div>{bestSessions.length ? bestSessions.map((item) => <article key={item.id}><Waves /><p><strong>{item.fileName || item.athleteName}</strong><small>{formatDuration(item.durationSeconds ?? 0)} - {item.distance ? `${item.distance} m` : "Distance non disponible"}</small></p><em>{((item.technicalScore ?? 0) / 10).toFixed(1)}/10</em></article>) : <div className="empty-state"><Star /><h2>Insufficient data</h2><p>Aucune analyse terminee avec score valide.</p></div>}</section>
                <section><h2>Analyse comparative</h2><p>{hasEnoughForComparison ? "Comparaison basee sur vos analyses terminees." : "Analysis unavailable : comparaison possible apres plusieurs analyses fiables."}</p><div className="comparison-rings"><span>{averagePower == null ? "—" : `${averagePower.toFixed(0)}w`}<small>Puissance</small></span><span>{totalDuration ? formatDuration(totalDuration) : "—"}<small>Temps</small></span><span>{averageScore == null ? "—" : `${(averageScore / 10).toFixed(1)}`}<small>Technique</small></span></div></section>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function ProgressionPage() {
  return <ProtectedPage><ProgressionContent /></ProtectedPage>;
}
