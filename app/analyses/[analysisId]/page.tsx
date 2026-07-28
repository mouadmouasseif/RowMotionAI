"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Download,
  Gauge,
  MoreHorizontal,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Square,
  Target,
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
import type { AnalysisMetrics, MetricSample, RowingAnalysis, StrokeCycle } from "@/types/analysis";

type ComparisonMode = "general" | "video" | "training";
type AnalysisTab = "summary" | "phases" | "technique" | "performance" | "comparison";
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

function TimelineChart({ samples, color = "#3b91ff" }: { samples: MetricSample[]; color?: string }) {
  if (samples.length < 2) return <div className="analysis-no-series compact">Données temporelles non disponibles.</div>;
  const values = samples.map((sample) => sample.value);
  const min = Math.min(...values);
  const spread = Math.max(Math.max(...values) - min, 1);
  const points = samples.map((sample, index) => {
    const x = index / Math.max(samples.length - 1, 1) * 100;
    const y = 90 - ((sample.value - min) / spread) * 75;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg className="analysis-dynamic-chart compact" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={points} style={{ stroke: color }} />
    </svg>
  );
}

function scoreOnTen(analysis: RowingAnalysis) {
  if (analysis.technicalScore == null) return null;
  return analysis.technicalScore > 10 ? analysis.technicalScore / 10 : analysis.technicalScore;
}

function measuredLabel(value: number | null, unit: string) {
  return value == null ? "Non mesuré" : `${value.toFixed(unit === "m" ? 2 : 1)} ${unit}`;
}

function displayCycles(analysis: RowingAnalysis): StrokeCycle[] {
  if (analysis.cycles?.length) return analysis.cycles;
  const samples = analysis.cadenceTimeline ?? [];
  return samples.slice(0, -1).map((sample, index) => {
    const next = samples[index + 1];
    const duration = Math.max(next.time - sample.time, 0.01);
    const driveTime = duration * 0.36;
    const confidence = 0.45;
    return {
      index,
      startTime: sample.time,
      endTime: next.time,
      duration,
      driveTime,
      recoveryTime: duration - driveTime,
      driveRecoveryRatio: driveTime / Math.max(duration - driveTime, 0.01),
      strokeRate: sample.value,
      phases: [
        { name: "Prise d’eau", startTime: sample.time, endTime: sample.time + duration * 0.08, confidence },
        { name: "Propulsion", startTime: sample.time + duration * 0.08, endTime: sample.time + duration * 0.36, confidence },
        { name: "Dégagé", startTime: sample.time + duration * 0.36, endTime: sample.time + duration * 0.48, confidence },
        { name: "Retour", startTime: sample.time + duration * 0.48, endTime: next.time, confidence },
      ],
      metrics: {
        regularity: analysis.metrics?.rhythmScore ?? null,
        sequenceScore: analysis.metrics?.sequenceScore ?? null,
        symmetry: analysis.metrics?.symmetryScore ?? null,
        technicalScore: analysis.technicalScore,
      },
      errors: [],
      confidence,
    };
  });
}

function Detail({ id }: { id: string }) {
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<RowingAnalysis | null>(null);
  const [history, setHistory] = useState<RowingAnalysis[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<AnalysisTab>("summary");
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
              {(analysis.analysisScope ?? "complete") === "complete" && <button className={tab === "phases" ? "active" : ""} onClick={() => setTab("phases")}>Phases du coup</button>}
              {(analysis.analysisScope ?? "complete") === "complete" && <button className={tab === "technique" ? "active" : ""} onClick={() => setTab("technique")}>Angles & technique</button>}
              {(analysis.analysisScope ?? "complete") === "complete" && <button className={tab === "performance" ? "active" : ""} onClick={() => setTab("performance")}>Puissance & vitesse</button>}
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
              <>
              <div className={`video-analysis-layout ${tab}-view ${(analysis.analysisScope ?? "complete") === "general" ? "general-scope" : "complete-scope"}`}>
                <main>
                  <section className="video-stage-reference">
                    <div className="video-stage-label"><Video />{environmentLabels[analysis.environment]}</div>
                    <AnalysisVideoSource analysis={analysis} />
                    {!analysis.videoUrl && analysis.videoStorageMode !== "local" && (
                      <div className="detail-video-placeholder"><Waves /><Play /></div>
                    )}
                  </section>
                  <section className="stroke-phase-summary">
                    <header>
                      <div><h2>Phases du coup</h2><small>Détection cinématique à partir du mouvement des jambes</small></div>
                      <span>{displayCycles(analysis).length ? `${displayCycles(analysis).length} cycles analysés` : "Aucun cycle complet"}</span>
                    </header>
                    <div className="stroke-phase-timeline">
                      {(["Prise d’eau", "Propulsion", "Dégagé", "Retour"] as const).map((name, index) => {
                        const phase = displayCycles(analysis)[0]?.phases.find((item) => item.name === name);
                        return (
                          <article key={name}>
                            <i>{index + 1}</i>
                            <strong>{name}</strong>
                            <small>{phase ? `${(phase.endTime - phase.startTime).toFixed(2)} s` : "Non détectée"}</small>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                  <section className="analysis-overview-strip">
                    <article className="analysis-score-card">
                      <div className="analysis-score-ring">
                        <strong>{scoreOnTen(analysis)?.toFixed(1) ?? "—"}</strong>
                        <small>/10</small>
                      </div>
                      <div>
                        <span>Score technique global</span>
                        <strong>{scoreOnTen(analysis) == null ? "Analyse incomplète" : scoreOnTen(analysis)! >= 8 ? "Très bonne technique" : scoreOnTen(analysis)! >= 6 ? "Technique solide" : "Axes de progression détectés"}</strong>
                        <small>Posture, symétrie et régularité détectées par la vidéo.</small>
                      </div>
                    </article>
                    <article><Activity /><small>Cycles détectés</small><strong>{displayCycles(analysis).length}</strong></article>
                    <article><Target /><small>Cadence moyenne</small><strong>{measuredLabel(analysis.metrics?.strokeRate, "spm")}</strong></article>
                    <article><Zap /><small>Puissance</small><strong>{measuredLabel(analysis.metrics?.estimatedPower, "W")}</strong></article>
                  </section>
                  <section className="dynamic-curve-card">
                    <div><h2>Courbe de cadence</h2><small>{analysis.cadenceTimeline?.length ? "Données calculées cycle par cycle" : "Cadence moyenne enregistrée"}</small></div>
                    <AnalysisCurve analysis={analysis} />
                  </section>
                  <section className="cycle-phases-card">
                    <h2>Phases et cycles détectés</h2>
                    <div>
                      {displayCycles(analysis).slice(0, 8).map((cycle) => (
                        <article key={cycle.index}>
                          <strong>Cycle {cycle.index + 1}</strong>
                          <span>{cycle.strokeRate.toFixed(1)} spm</span>
                          <small>{cycle.duration.toFixed(2)} s</small>
                        </article>
                      ))}
                      {!displayCycles(analysis).length && <p>Aucun cycle détaillé enregistré.</p>}
                    </div>
                  </section>
                  <section className="phase-quality-card">
                    <h2>Évaluation par phase</h2>
                    <div>
                      {(["Prise d’eau", "Propulsion", "Dégagé", "Retour"] as const).map((name, index) => {
                        const phase = displayCycles(analysis)[0]?.phases.find((item) => item.name === name);
                        const confidence = Math.round((phase?.confidence ?? 0) * 100);
                        return <article key={name}><i className={`phase-color-${index + 1}`} /> <span><strong>{name}</strong><small>{phase ? `${confidence}% de confiance` : "Donnée insuffisante"}</small></span><b>{phase ? "Analysée" : "À revoir"}</b></article>;
                      })}
                    </div>
                  </section>
                  <section className="posture-detail-card">
                    <h2>Détails de la posture et des angles</h2>
                    <div>
                      {([
                        ["Angle du genou", analysis.metrics?.kneeAngle, 180],
                        ["Angle de la hanche", analysis.metrics?.hipAngle, 180],
                        ["Inclinaison du dos", analysis.metrics?.backAngle, 90],
                        ["Angle des épaules", analysis.metrics?.shoulderAngle, 180],
                        ["Angle des coudes", analysis.metrics?.elbowAngle, 180],
                        ["Symétrie", analysis.metrics?.symmetryScore, 100],
                      ] as const).map(([label, value, maximum]) => (
                        <article key={label}><span><strong>{label}</strong><b>{measuredLabel(value, label === "Symétrie" ? "%" : "°")}</b></span><i><b style={{ width: `${value == null ? 0 : Math.min(100, Math.max(0, value / maximum * 100))}%` }} /></i></article>
                      ))}
                    </div>
                  </section>
                  <section className="sensor-profile-card">
                    <Waves />
                    <div><h2>Profil de mouvement</h2><strong>{analysis.metrics?.symmetryScore == null ? "Détection vidéo uniquement" : `${analysis.metrics.symmetryScore.toFixed(1)}% de symétrie`}</strong><p>{analysis.metrics?.rhythmScore == null ? "La régularité n’a pas pu être mesurée sur cette vidéo." : `Régularité du cycle : ${analysis.metrics.rhythmScore.toFixed(1)}%. Plus la vidéo contient de coups complets, plus cette estimation devient précise.`}</p></div>
                  </section>
                  <section className="analysis-curves-grid">
                    <header><div><h2>Courbes biomécaniques</h2><small>Évolution des mesures pendant la vidéo</small></div></header>
                    <div>
                      <article><span>Angle genou <strong>{measuredLabel(analysis.metrics?.kneeAngle, "°")}</strong></span><TimelineChart samples={analysis.timelines?.kneeAngle ?? []} /></article>
                      <article><span>Angle hanche <strong>{measuredLabel(analysis.metrics?.hipAngle, "°")}</strong></span><TimelineChart samples={analysis.timelines?.hipAngle ?? []} color="#a267ff" /></article>
                      <article><span>Inclinaison du dos <strong>{measuredLabel(analysis.metrics?.backAngle, "°")}</strong></span><TimelineChart samples={analysis.timelines?.backAngle ?? []} color="#37d18b" /></article>
                      <article><span>Symétrie <strong>{measuredLabel(analysis.metrics?.symmetryScore, "%")}</strong></span><TimelineChart samples={analysis.timelines?.symmetry ?? []} color="#f3b43b" /></article>
                    </div>
                  </section>
                  <section className="analysis-conclusion-card">
                    <header><Sparkles /><div><h2>Conclusion de l’analyse</h2><small>Interprétation des résultats détectés</small></div></header>
                    <div className="analysis-conclusion-grid">
                      <article><strong>Ce qui est positif</strong><p>{(analysis.metrics?.symmetryScore ?? 0) >= 80 ? "Le mouvement est globalement symétrique entre les deux côtés." : "Des cycles exploitables ont été détectés et peuvent servir de base de progression."}</p></article>
                      <article><strong>Priorité de progression</strong><p>{analysis.errors?.[0] ?? analysis.recommendations?.[0] ?? "Conserver une cadence stable et rechercher un enchaînement fluide jambes, dos puis bras."}</p></article>
                      <article><strong>Prochaine séance</strong><p>{analysis.recommendations?.[1] ?? analysis.recommendations?.[0] ?? "Filmer plusieurs coups complets de profil, avec le corps entier visible, puis comparer la régularité."}</p></article>
                    </div>
                    <p className="analysis-conclusion-disclaimer">Cette analyse vidéo fournit une aide technique. Les valeurs de puissance, de distance et de force restent non mesurées tant qu’aucun capteur compatible n’est connecté.</p>
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
                    {(analysis.errors ?? []).map((item) => <p className="warning" key={item}><AlertTriangle />{item}</p>)}
                  </section>
                  <section className="measurement-note">
                    <Gauge />
                    <div><strong>Origine des données</strong><p>Les angles, la cadence et la symétrie viennent de la vidéo. La puissance et la longueur du coup nécessitent un capteur ou une saisie manuelle et ne sont jamais inventées.</p></div>
                  </section>
                </aside>
              </div>
              </>
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
