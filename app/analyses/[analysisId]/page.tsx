"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Download,
  Gauge,
  MoreHorizontal,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Square,
  TrendingUp,
  Video,
  Waves,
  Zap,
} from "lucide-react";
import { AnalysisVideoSource } from "@/components/AnalysisVideoSource";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import {
  cancelAnalysis,
  listAnalyses,
  retryAnalysis,
  subscribeToAnalysis,
  updateAnalysis,
} from "@/services/analysis-service";
import type { AnalysisMetrics, RowingAnalysis } from "@/types/analysis";

type ComparisonMode = "general" | "video" | "training";
type MetricKey = keyof AnalysisMetrics | "technicalScore" | "durationSeconds";

interface MetricDefinition {
  key: MetricKey;
  label: string;
  unit: string;
  higherIsBetter: boolean;
}

const metricDefinitions: MetricDefinition[] = [
  { key: "technicalScore", label: "Score technique", unit: "/10", higherIsBetter: true },
  { key: "strokeRate", label: "Cadence moyenne", unit: "spm", higherIsBetter: true },
  { key: "estimatedPower", label: "Puissance moyenne", unit: "W", higherIsBetter: true },
  { key: "strokeLength", label: "Longueur du coup", unit: "m", higherIsBetter: true },
  { key: "symmetryScore", label: "Symétrie", unit: "%", higherIsBetter: true },
  { key: "rhythmScore", label: "Régularité", unit: "%", higherIsBetter: true },
  { key: "backAngle", label: "Angle du dos", unit: "°", higherIsBetter: false },
  { key: "durationSeconds", label: "Durée", unit: "s", higherIsBetter: false },
];

const environmentLabels: Record<RowingAnalysis["environment"], string> = {
  boat: "Sur l’eau",
  ergometer: "Ergomètre",
  beach_sprint: "Beach Sprint",
};
const trainingLabels = {
  technique: "Technique",
  endurance: "Endurance",
  power: "Puissance",
  interval: "Intervalles",
  recovery: "Récupération",
  competition: "Compétition",
} as const;

function metricValue(analysis: RowingAnalysis, key: MetricKey): number | null {
  if (key === "technicalScore") {
    if (analysis.technicalScore == null) return null;
    return analysis.technicalScore > 10 ? analysis.technicalScore / 10 : analysis.technicalScore;
  }
  if (key === "durationSeconds") return analysis.durationSeconds;
  return analysis.metrics?.[key] ?? null;
}

