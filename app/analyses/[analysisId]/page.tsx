"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Download,
  Gauge,
  MoreHorizontal,
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
import { canViewJointKey, restrictedBiomechanicsNotice } from "@/lib/analysis/biomechanics-access";
import { getDisplayJointRanges, getDisplayMuscleRows, getMuscleMeasurementMeta, jointDisplay, muscleVisualKeyForLabel, muscleVisualOrder, muscleVisuals } from "@/lib/analysis/biomechanics-display";
import { downloadAnalysisPdf } from "@/lib/report-pdf";
import { useAuth } from "@/providers/AuthProvider";
import {
  cancelAnalysis,
  listAnalyses,
  queueAnalysis,
  retryAnalysis,
  subscribeToAnalysis,
  updateAnalysis,
} from "@/services/analysis-service";
import type { AnalysisMetrics, MetricSample, MuscleUsage, RowingAnalysis, StrokeCycle } from "@/types/analysis";
import type { UserRole } from "@/types/user";

type ComparisonMode = "general" | "video" | "training";
type AnalysisTab = "summary" | "timeline" | "stroke" | "phases" | "race" | "start" | "finish" | "turns" | "technique" | "performance" | "muscle" | "fatigue" | "comparison" | "COACH";
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
  double_scull: "Bateau double",
  ergometer: "Ergomètre",
  beach_sprint: "Aviron Beach / Beach Sprint",
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

function muscleUsageFor(analysis: RowingAnalysis): MuscleUsage {
  if (analysis.muscleUsage) return analysis.muscleUsage;
  return { back: 0, legs: 0, arms: 0, core: 0, shoulders: 0 };
}

