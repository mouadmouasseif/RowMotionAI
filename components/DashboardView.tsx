"use client";

import {
  Activity,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Dumbbell,
  FileVideo,
  Gauge,
  Medal,
  Play,
  Radio,
  Scale,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses } from "@/services/analysis-service";
import type { RowingAnalysis } from "@/types/analysis";
import { AppShell } from "./AppShell";

const weekPoints = [20, 40, 24, 48, 35, 50, 62, 68, 87];
const heartPoints = [90, 105, 92, 135, 105, 125, 158];

function LineChart({ points, labels }: { points: number[]; labels: string[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coordinates = points.map((value, pointIndex) => ({
    x: 18 + (pointIndex * 364) / Math.max(points.length - 1, 1),
    y: 118 - ((value - min) / Math.max(max - min, 1)) * 86,
  }));
  const path = coordinates
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="reference-line-chart">
      <svg viewBox="0 0 400 145" role="img" aria-label="Évolution des performances">
        {[32, 61, 90, 118].map((y) => <line key={y} x1="18" y1={y} x2="382" y2={y} />)}
        <path d={path} />
        {coordinates.map((point) => (
          <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" />
        ))}
      </svg>
      <div>{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}

function Donut({
  className = "",
  center,
  sub,
}: {
  className?: string;
  center?: string;
  sub?: string;
}) {
  return (
    <div className={`reference-donut ${className}`}>
      {center && <span><strong>{center}</strong><small>{sub}</small></span>}
    </div>
  );
}

function formatEnvironment(value?: RowingAnalysis["environment"]) {
  if (value === "boat") return "Sur l’eau";
  if (value === "beach_sprint") return "Beach sprint";
  return "Ergomètre";
}

export function DashboardView() {
  const { profile } = useAuth();
  const [analyses, setAnalyses] = useState<RowingAnalysis[]>([]);

  useEffect(() => {
    if (profile) {
      void listAnalyses(profile, 42).then(setAnalyses).catch(() => setAnalyses([]));
    }
  }, [profile]);

  const completed = useMemo(
    () => analyses.filter((analysis) => analysis.status === "completed"),
    [analyses],
  );
  const latest = analyses[0];
  const averageScore = completed.length
    ? completed.reduce((sum, item) => sum + (item.technicalScore ?? 0), 0) / completed.length
    : 8.2;
  const averagePower = Math.round(
    completed.reduce((sum, item) => sum + (item.metrics?.estimatedPower ?? 0), 0) /
      Math.max(completed.filter((item) => item.metrics?.estimatedPower).length, 1),
  ) || 268;
  const averageCadence = Math.round(
    completed.reduce((sum, item) => sum + (item.metrics?.strokeRate ?? 0), 0) /
      Math.max(completed.filter((item) => item.metrics?.strokeRate).length, 1),
  ) || 28;

  if (!profile) return null;

  const firstName = profile.firstName || "Alex";
  const statCards = [
    { icon: Activity, label: "Analyses totales", value: analyses.length || 42, unit: "", trend: "15%" },
    { icon: Waves, label: "Distance totale", value: "1,248", unit: "km", trend: "8%" },
    { icon: Timer, label: "Temps total", value: "58h 24m", unit: "", trend: "8%" },
    { icon: TrendingUp, label: "Puissance moyenne", value: averagePower, unit: "w", trend: "7%", purple: true },
    { icon: Gauge, label: "Cadence moyenne", value: averageCadence, unit: "spm", trend: "3%" },
    { icon: Star, label: "Score technique moyen", value: averageScore.toFixed(1), unit: "/10", trend: "9%", purple: true },
  ];

  return (
    <AppShell
      dashboardMode
      title="Tableau de bord"
      subtitle={`Bienvenue ${firstName} ! Voici un aperçu complet de vos performances.`}
    >
      <div className="reference-dashboard">
        <section className="reference-stats">
          {statCards.map(({ icon: Icon, label, value, unit, trend, purple }) => (
            <article key={label}>
              <Icon className={purple ? "purple" : ""} />
              <div>
                <small>{label}</small>
                <strong>{value} <i>{unit}</i></strong>
                <em>↑ {trend} <span>vs semaine dernière</span></em>
              </div>
            </article>
          ))}
        </section>

        <section className="reference-grid reference-grid-top">
          <article className="reference-card latest-analysis-card">
            <h2>Dernière analyse</h2>
            <div className="latest-analysis">
              <div className="latest-visual">
                {latest?.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={latest.thumbnailUrl} alt="Dernière séance d’aviron" />
                ) : (
                  <div className="rower-placeholder"><Waves /></div>
                )}
                <span><Play /></span>
                <time>{latest?.durationSeconds ? `${Math.floor(latest.durationSeconds / 60)}:${String(Math.round(latest.durationSeconds % 60)).padStart(2, "0")}` : "00:20"}</time>
              </div>
              <div className="latest-copy">
                <strong>{latest?.fileName || "Séance du 18 Mai 2025"}</strong>
                <small>{formatEnvironment(latest?.environment)} · 1h 02m · 6,310 m</small>
                <p>Durée : 20:45 <b>·</b> Distance : 6,310 m</p>
                <span>Score technique</span>
                <div><strong>{latest?.technicalScore ? (latest.technicalScore / 10).toFixed(1) : "8.7"}</strong><i>/10</i><em>Excellent</em></div>
                <Link href={latest ? `/analyses/${latest.id}` : "/analyses"}>Voir l’analyse complète <ChevronRight /></Link>
              </div>
            </div>
          </article>

          <article className="reference-card progress-card">
            <div className="reference-card-title"><h2>Progression cette semaine</h2><button>Performance⌄</button></div>
            <LineChart points={weekPoints} labels={["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]} />
          </article>

          <article className="reference-card zones-card">
            <h2>Zones d’entraînement</h2>
            <div className="zones-content">
              <Donut />
              <ul>
                <li><i className="blue" />UT2 <strong>45%</strong></li>
                <li><i className="green" />UT1 <strong>25%</strong></li>
                <li><i className="yellow" />AT <strong>15%</strong></li>
                <li><i className="purple" />TR <strong>10%</strong></li>
                <li><i className="red" />AN <strong>5%</strong></li>
              </ul>
            </div>
          </article>
        </section>

        <section className="reference-grid reference-grid-middle">
          <article className="reference-card muscles-card">
            <h2>Groupes musculaires</h2>
            <div className="muscles-content">
              <Dumbbell className="body-icon" />
              <ul>
                {[["Dos", 92], ["Jambes", 88], ["Bras", 76], ["Gainage", 85], ["Épaules", 70]].map(([name, value]) => (
                  <li key={name}><span>{name}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}%</strong></li>
                ))}
              </ul>
            </div>
          </article>

          <article className="reference-card distribution-card">
            <h2>Répartition des analyses</h2>
            <div className="distribution-content">
              <Donut center={String(analyses.length || 42)} sub="Analyses" />
              <ul>
                <li><i className="blue" />Ergomètre <strong>52%</strong></li>
                <li><i className="green" />Sur l’eau <strong>28%</strong></li>
                <li><i className="yellow" />Force <strong>12%</strong></li>
                <li><i className="purple" />Mobilité <strong>8%</strong></li>
              </ul>
            </div>
          </article>

          <article className="reference-card best-card">
            <h2>Meilleures performances</h2>
            <div><Medal /><span><strong>6,310 <i>m</i></strong><small>Ergomètre · 18 Mai 2025</small></span><em>Nouveau record</em></div>
            <div><Medal /><span><strong>2:18.4 <i>/500m</i></strong><small>Ergomètre · 10 Mai 2025</small></span></div>
            <div><Medal /><span><strong>1,024 <i>w</i></strong><small>Puissance max · 12 Mai 2025</small></span></div>
          </article>

          <article className="reference-card heart-card">
            <div className="reference-card-title"><h2>Fréquence cardiaque (moyenne)</h2><button>bpm⌄</button></div>
            <LineChart points={heartPoints} labels={["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]} />
          </article>
        </section>

        <section className="reference-grid reference-grid-bottom">
          <article className="reference-card activity-card">
            <h2>Activité récente</h2>
            {[
              [Clock3, "Analyse terminée", "Séance du 18 Mai 2025", "Il y a 2 h", "Score 8.7"],
              [TrendingUp, "Nouvelle performance", "6,310 m sur ergomètre", "Il y a 1 jour", "Record"],
              [CalendarDays, "Plan d’entraînement", "Endurance Fondamentale", "Il y a 2 jours", "75% complété"],
              [Scale, "Poids enregistré", "84.2 kg", "Il y a 2 jours", "-0.3 kg"],
            ].map(([Icon, title, sub, time, result]) => (
              <div key={String(title)}><span><Icon /></span><p><strong>{String(title)}</strong><small>{String(sub)}</small></p><time>{String(time)}<em>{String(result)}</em></time></div>
            ))}
            <Link href="/analyses">Voir tout l’historique <ChevronRight /></Link>
          </article>

          <article className="reference-card plan-card">
            <div className="reference-card-title"><h2>Plan d’entraînement actuel</h2><em>Semaine 3/8</em></div>
            <strong>Endurance Fondamentale</strong>
            <small>75% complété</small>
            <div className="plan-progress"><i /></div>
            <span>75 min</span>
            <div className="next-session">
              <small>Prochaine séance</small>
              <strong><CalendarDays /> Demain · 10:00 <b>·</b> <Radio /> Ergomètre</strong>
              <p>Travail d’endurance à intensité modérée.</p>
            </div>
            <Link href="/progression">Voir le plan complet <ChevronRight /></Link>
          </article>

          <article className="reference-card nutrition-card">
            <h2>Nutrition du jour</h2>
            <div className="nutrition-content">
              <Donut className="nutrition-donut" center="1,850" sub="/ 2,400 kcal" />
              <ul>
                {[["Protéines", "126 g / 160 g", 79], ["Glucides", "210 g / 280 g", 75], ["Lipides", "58 g / 70 g", 83]].map(([name, value, percent]) => (
                  <li key={name}><span>{name}<small>{value}</small></span><strong>{percent}%</strong><i><b style={{ width: `${percent}%` }} /></i></li>
                ))}
              </ul>
            </div>
            <Link href="/progression">Voir le journal alimentaire <ChevronRight /></Link>
          </article>

          <article className="reference-card notifications-card">
            <div className="reference-card-title"><h2>Notifications</h2><Link href="/notifications">Tout marquer comme lu</Link></div>
            {[
              [FileVideo, "Votre analyse est prête", "Séance du 18 Mai 2025", "Il y a 2 h"],
              [Bell, "Rappel d’entraînement", "Votre séance de demain à 10:00", "Il y a 4 h"],
              [Sparkles, "Nouveau conseil", "3 conseils techniques disponibles", "Il y a 1 jour"],
              [Clock3, "Mise à jour", "Une nouvelle fonctionnalité est disponible", "Il y a 2 jours"],
            ].map(([Icon, title, sub, time]) => (
              <div key={String(title)}><Icon /><p><strong>{String(title)}</strong><small>{String(sub)}</small></p><time>{String(time)}</time><i /></div>
            ))}
            <Link className="all-notifications" href="/notifications">Voir toutes les notifications <ChevronRight /></Link>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