function average(rows: RowingAnalysis[], key: MetricKey) {
  const values = rows.map((row) => metricValue(row, key)).filter((value): value is number => value != null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function formatMetric(value: number | null, unit: string) {
  if (value == null) return "—";
  const digits = unit === "m" || unit === "/10" ? 2 : 1;
  return `${value.toFixed(digits)} ${unit}`.trim();
}

function dateLabel(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString("fr-FR");
  }
  return "Date non renseignée";
}

function AnalysisCurve({ analysis }: { analysis: RowingAnalysis }) {
  const cycles = analysis.cycles ?? [];
  const samples = analysis.cadenceTimeline?.length
    ? analysis.cadenceTimeline
    : cycles.map((cycle) => ({ time: cycle.startTime, value: cycle.strokeRate || 0 }));
  const aggregateCadence = analysis.metrics?.strokeRate;
  const plottedSamples = samples.length >= 2
    ? samples
    : aggregateCadence != null
      ? [{ time: 0, value: aggregateCadence }, { time: analysis.durationSeconds ?? 1, value: aggregateCadence }]
      : [];
  if (plottedSamples.length < 2) {
    return <div className="analysis-no-series">Aucune série temporelle enregistrée pour cette analyse.</div>;
  }
  const points = plottedSamples.map((sample, index) => {
    const value = sample.value;
    const x = (index / Math.max(plottedSamples.length - 1, 1)) * 100;
    const y = 92 - Math.min(Math.max(value, 0), 60) * 1.25;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg className="analysis-dynamic-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={points} />
    </svg>
  );
}

function Detail({ id }: { id: string }) {
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<RowingAnalysis | null>(null);
  const [history, setHistory] = useState<RowingAnalysis[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"summary" | "technique" | "comparison">("summary");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("general");
  const [selectedVideoId, setSelectedVideoId] = useState("");

  useEffect(() => {
    if (!profile) return;
    const unsubscribe = subscribeToAnalysis(
      id,
      profile,
      (value) => {
        setAnalysis(value);
        setNote((current) => current || value.coachComment || "");
        setError("");
      },
      (reason) => setError(reason.message),
    );
    void listAnalyses(profile, 500)
      .then(setHistory)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Historique indisponible."));
    return unsubscribe;
  }, [id, profile]);

  const athleteHistory = useMemo(
    () => history.filter((row) => row.athleteId === analysis?.athleteId && row.status === "completed"),
    [analysis?.athleteId, history],
  );
  const sameTraining = useMemo(
    () => athleteHistory.filter((row) =>
      analysis?.trainingType
        ? row.trainingType === analysis.trainingType
        : row.environment === analysis?.environment,
    ),
    [analysis?.environment, analysis?.trainingType, athleteHistory],
  );
  const comparableVideos = athleteHistory.filter((row) => row.id !== analysis?.id);
  const selectedVideo = comparableVideos.find((row) => row.id === selectedVideoId) ?? comparableVideos[0] ?? null;
  const comparisonRows = comparisonMode === "training"
    ? sameTraining.filter((row) => row.id !== analysis?.id)
    : comparisonMode === "video" && selectedVideo
      ? [selectedVideo]
      : athleteHistory.filter((row) => row.id !== analysis?.id);

  if (!profile) return null;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: "Analyse RowMotion AI", url });
    else await navigator.clipboard.writeText(url);
  };

  const title = analysis ? `Analyse vidéo – ${environmentLabels[analysis.environment]}` : "Analyse vidéo";
  const subtitle = analysis
    ? `${analysis.athleteName} · ${analysis.fileName || "Vidéo"} · ${dateLabel(analysis.createdAt)}`
    : "Chargement de l’analyse…";

  return (
    <AppShell
      referenceMode
      title={title}
      subtitle={subtitle}
      headerActions={
        <>
          <button className="button ghost" onClick={() => window.print()}><Download />Exporter le rapport</button>
          <button className="button ghost" onClick={() => void share()}><Share2 />Partager</button>
          <button className="reference-more" aria-label="Plus d’options"><MoreHorizontal /></button>
        </>
      }
    >
      <div className="video-analysis-reference">
        <Link className="detail-back" href="/analyses"><ArrowLeft />Retour aux analyses</Link>
        {error ? <div className="error-card">{error}</div> : !analysis ? (
          <div className="loading-card">Chargement…</div>
        ) : (
          <>
            <nav className="video-analysis-tabs">
              <button className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")}>Résumé</button>
              <button className={tab === "technique" ? "active" : ""} onClick={() => setTab("technique")}>Angles & technique</button>
              <button className={tab === "comparison" ? "active" : ""} onClick={() => setTab("comparison")}>Comparaison</button>
            </nav>

            {analysis.status !== "completed" && (
              <div className="detail-processing">
                <Gauge />
                <span><strong>Analyse {analysis.status}</strong><small>{analysis.progress?.progress ?? 0}% · {analysis.progress?.processedFrames ?? 0}/{analysis.progress?.totalFrames ?? 0} images</small></span>
                {["queued", "processing"].includes(analysis.status) && <button onClick={() => void cancelAnalysis(id)}><Square />Annuler</button>}
                {["failed", "cancelled"].includes(analysis.status) && <button onClick={() => void retryAnalysis(id)}><RotateCcw />Relancer</button>}
              </div>
            )}

            {tab !== "comparison" && (
              <div className="video-analysis-layout">
                <main>
                  <section className="video-stage-reference">
                    <div className="video-stage-label"><Video />{environmentLabels[analysis.environment]}</div>
                    <AnalysisVideoSource analysis={analysis} />
                    {!analysis.videoUrl && analysis.videoStorageMode !== "local" && (
                      <div className="detail-video-placeholder"><Waves /><Play /></div>
                    )}
                  </section>
                  <section className="dynamic-curve-card">
                    <div><h2>Courbe de cadence</h2><small>{analysis.cadenceTimeline?.length ? "Données calculées cycle par cycle" : "Cadence moyenne enregistrée"}</small></div>
                    <AnalysisCurve analysis={analysis} />
                  </section>
                  <section className="cycle-phases-card">
                    <h2>Phases et cycles détectés</h2>
                    <div>
                      {(analysis.cycles ?? []).slice(0, 8).map((cycle) => (
                        <article key={cycle.index}>
                          <strong>Cycle {cycle.index + 1}</strong>
                          <span>{cycle.strokeRate.toFixed(1)} spm</span>
                          <small>{cycle.duration.toFixed(2)} s</small>
                        </article>
                      ))}
                      {!analysis.cycles?.length && <p>Aucun cycle détaillé enregistré.</p>}
                    </div>
                  </section>
                </main>
                <aside>
                  <section className="analysis-indicators">
                    <h2>Indicateurs clés</h2>
                    <div>
                      {metricDefinitions.slice(0, 6).map((metric) => (
                        <article key={metric.key}>
                          {metric.key === "estimatedPower" ? <Zap /> : metric.key === "technicalScore" ? <TrendingUp /> : <BarChart3 />}
                          <small>{metric.label}</small>
                          <strong>{formatMetric(metricValue(analysis, metric.key), metric.unit)}</strong>
                        </article>
                      ))}
                    </div>
                  </section>
                  <section className="analysis-strengths">
                    <h2>Résultats techniques</h2>
                    {(analysis.recommendations ?? []).length ? analysis.recommendations.map((item) => <p key={item}><Sparkles />{item}</p>) : <p>Aucune recommandation enregistrée.</p>}
                    {(analysis.errors ?? []).map((item) => <p className="warning" key={item}><CheckCircle2 />{item}</p>)}
                  </section>
                </aside>
              </div>
            )}

            {tab === "comparison" && (
              <section className="analysis-comparison-reference">
                <header>
                  <div>
                    <h2>Comparaison des performances</h2>
                    <p>Calculée uniquement à partir des analyses Firebase autorisées.</p>
                  </div>
                  <nav>
                    <button className={comparisonMode === "general" ? "active" : ""} onClick={() => setComparisonMode("general")}>Générale</button>
                    <button className={comparisonMode === "video" ? "active" : ""} onClick={() => setComparisonMode("video")}>Par vidéo</button>
                    <button className={comparisonMode === "training" ? "active" : ""} onClick={() => setComparisonMode("training")}>Par entraînement</button>
                  </nav>
                </header>
                <div className="comparison-context">
                  <article><small>Cette analyse</small><strong>{analysis.fileName || analysis.id}</strong><span>{environmentLabels[analysis.environment]} · {analysis.trainingType ? trainingLabels[analysis.trainingType] : "Type non renseigné"}</span></article>
                  <article><small>Base comparée</small><strong>{comparisonRows.length} analyse{comparisonRows.length > 1 ? "s" : ""}</strong><span>{comparisonMode === "training" ? (analysis.trainingType ? trainingLabels[analysis.trainingType] : environmentLabels[analysis.environment]) : comparisonMode === "video" ? "Vidéo sélectionnée" : "Historique de l’athlète"}</span></article>
                  {comparisonMode === "video" && (
                    <label>Vidéo de comparaison
                      <select value={selectedVideo?.id ?? ""} onChange={(event) => setSelectedVideoId(event.target.value)}>
                        {comparableVideos.map((row) => <option value={row.id} key={row.id}>{row.fileName || row.id} · {dateLabel(row.createdAt)}</option>)}
                      </select>
                    </label>
                  )}
                </div>
                <div className="comparison-table">
                  <header><span>Métrique</span><span>Cette analyse</span><span>Comparaison</span><span>Écart</span></header>
                  {metricDefinitions.map((metric) => {
                    const current = metricValue(analysis, metric.key);
                    const compared = average(comparisonRows, metric.key);
                    const delta = current != null && compared != null ? current - compared : null;
                    const positive = delta != null && (metric.higherIsBetter ? delta >= 0 : delta <= 0);
                    const width = current == null || compared == null || Math.max(Math.abs(current), Math.abs(compared)) === 0
                      ? 0
                      : Math.min((Math.abs(current) / Math.max(Math.abs(current), Math.abs(compared))) * 100, 100);
                    return (
                      <article key={metric.key}>
                        <strong>{metric.label}</strong>
                        <span>{formatMetric(current, metric.unit)}<i><b style={{ width: `${width}%` }} /></i></span>
                        <span>{formatMetric(compared, metric.unit)}</span>
                        <em className={delta == null ? "" : positive ? "positive" : "negative"}>{delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} ${metric.unit}`}</em>
                      </article>
                    );
                  })}
                </div>
                {!comparisonRows.length && <div className="notice-card">Aucune autre analyse compatible n’est disponible pour cette comparaison.</div>}
              </section>
            )}

            {["coach", "club_admin", "superadmin"].includes(profile.role) && (
              <section className="coach-note-reference">
                <h2>Note coach</h2>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ajoutez votre commentaire technique…" />
                <button className="button primary" onClick={() => void updateAnalysis(id, { coachComment: note })}>Enregistrer</button>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function Page({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = use(params);
  return <ProtectedPage><Detail id={analysisId} /></ProtectedPage>;
}