function PhaseSpeedChart({ analysis }: { analysis: RowingAnalysis }) {
  const recordedSpeed = analysis.timelines?.movementSpeed ?? [];
  const hipSamples = analysis.timelines?.hipAngle ?? [];
  const derivedSpeed = hipSamples.slice(1).map((sample, index) => ({
    time: sample.time,
    value: Math.abs(sample.value - hipSamples[index].value) / Math.max(sample.time - hipSamples[index].time, 0.01),
  }));
  const rawSamples = recordedSpeed.length ? recordedSpeed : derivedSpeed;
  const samples = Array.from(rawSamples.reduce((buckets, sample) => {
    const bucket = Math.floor(sample.time / 0.5) * 0.5;
    const values = buckets.get(bucket) ?? [];
    values.push(sample.value);
    buckets.set(bucket, values);
    return buckets;
  }, new Map<number, number[]>()), ([time, values]) => ({ time, value: values.reduce((sum, value) => sum + value, 0) / values.length })).sort((a, b) => a.time - b.time);
  const unit = recordedSpeed.length ? "%/s" : "°/s";
  const cycles = displayCycles(analysis);
  const phaseNames = ["Prise d’eau", "Propulsion", "Dégagé", "Retour"];
  const averages = phaseNames.map((name) => {
    const ranges = cycles.flatMap((cycle) => cycle.phases.filter((phase) => phase.name === name));
    const values = samples.filter((sample) => ranges.some((range) => sample.time >= range.startTime && sample.time <= range.endTime)).map((sample) => sample.value);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  });
  return (
    <section className="movement-speed-card">
      <header><div><h2>Vitesse gestuelle détaillée</h2><small>Déplacement du bassin mesuré toutes les 0,5 seconde</small></div><strong>{samples.length ? `${samples.length} mesures` : "Non disponible"}</strong></header>
      <TimelineChart samples={samples} color="#20bff3" />
      <div className="movement-speed-axis">{samples.slice(0, 16).map((sample) => <span key={sample.time}><b>{sample.value.toFixed(1)}</b><small>{sample.time.toFixed(1)} s</small></span>)}</div>
      <div className="phase-speed-summary">{phaseNames.map((name, index) => <article key={name}><i className={`phase-color-${index + 1}`} /><span><strong>{name}</strong><small>Moyenne de tous les cycles</small></span><b>{averages[index] == null ? "—" : `${averages[index]!.toFixed(1)} ${unit}`}</b></article>)}</div>
      <p>{recordedSpeed.length ? "Cette vitesse est relative à la taille de l’image (% du cadre par seconde)." : "Pour cette ancienne analyse, la vitesse est dérivée de la variation de l’angle de hanche (degrés par seconde)."} Une vitesse en km/h nécessite un capteur ou une distance de référence calibrée.</p>
    </section>
  );
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

function formatNullable(value: number | null | undefined, unit = "") {
  return value == null ? "Non disponible" : `${value.toFixed(unit === "s" ? 2 : 1)} ${unit}`.trim();
}

function distanceSegments(analysis: RowingAnalysis) {
  if (analysis.splits?.length) return analysis.splits.map((split) => ({ label: `${split.startDistance}-${split.endDistance} m`, start: split.startDistance, end: split.endDistance }));
  const distance = analysis.distance ?? (analysis.analysisType?.endsWith("m") ? Number.parseInt(analysis.analysisType, 10) : null);
  if (!distance) return [];
  if (distance === 2000) {
    return [
      { label: "Depart", start: 0, end: 100 },
      { label: "Phase de lancement", start: 100, end: 500 },
      { label: "Stabilisation", start: 500, end: 1000 },
      { label: "Phase centrale", start: 1000, end: 1500 },
      { label: "Preparation finish", start: 1500, end: 1750 },
      { label: "Finish", start: 1750, end: 2000 },
    ];
  }
  const step = distance <= 1000 ? Math.min(250, distance) : 500;
  return Array.from({ length: Math.ceil(distance / step) }, (_, index) => {
    const start = index * step;
    const end = Math.min(distance, start + step);
    return { label: `${start}-${end} m`, start, end };
  });
}

function EmptyAdvanced({ label }: { label: string }) {
  return <div className="advanced-empty"><strong>{label}</strong><p>Non disponible. Aucune donnee mesuree ou estimee avec source et confiance reste enregistree pour cette analyse.</p></div>;
}

function MuscleVisualCards({ muscles }: { muscles: Array<[string, number | null]> }) {
  const rows = muscleVisualOrder.map((key) => {
    const visual = muscleVisuals[key];
    const measured = muscles.find(([label]) => muscleVisualKeyForLabel(label) === key);
    return { key, label: measured?.[0] ?? visual.label, value: measured?.[1] ?? null, visual };
  });
  return (
    <div className="muscle-visual-card-grid">
      {rows.map(({ key, label, value, visual }, index) => {
        const percentage = value == null ? 0 : Math.min(100, Math.max(0, value));
        return (
          <article key={key} className="muscle-visual-card">
            <div className="muscle-visual-body">
              <Image src={visual.path} alt={`Activation musculaire - ${label}`} width={180} height={320} sizes="(max-width: 700px) 42vw, 170px" />
            </div>
            <div className="muscle-visual-metrics">
              <span className="muscle-visual-ring" style={{ background: `conic-gradient(${visual.color} ${percentage * 3.6}deg, #12304a 0deg)` }}>
                <b>{value == null ? "--" : `${Math.round(value)}%`}</b>
              </span>
              <i><b style={{ width: `${percentage}%`, background: visual.color }} /></i>
              <svg viewBox="0 0 100 42" aria-hidden="true">
                <path d={visual.trend} style={{ stroke: visual.color }} />
                <path d={index < 3 ? "M 86 23 L 100 6 L 97 22 M 100 6 L 83 9" : "M 85 24 L 100 38 L 97 21 M 100 38 L 84 34"} style={{ stroke: visual.color }} />
              </svg>
            </div>
            <strong>{label}</strong>
          </article>
        );
      })}
    </div>
  );
}

function AdvancedAnalysisPanel({ analysis, tab, viewerRole }: { analysis: RowingAnalysis; tab: AnalysisTab; viewerRole: UserRole }) {
  const segments = distanceSegments(analysis);
  if (tab === "timeline") {
    return (
      <section className="advanced-analysis-card">
        <h2>Timeline interactive</h2>
        <div className="distance-timeline">
          {segments.length ? segments.map((segment) => <button key={`${segment.start}-${segment.end}`}>{segment.start}m<span>{segment.label}</span></button>) : <span>Distance non disponible</span>}
        </div>
        <p>Les clics de split/phase sont prets pour la synchronisation video par timestamp des que les splits ou coups contiennent des temps exploitables.</p>
      </section>
    );
  }
  if (tab === "race") {
    return (
      <section className="advanced-analysis-card">
        <h2>Race Phase Analysis</h2>
        {analysis.racePhases?.length ? <div className="advanced-table">{analysis.racePhases.map((phase) => <article key={phase.name}><strong>{phase.name}</strong><span>{formatNullable(phase.distance, "m")}</span><span>{formatNullable(phase.duration, "s")}</span><span>{formatNullable(phase.power, "W")}</span><small>{phase.measurementSource} · {phase.confidence}%</small></article>)}</div> : <EmptyAdvanced label="Phases de course" />}
      </section>
    );
  }
  if (tab === "start") {
    const start = analysis.startAnalysis;
    return (
      <section className="advanced-analysis-card">
        <h2>Start Analysis</h2>
        {start ? <><div className="score-grid"><article><small>Explosivite</small><strong>{formatNullable(start.scores.explosivity, "")}</strong></article><article><small>Synchronisation</small><strong>{formatNullable(start.scores.synchronization, "")}</strong></article><article><small>Cadence</small><strong>{formatNullable(start.scores.cadence, "")}</strong></article><article><small>Puissance</small><strong>{formatNullable(start.scores.power, "")}</strong></article><article><small>Technique</small><strong>{formatNullable(start.scores.technique, "")}</strong></article><article><small>Start Score</small><strong>{formatNullable(start.scores.overall, "/100")}</strong></article></div><div className="advanced-table">{start.strokes.slice(0, 10).map((stroke) => <article key={stroke.index}><strong>Stroke {stroke.index}</strong><span>{formatNullable(stroke.duration, "s")}</span><span>{formatNullable(stroke.power, "W")}</span><span>{formatNullable(stroke.acceleration, "m/s2")}</span><small>{stroke.measurementSource} · {stroke.confidence}%</small></article>)}</div></> : <EmptyAdvanced label="Start Analysis" />}
      </section>
    );
  }
  if (tab === "finish") {
    return <section className="advanced-analysis-card"><h2>Finish Analysis</h2>{analysis.finishAnalysis ? <div className="score-grid"><article><small>Finish Score</small><strong>{formatNullable(analysis.finishAnalysis.score, "/100")}</strong></article><article><small>Source</small><strong>{analysis.finishAnalysis.measurementSource}</strong></article><article><small>Confiance</small><strong>{analysis.finishAnalysis.confidence}%</strong></article></div> : <EmptyAdvanced label="Finish Analysis" />}</section>;
  }
  if (tab === "turns") {
    return <section className="advanced-analysis-card"><h2>Turn Analysis</h2>{analysis.turns?.length ? <div className="advanced-table">{analysis.turns.map((turn, index) => <article key={index}><strong>Turn {index + 1}</strong><span>{formatNullable(turn.entrySpeed, "m/s")}</span><span>{formatNullable(turn.minimumSpeed, "m/s")}</span><span>{formatNullable(turn.efficiencyScore, "/100")}</span><small>{turn.measurementSource} · {turn.confidence}%</small></article>)}</div> : <EmptyAdvanced label="Virages / tours" />}</section>;
  }
  if (tab === "stroke") {
    const strokes = analysis.strokes?.length ? analysis.strokes : displayCycles(analysis).map((cycle) => ({ index: cycle.index + 1, timestampStart: cycle.startTime, timestampEnd: cycle.endTime, duration: cycle.duration, strokeRate: cycle.strokeRate, power: null, speed: null, acceleration: null, measurementSource: "camera" as const, confidence: Math.round(cycle.confidence * 100) }));
    return <section className="advanced-analysis-card"><h2>Stroke Analysis</h2><div className="advanced-table">{strokes.slice(0, 12).map((stroke) => <article key={stroke.index}><strong>Stroke {stroke.index}</strong><span>{formatNullable(stroke.duration, "s")}</span><span>{formatNullable(stroke.strokeRate, "spm")}</span><span>{formatNullable(stroke.power, "W")}</span><small>{stroke.measurementSource} · {stroke.confidence}%</small></article>)}</div></section>;
  }
  if (tab === "muscle") {
    const ranges = getDisplayJointRanges(analysis);
    const muscles = getDisplayMuscleRows(analysis);
    const meta = getMuscleMeasurementMeta(analysis);
    const accessNotice = restrictedBiomechanicsNotice(viewerRole);
    const visibleJoints = jointDisplay.filter((joint) => canViewJointKey(viewerRole, joint.key));
    const postureRows = [
      { key: "knee", label: "Angle du genou", value: analysis.metrics?.kneeAngle },
      { key: "hip", label: "Angle de la hanche", value: analysis.metrics?.hipAngle },
      { key: "trunk", label: "Inclinaison du dos", value: analysis.metrics?.backAngle },
      { key: "shoulder", label: "Angle des épaules", value: analysis.metrics?.shoulderAngle },
      { key: "elbow", label: "Angle des coudes", value: analysis.metrics?.elbowAngle },
    ].filter((row) => canViewJointKey(viewerRole, row.key));
    return (
      <section className="advanced-analysis-card muscle-power-exploration">
        <h2>Muscle & Power - Exploration</h2>
        <p>Contribution musculaire estimee depuis la biomécanique. Ce n&apos;est pas une mesure EMG directe.</p>
        {accessNotice && <p className="biomechanics-access-note">{accessNotice}</p>}
        <MuscleVisualCards muscles={muscles} />
        <div className="joint-range-grid">
          {visibleJoints.map((joint) => (
            <article key={joint.key}>
              <strong>{joint.label}</strong>
              <span>Min : {formatNullable(ranges[joint.key]?.min, "deg")}</span>
              <span>Max : {formatNullable(ranges[joint.key]?.max, "deg")}</span>
              <span>Amplitude : {formatNullable(ranges[joint.key]?.amplitude, "deg")}</span>
            </article>
          ))}
        </div>
        <div className="score-grid">
          {muscles.map(([name, value]) => <article key={name}><small>{name}</small><strong>{formatNullable(value, "%")}</strong></article>)}
          <article><small>Source</small><strong>{meta.source}</strong></article>
          <article><small>Confiance</small><strong>{meta.confidence == null ? "Non disponible" : `${meta.confidence}%`}</strong></article>
        </div>
        <div className="posture-power-grid">
          {postureRows.map(({ label, value }) => <article key={label}><small>{label}</small><strong>{formatNullable(value, "°")}</strong></article>)}
        </div>
        <p>{meta.note}</p>
      </section>
    );
  }
  if (tab === "fatigue") {
    const fatigue = analysis.fatigue;
    return <section className="advanced-analysis-card"><h2>Fatigue musculaire</h2>{fatigue ? <div className="score-grid"><article><small>Power Loss</small><strong>{formatNullable(fatigue.powerLoss, "%")}</strong></article><article><small>Stroke Length</small><strong>{formatNullable(fatigue.strokeLengthLoss, "%")}</strong></article><article><small>Technique Loss</small><strong>{formatNullable(fatigue.techniqueLoss, "%")}</strong></article><article><small>Fatigue Index</small><strong>{formatNullable(fatigue.index, "/100")}</strong></article></div> : <EmptyAdvanced label="Fatigue Index" />}</section>;
  }
  if (tab === "COACH") {
    return <section className="advanced-analysis-card"><h2>AI Coach</h2><div className="analysis-conclusion-grid"><article><strong>Points forts</strong><p>{analysis.recommendations?.[0] ?? "Non disponible tant que l'analyse ne contient pas assez de donnees exploitables."}</p></article><article><strong>Points a ameliorer</strong><p>{analysis.errors?.[0] ?? "Non disponible."}</p></article><article><strong>Priorite technique</strong><p>{analysis.recommendations?.[1] ?? "Maintenir la longueur du coup lorsque la cadence augmente, si cette tendance est confirmee par les mesures."}</p></article><article><strong>Priorite physique</strong><p>Non disponible sans puissance, fatigue ou capteur associe.</p></article></div></section>;
  }
  return null;
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
  const [actionMessage, setActionMessage] = useState("");

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
    try {
      if (navigator.share) {
        await navigator.share({ title: title || "Analyse RowMotion AI", text: "Consultez cette analyse RowMotion AI", url });
        setActionMessage("Analyse partagée.");
      } else {
        await navigator.clipboard.writeText(url);
        setActionMessage("Lien copié.");
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      try {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
        setActionMessage("Lien copié.");
      } catch {
        setActionMessage("Partage indisponible sur ce navigateur.");
      }
    }
    window.setTimeout(() => setActionMessage(""), 2800);
  };

  const exportPdf = async () => {
    if (!analysis) return;
    setActionMessage("Préparation du fichier PDF…");
    try {
      await downloadAnalysisPdf(analysis, profile.role);
      setActionMessage("Le rapport PDF a été téléchargé.");
    } catch {
      setActionMessage("Impossible de générer le PDF pour le moment.");
    }
    window.setTimeout(() => setActionMessage(""), 3200);
  };

  const recalculateAngles = async () => {
    setActionMessage("Nouvelle mesure des angles en cours…");
    try {
      await queueAnalysis(id);
      setActionMessage("L’analyse biomécanique a été relancée.");
    } catch (reason) {
      setActionMessage(reason instanceof Error ? reason.message : "Impossible de relancer la mesure des angles.");
    }
    window.setTimeout(() => setActionMessage(""), 3200);
  };

  const title = analysis ? `Analyse vidéo – ${environmentLabels[analysis.environment]}` : "Analyse vidéo";
  const subtitle = analysis
    ? `${analysis.athleteName} · ${analysis.fileName || "Vidéo"} · ${dateLabel(analysis.createdAt)}`
    : "Chargement de l’analyse…";
  const biomechanicsNotice = restrictedBiomechanicsNotice(profile.role);
  const visiblePostureMetrics = analysis ? [
    { key: "knee", label: "Angle du genou", value: analysis.metrics?.kneeAngle, maximum: 180, unit: "°" },
    { key: "hip", label: "Angle de la hanche", value: analysis.metrics?.hipAngle, maximum: 180, unit: "°" },
    { key: "trunk", label: "Inclinaison du dos", value: analysis.metrics?.backAngle, maximum: 90, unit: "°" },
    { key: "shoulder", label: "Angle des épaules", value: analysis.metrics?.shoulderAngle, maximum: 180, unit: "°" },
    { key: "elbow", label: "Angle des coudes", value: analysis.metrics?.elbowAngle, maximum: 180, unit: "°" },
    { key: "symmetry", label: "Symétrie", value: analysis.metrics?.symmetryScore, maximum: 100, unit: "%" },
  ].filter((row) => row.key === "symmetry" || canViewJointKey(profile.role, row.key)) : [];
  const visibleCurveMetrics = analysis ? [
    { key: "knee", label: "Angle genou", value: analysis.metrics?.kneeAngle, unit: "°", samples: analysis.timelines?.kneeAngle ?? [], color: undefined },
    { key: "hip", label: "Angle hanche", value: analysis.metrics?.hipAngle, unit: "°", samples: analysis.timelines?.hipAngle ?? [], color: "#a267ff" },
    { key: "trunk", label: "Inclinaison du dos", value: analysis.metrics?.backAngle, unit: "°", samples: analysis.timelines?.backAngle ?? [], color: "#37d18b" },
    { key: "elbow", label: "Angle des coudes", value: analysis.metrics?.elbowAngle, unit: "°", samples: analysis.timelines?.elbowAngle ?? [], color: "#f05f9e" },
    { key: "shoulder", label: "Angle des épaules", value: analysis.metrics?.shoulderAngle, unit: "°", samples: analysis.timelines?.shoulderAngle ?? [], color: "#20bff3" },
    { key: "symmetry", label: "Symétrie", value: analysis.metrics?.symmetryScore, unit: "%", samples: analysis.timelines?.symmetry ?? [], color: "#f3b43b" },
  ].filter((row) => row.key === "symmetry" || canViewJointKey(profile.role, row.key)) : [];

  return (
    <AppShell
      referenceMode
      title={title}
      subtitle={subtitle}
      headerActions={
        <>
          <button className="button ghost analysis-action-button analysis-export-action" onClick={exportPdf}><Download />Exporter PDF</button>
          <button className="button ghost analysis-action-button analysis-share-action" onClick={() => void share()}><Share2 />Partager</button>
          <button className="reference-more" aria-label="Plus d’options"><MoreHorizontal /></button>
        </>
      }
    >
      <div className="video-analysis-reference">
        {actionMessage && <div className="analysis-action-toast" role="status">{actionMessage}</div>}
        <Link className="detail-back" href="/analyses"><ArrowLeft />Retour aux analyses</Link>
        {error ? <div className="error-card">{error}</div> : !analysis ? (
          <div className="loading-card">Chargement…</div>
        ) : (
          <>
            <nav className="video-analysis-tabs">
              <button className={tab === "timeline" ? "active" : ""} onClick={() => setTab("timeline")}>Timeline</button>
              <button className={tab === "stroke" ? "active" : ""} onClick={() => setTab("stroke")}>Stroke Analysis</button>
              <button className={tab === "race" ? "active" : ""} onClick={() => setTab("race")}>Race Phases</button>
              <button className={tab === "start" ? "active" : ""} onClick={() => setTab("start")}>Start</button>
              <button className={tab === "finish" ? "active" : ""} onClick={() => setTab("finish")}>Finish</button>
              <button className={tab === "turns" ? "active" : ""} onClick={() => setTab("turns")}>Turns</button>
              <button className={tab === "muscle" ? "active" : ""} onClick={() => setTab("muscle")}>Muscle & Power</button>
              <button className={tab === "fatigue" ? "active" : ""} onClick={() => setTab("fatigue")}>Fatigue</button>
              <button className={tab === "COACH" ? "active" : ""} onClick={() => setTab("COACH")}>AI Coach</button>
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

            <section className="advanced-score-strip">
              {[
                ["Technique Score", analysis.scores?.technique ?? analysis.technicalScore],
                ["Power Score", analysis.scores?.power ?? null],
                ["Efficiency Score", analysis.scores?.efficiency ?? null],
                ["Symmetry Score", analysis.scores?.symmetry ?? analysis.metrics?.symmetryScore],
                ["Start Score", analysis.scores?.start ?? analysis.startAnalysis?.scores.overall],
                ["Finish Score", analysis.scores?.finish ?? analysis.finishAnalysis?.score],
                ["Fatigue Index", analysis.scores?.fatigue ?? analysis.fatigue?.index],
              ].map(([label, value]) => (
                <article key={label}>
                  <small>{label}</small>
                  <strong>{typeof value === "number" ? value.toFixed(1) : "Non disponible"}</strong>
                </article>
              ))}
            </section>

            {["timeline", "stroke", "race", "start", "finish", "turns", "muscle", "fatigue", "COACH"].includes(tab) && (
              <AdvancedAnalysisPanel analysis={analysis} tab={tab} viewerRole={profile.role} />
            )}

            {!["comparison", "timeline", "stroke", "race", "start", "finish", "turns", "muscle", "fatigue", "COACH"].includes(tab) && (
              <>
              <div className={`video-analysis-layout ${tab}-view ${(analysis.analysisScope ?? "complete") === "general" ? "general-scope" : "complete-scope"}`}>
                <main>
                  <section className="video-stage-reference">
                    <div className="video-stage-label"><Video />{environmentLabels[analysis.environment]}</div>
                    <AnalysisVideoSource analysis={analysis} />
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
                  <PhaseSpeedChart analysis={analysis} />
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
                    <header>
                      <h2>Détails de la posture et des angles</h2>
                      {analysis.videoStorageMode === "firebase" && visiblePostureMetrics.some((item) => item.unit === "°" && item.value == null) && (
                        <button type="button" onClick={() => void recalculateAngles()}><RotateCcw />Recalculer les angles</button>
                      )}
                    </header>
                    {biomechanicsNotice && <p className="biomechanics-access-note">{biomechanicsNotice}</p>}
                    <div>
                      {visiblePostureMetrics.map(({ label, value, maximum, unit }) => (
                        <article key={label}><span><strong>{label}</strong><b>{measuredLabel(value, unit)}</b></span><i><b style={{ width: `${value == null ? 0 : Math.min(100, Math.max(0, value / maximum * 100))}%` }} /></i></article>
                      ))}
                    </div>
                  </section>
                  <section className="muscle-usage-card">
                    <header><Activity /><div><h2>Groupes musculaires</h2><small>Pourcentage d’utilisation estimé pour cette analyse</small></div></header>
                    <MuscleVisualCards muscles={getDisplayMuscleRows(analysis)} />
                    <div>
                      {([
                        ["Dos", muscleUsageFor(analysis).back],
                        ["Jambes", muscleUsageFor(analysis).legs],
                        ["Bras", muscleUsageFor(analysis).arms],
                        ["Gainage", muscleUsageFor(analysis).core],
                        ["Épaules", muscleUsageFor(analysis).shoulders],
                      ] as const).map(([label, value]) => <article key={label}><span><strong>{label}</strong><b>{analysis.muscleUsage ? `${value}%` : "Non disponible"}</b></span><i><b style={{ width: `${analysis.muscleUsage ? value : 0}%` }} /></i></article>)}
                    </div>
                    <p>Estimation biomécanique calculée depuis les amplitudes articulaires, la posture et la régularité. Une mesure physiologique exacte nécessite des capteurs EMG.</p>
                  </section>
                  {analysis.environment === "double_scull" && <section className="crew-analysis-card">
                    <header><Waves /><div><h2>Analyse du bateau double</h2><small>Résultats individuels et synchronisation de l’équipage</small></div></header>
                    {analysis.crewAnalysis ? <>
                      <div className="crew-rowers-grid">{analysis.crewAnalysis.rowers.map((rower) => <article key={rower.position}><span>Rameur {rower.position}</span><strong>{rower.technicalScore == null ? "—" : `${(rower.technicalScore / 10).toFixed(1)}/10`}</strong><small>Genou {measuredLabel(rower.metrics.kneeAngle, "°")}</small><small>Hanche {measuredLabel(rower.metrics.hipAngle, "°")}</small><small>Cadence {measuredLabel(rower.metrics.strokeRate, "spm")}</small><em>{Math.round(rower.confidence * 100)}% de détection</em></article>)}</div>
                      <div className="crew-sync-grid"><article><span><strong>Synchronisation globale</strong><b>{analysis.crewAnalysis.synchronizationScore == null ? "—" : `${analysis.crewAnalysis.synchronizationScore}%`}</b></span><i><b style={{ width: `${analysis.crewAnalysis.synchronizationScore ?? 0}%` }} /></i></article><article><span><strong>Décalage moyen</strong><b>{analysis.crewAnalysis.timingOffsetSeconds == null ? "—" : `${analysis.crewAnalysis.timingOffsetSeconds.toFixed(2)} s`}</b></span><i><b style={{ width: `${analysis.crewAnalysis.simultaneousDriveScore ?? 0}%` }} /></i></article></div>
                    </> : <p>Cette ancienne analyse ne contient pas les deux squelettes. Relancez l’analyse avec la discipline « Bateau double » et une vidéo où les deux rameurs sont entièrement visibles.</p>}
                  </section>}
                  {analysis.environment === "beach_sprint" && <section className="beach-analysis-card">
                    <header><Target /><div><h2>Profil Aviron Beach</h2><small>Indicateurs adaptés au Beach Sprint</small></div></header>
                    <div><article><small>Explosivité technique</small><strong>{measuredLabel(analysis.metrics?.sequenceScore, "%")}</strong></article><article><small>Stabilité / symétrie</small><strong>{measuredLabel(analysis.metrics?.symmetryScore, "%")}</strong></article><article><small>Cadence</small><strong>{measuredLabel(analysis.metrics?.strokeRate, "spm")}</strong></article><article><small>Régularité</small><strong>{measuredLabel(analysis.metrics?.rhythmScore, "%")}</strong></article></div>
                    <p>L’analyse couvre la technique d’aviron visible. Les phases de course sur la plage, la mise à l’eau et la sortie nécessitent une vidéo montrant l’épreuve complète.</p>
                  </section>}
                  <section className="sensor-profile-card">
                    <Waves />
                    <div><h2>Profil de mouvement</h2><strong>{analysis.metrics?.symmetryScore == null ? "Détection vidéo uniquement" : `${analysis.metrics.symmetryScore.toFixed(1)}% de symétrie`}</strong><p>{analysis.metrics?.rhythmScore == null ? "La régularité n’a pas pu être mesurée sur cette vidéo." : `Régularité du cycle : ${analysis.metrics.rhythmScore.toFixed(1)}%. Plus la vidéo contient de coups complets, plus cette estimation devient précise.`}</p></div>
                  </section>
                  <section className="analysis-curves-grid">
                    <header><div><h2>Courbes biomécaniques</h2><small>Évolution des mesures pendant la vidéo</small></div></header>
                    {biomechanicsNotice && <p className="biomechanics-access-note">{biomechanicsNotice}</p>}
                    <div>
                      {visibleCurveMetrics.map(({ label, value, unit, samples, color }) => (
                        <article key={label}><span>{label} <strong>{measuredLabel(value, unit)}</strong></span><TimelineChart samples={samples} color={color} /></article>
                      ))}
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

            {["COACH", "CLUB_ADMIN", "SUPER_ADMIN"].includes(profile.role) && (
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
