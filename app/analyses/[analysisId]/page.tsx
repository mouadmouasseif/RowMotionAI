"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileVideo,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Radio,
  Settings,
  Share2,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
  Target,
  Trophy,
  Upload,
  Users,
  Volume2,
  Waves,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProtectedPage } from "@/components/ProtectedPage";
import { downloadAnalysisPdf } from "@/lib/report-pdf";
import { useAuth } from "@/providers/AuthProvider";
import { getLocalAnalysisVideo } from "@/services/local-video-service";
import { subscribeToAnalysis, updateAnalysis } from "@/services/analysis-service";
import type { AnalysisMetrics, MetricSample, RowingAnalysis, StrokeCycle } from "@/types/analysis";

type PhaseName = "catch" | "leg_drive" | "mid_drive" | "finish" | "early_recovery" | "late_recovery";

interface TimePoint {
  time: number;
  value: number;
}

interface PhaseMetrics {
  kneeAngle?: number | null;
  hipAngle?: number | null;
  trunkAngle?: number | null;
  elbowAngle?: number | null;
  shoulderAngle?: number | null;
  power?: number | null;
  cadence?: number | null;
  force?: number | null;
  strokeLength?: number | null;
}

interface ViewPhase {
  id: string;
  name: PhaseName;
  label: string;
  startTime: number;
  endTime: number;
  confidence?: number | null;
  metrics: PhaseMetrics;
}

interface ViewStroke {
  index: number;
  startTime: number;
  endTime: number;
  duration?: number | null;
  cadence?: number | null;
  power?: number | null;
  confidence?: number | null;
  phases: ViewPhase[];
}

interface AnalysisViewModel {
  id: string;
  athleteName: string;
  discipline: string;
  boatType: string;
  distance?: number | null;
  createdLabel: string;
  video: { url: string | null; duration?: number | null; storageMode: RowingAnalysis["videoStorageMode"] };
  summary: {
    videoDuration?: number | null;
    strokeCount?: number | null;
    averageCadence?: number | null;
    averagePower?: number | null;
    technicalScore?: number | null;
    globalConfidence?: number | null;
  };
  strokes: ViewStroke[];
  biomechanics: Record<"knee" | "hip" | "trunk" | "elbow" | "shoulder" | "power" | "cadence", TimePoint[]>;
  muscleAnalysis?: {
    activations: Array<{ muscle: string; label: string; activation?: number | null; confidence?: number | null; trend: TimePoint[]; asset: string }>;
    distribution: Array<{ label: string; value?: number | null }>;
    emg: null;
  };
  crewAnalysis: RowingAnalysis["crewAnalysis"] | null;
  conclusions: { positives: string[]; improvements: string[]; nextActions: string[] };
  recommendations: string[];
  errors: string[];
  coachNote: string;
  raw: RowingAnalysis;
}

const phaseInfo: Record<PhaseName, { label: string; short: string; color: string; asset: string }> = {
  catch: { label: "Catch", short: "Catch", color: "#1597ff", asset: "/rowing-phases/neon-catch.png" },
  leg_drive: { label: "Leg Drive", short: "Leg Drive", color: "#1fd18a", asset: "/rowing-phases/neon-leg-drive.png" },
  mid_drive: { label: "Mid Drive", short: "Mid Drive", color: "#ffbd24", asset: "/rowing-phases/neon-mid-drive.png" },
  finish: { label: "Finish", short: "Finish", color: "#9b63ff", asset: "/rowing-phases/neon-finish.png" },
  early_recovery: { label: "Early Recovery", short: "Early Recovery", color: "#ef4b89", asset: "/rowing-phases/neon-early-recovery.png" },
  late_recovery: { label: "Late Recovery", short: "Late Recovery", color: "#19d3f3", asset: "/rowing-phases/neon-late-recovery.png" },
};

const disciplineLabels: Record<RowingAnalysis["environment"], string> = {
  boat: "Sur l'eau",
  double_scull: "Bateau double",
  ergometer: "Ergometre",
  beach_sprint: "Beach Sprint",
};

const navItems = [
  ["Tableau de bord", "/athlete/dashboard", LayoutDashboard],
  ["Analyses", "/analyses", FileVideo],
  ["Progression", "/progression", BarChart3],
  ["Plans d'entrainement", "/plans-entrainement", BookOpen],
  ["Athletes", "/athletes", Users],
  ["Comparaison", "/analyses", Activity],
  ["Coach AI", "/mon-coach", Sparkles],
  ["Competitions", "/competitions", Trophy],
  ["Rapports", "/rapports", MessageSquare],
  ["Parametres", "/parametres", Settings],
] as const;

const quickItems = [
  ["Importer video", "/analyses/nouvelle", Upload],
  ["Nouvelle analyse", "/analyses/nouvelle", Target],
  ["Capture live", "/analyses/live", Radio],
] as const;

function scoreOnTen(value: number | null | undefined) {
  if (value == null) return null;
  return value > 10 ? value / 10 : value;
}

function fmt(value: number | null | undefined, unit = "", digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function fmtTime(seconds: number | null | undefined, withMs = false) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${rest.toFixed(withMs ? 3 : 0).padStart(withMs ? 6 : 2, "0")}`;
}

function dateLabel(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  return "Date non renseignee";
}

function clampPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, value));
}

function normalizeSamples(samples?: MetricSample[], options: { smooth?: boolean; maxPoints?: number } = {}) {
  const clean = (samples ?? [])
    .filter((item) => Number.isFinite(item.time) && Number.isFinite(item.value))
    .map((item) => ({ time: item.time, value: item.value }));
  if (!clean.length) return [];
  const windowSize = options.smooth === false ? 1 : 5;
  const smoothed = clean.map((sample, index) => {
    const from = Math.max(0, index - Math.floor(windowSize / 2));
    const to = Math.min(clean.length, index + Math.floor(windowSize / 2) + 1);
    const group = clean.slice(from, to);
    return { time: sample.time, value: group.reduce((sum, item) => sum + item.value, 0) / group.length };
  });
  const maxPoints = options.maxPoints ?? 180;
  if (smoothed.length <= maxPoints) return smoothed;
  const step = Math.ceil(smoothed.length / maxPoints);
  return smoothed.filter((_, index) => index % step === 0 || index === smoothed.length - 1);
}

function averageConfidence(strokes: ViewStroke[]) {
  const values = strokes.map((stroke) => stroke.confidence).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) : null;
}

function fallbackCycles(analysis: RowingAnalysis): StrokeCycle[] {
  if (analysis.cycles?.length) return analysis.cycles;
  const cadence = analysis.cadenceTimeline ?? [];
  return cadence.slice(0, -1).map((sample, index) => {
    const next = cadence[index + 1];
    const duration = Math.max(next.time - sample.time, 0.01);
    return {
      index,
      startTime: sample.time,
      endTime: next.time,
      duration,
      driveTime: duration * 0.45,
      recoveryTime: duration * 0.55,
      driveRecoveryRatio: 0.82,
      strokeRate: sample.value,
      phases: [],
      metrics: { regularity: analysis.metrics.rhythmScore, sequenceScore: analysis.metrics.sequenceScore, symmetry: analysis.metrics.symmetryScore, technicalScore: analysis.technicalScore },
      errors: [],
      confidence: 0.45,
    };
  });
}

function sixPhaseSplit(cycle: StrokeCycle, metrics: AnalysisMetrics, power: number | null): ViewPhase[] {
  const start = cycle.startTime;
  const duration = Math.max(cycle.endTime - cycle.startTime, cycle.duration || 0.01);
  const ratios: Array<[PhaseName, number, number]> = [
    ["catch", 0, 0.13],
    ["leg_drive", 0.13, 0.34],
    ["mid_drive", 0.34, 0.54],
    ["finish", 0.54, 0.67],
    ["early_recovery", 0.67, 0.84],
    ["late_recovery", 0.84, 1],
  ];
  const phaseMetrics = {
    kneeAngle: metrics.kneeAngle,
    hipAngle: metrics.hipAngle,
    trunkAngle: metrics.backAngle,
    elbowAngle: metrics.elbowAngle,
    shoulderAngle: metrics.shoulderAngle,
    power,
    cadence: cycle.strokeRate,
    force: null,
    strokeLength: metrics.strokeLength,
  };
  return ratios.map(([name, from, to]) => {
    const recorded = cycle.phases.find((phase) => phase.name.toLowerCase().replace(/[\s'’]/g, "_").includes(name.split("_")[0]));
    return {
      id: `${cycle.index}-${name}`,
      name,
      label: phaseInfo[name].label,
      startTime: recorded?.startTime ?? start + duration * from,
      endTime: recorded?.endTime ?? start + duration * to,
      confidence: recorded?.confidence ?? cycle.confidence,
      metrics: phaseMetrics,
    };
  });
}

function buildViewModel(analysis: RowingAnalysis): AnalysisViewModel {
  const cycles = fallbackCycles(analysis);
  const strokes = cycles.map((cycle) => ({
    index: cycle.index + 1,
    startTime: cycle.startTime,
    endTime: cycle.endTime,
    duration: cycle.duration,
    cadence: cycle.strokeRate,
    power: analysis.metrics.estimatedPower,
    confidence: cycle.confidence,
    phases: sixPhaseSplit(cycle, analysis.metrics, analysis.metrics.estimatedPower),
  }));
  const biomechanics = {
    knee: normalizeSamples(analysis.timelines?.kneeAngle),
    hip: normalizeSamples(analysis.timelines?.hipAngle),
    trunk: normalizeSamples(analysis.timelines?.backAngle),
    elbow: normalizeSamples(analysis.timelines?.elbowAngle),
    shoulder: normalizeSamples(analysis.timelines?.shoulderAngle),
    power: normalizeSamples(analysis.biomechanics?.powerCurve?.points?.filter((point) => point.power != null).map((point) => ({ time: point.strokePercent, value: point.power ?? 0 }))),
    cadence: normalizeSamples(analysis.cadenceTimeline ?? analysis.timelines?.cadence),
  };
  const muscle = analysis.muscleUsage;
  const muscleActivations = [
    { muscle: "legs", label: "Jambes", activation: muscle?.legs ?? analysis.muscleEstimation?.groups.legs ?? analysis.muscleEstimation?.groups.Jambes ?? null, asset: "/biomechanics/muscle-legs.png" },
    { muscle: "glutes", label: "Fessiers", activation: analysis.muscleEstimation?.groups.glutes ?? null, asset: "/biomechanics/muscle-legs.png" },
    { muscle: "core", label: "Tronc / Gainage", activation: muscle?.core ?? analysis.muscleEstimation?.groups.core ?? analysis.muscleEstimation?.groups.Gainage ?? null, asset: "/biomechanics/muscle-core.png" },
    { muscle: "back", label: "Dos", activation: muscle?.back ?? analysis.muscleEstimation?.groups.back ?? analysis.muscleEstimation?.groups.Dos ?? null, asset: "/biomechanics/muscle-back.png" },
    { muscle: "arms", label: "Bras", activation: muscle?.arms ?? analysis.muscleEstimation?.groups.arms ?? analysis.muscleEstimation?.groups.Bras ?? null, asset: "/biomechanics/muscle-arms.png" },
    { muscle: "shoulders", label: "Epaules", activation: muscle?.shoulders ?? analysis.muscleEstimation?.groups.shoulders ?? analysis.muscleEstimation?.groups.Epaules ?? null, asset: "/biomechanics/muscle-shoulders.png" },
  ].map((row) => ({ ...row, activation: clampPercent(row.activation), confidence: analysis.muscleEstimation?.confidence ?? null, trend: [] as TimePoint[] }));
  const recommendations = analysis.recommendations ?? [];
  const errors = analysis.errors ?? [];
  return {
    id: analysis.id,
    athleteName: analysis.athleteName || "Athlete",
    discipline: disciplineLabels[analysis.environment],
    boatType: analysis.environment === "double_scull" ? "Bateau double" : disciplineLabels[analysis.environment],
    distance: analysis.distance,
    createdLabel: dateLabel(analysis.createdAt),
    video: { url: analysis.videoUrl, duration: analysis.durationSeconds, storageMode: analysis.videoStorageMode },
    summary: {
      videoDuration: analysis.durationSeconds,
      strokeCount: strokes.length || analysis.splits?.reduce((sum, split) => sum + (split.strokeCount ?? 0), 0) || null,
      averageCadence: analysis.metrics.strokeRate,
      averagePower: analysis.metrics.estimatedPower,
      technicalScore: scoreOnTen(analysis.technicalScore),
      globalConfidence: averageConfidence(strokes),
    },
    strokes,
    biomechanics,
    muscleAnalysis: { activations: muscleActivations, distribution: [
      { label: "Membres inferieurs", value: clampPercent(muscle?.legs) },
      { label: "Dos", value: clampPercent(muscle?.back) },
      { label: "Epaules", value: clampPercent(muscle?.shoulders) },
      { label: "Bras", value: clampPercent(muscle?.arms) },
      { label: "Gainage", value: clampPercent(muscle?.core) },
      { label: "Mobilite", value: clampPercent(analysis.metrics.rhythmScore) },
    ], emg: null },
    crewAnalysis: analysis.crewAnalysis ?? null,
    conclusions: {
      positives: recommendations.slice(0, 3),
      improvements: errors.slice(0, 3),
      nextActions: recommendations.slice(3, 6),
    },
    recommendations,
    errors,
    coachNote: analysis.coachComment ?? "",
    raw: analysis,
  };
}

function seriesPath(samples: TimePoint[], width = 100, height = 100) {
  if (samples.length < 2) return "";
  const values = samples.map((sample) => sample.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const points = samples.map((sample, index) => {
    const x = (index / Math.max(samples.length - 1, 1)) * width;
    const y = height - ((sample.value - min) / spread) * (height * 0.78) - height * 0.1;
    return { x, y };
  });
  return points.map((point, index) => {
    if (index === 0) return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `Q ${controlX.toFixed(2)} ${previous.y.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join(" ");
}

function EmptyState({ label }: { label: string }) {
  return <div className="analysis-ref-empty"><AlertTriangle /><span>{label}</span></div>;
}

function AnalysisSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const name = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || profile?.displayName || "RowMotion";
  return (
    <>
      {open && <button className="analysis-ref-overlay" aria-label="Fermer le menu" onClick={onClose} />}
      <aside className={`analysis-ref-sidebar ${open ? "open" : ""}`}>
        <Brand compact />
        <Link className="analysis-ref-user" href="/profil">
          <ProfileAvatar photoUrl={profile?.profilePhotoUrl} firstName={profile?.firstName ?? ""} lastName={profile?.lastName ?? ""} />
          <span><strong>{name}</strong><small>{profile?.role === "SUPER_ADMIN" ? "Super Admin" : profile?.role ?? "Utilisateur"}</small></span>
          <ChevronRight />
        </Link>
        <nav>
          <small>Navigation</small>
          {navItems.map(([label, href, Icon]) => <Link className={label === "Analyses" ? "active" : ""} href={href} key={label} onClick={onClose}><Icon />{label}</Link>)}
        </nav>
        <nav>
          <small>Outils rapides</small>
          {quickItems.map(([label, href, Icon]) => <Link href={href} key={label} onClick={onClose}><Icon />{label}</Link>)}
        </nav>
        <div className="analysis-ref-sidebar-bottom">
          <Link href="/aide"><HelpCircle />Aide & support</Link>
          <span><Waves />RowMotion AI <small>v2.0.0</small></span>
        </div>
      </aside>
    </>
  );
}

function AnalysisHeader({ vm, analysis, onMenu }: { vm: AnalysisViewModel; analysis: RowingAnalysis; onMenu: () => void }) {
  return (
    <header className="analysis-ref-header">
      <button className="analysis-ref-menu" aria-label="Ouvrir le menu" onClick={onMenu}><Menu /></button>
      <div>
        <h1>Analyse video – {vm.boatType}</h1>
        <p>{vm.athleteName} • {vm.discipline} • {vm.distance ? `${vm.distance} m` : "Distance non disponible"} • {vm.createdLabel}</p>
      </div>
      <div className="analysis-ref-actions">
        <button onClick={() => void downloadAnalysisPdf(analysis)}><Download />Exporter PDF</button>
        <button><Share2 />Partager</button>
        <button aria-label="Plus d'options"><MoreHorizontal /></button>
      </div>
    </header>
  );
}

function KpiRow({ vm }: { vm: AnalysisViewModel }) {
  const cards = [
    ["Temps de la video", fmtTime(vm.summary.videoDuration)],
    ["Distance", vm.distance ? `${vm.distance} m` : "—"],
    ["Coups analyses", vm.summary.strokeCount == null ? "—" : String(vm.summary.strokeCount)],
    ["Cadence moyenne", fmt(vm.summary.averageCadence, "spm")],
    ["Puissance moyenne", fmt(vm.summary.averagePower, "W")],
    ["Score technique", vm.summary.technicalScore == null ? "—" : `${vm.summary.technicalScore.toFixed(1)} /10`],
    ["Confiance globale", vm.summary.globalConfidence == null ? "—" : `${vm.summary.globalConfidence}%`],
  ];
  return <section className="analysis-ref-kpis">{cards.map(([label, value]) => <article key={label}><small>{label}</small><strong>{value}</strong></article>)}</section>;
}

function AnalysisVideoPlayer({ analysis, currentTime, onTimeChange }: { analysis: RowingAnalysis; currentTime: number; onTimeChange: (time: number) => void }) {
  const [source, setSource] = useState(analysis.videoUrl ?? "");
  const [loading, setLoading] = useState(analysis.videoStorageMode === "local");
  const [error, setError] = useState("");
  const [speed, setSpeed] = useState(1);
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const videoRef = useRef<HTMLVideoElement>(null);
  const duration = videoRef.current?.duration || analysis.durationSeconds || 0;
  const seek = (time: number) => {
    const next = Math.max(0, Math.min(time, duration || time));
    if (videoRef.current) videoRef.current.currentTime = next;
    onTimeChange(next);
  };

  useEffect(() => {
    setError("");
    if (analysis.videoStorageMode !== "local") {
      setSource(analysis.videoUrl ?? "");
      setLoading(false);
      return;
    }
    let objectUrl = "";
    let active = true;
    setLoading(true);
    void getLocalAnalysisVideo(analysis.id).then((video) => {
      if (!active) {
        if (video?.url) URL.revokeObjectURL(video.url);
        return;
      }
      if (!video) throw new Error("Cette video locale n'est plus disponible dans ce navigateur.");
      objectUrl = video.url;
      setSource(video.url);
      setLoading(false);
    }).catch((reason) => {
      if (active) {
        setError(reason instanceof Error ? reason.message : "Impossible de charger la video.");
        setLoading(false);
      }
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [analysis.id, analysis.videoStorageMode, analysis.videoUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  return (
    <section className="analysis-ref-card video-card">
      <h2>Video d&apos;analyse</h2>
      <div className="analysis-ref-video-frame">
        {loading ? <EmptyState label="Chargement de la video" /> : error ? <EmptyState label={error} /> : source ? (
          <video
            ref={videoRef}
            src={source}
            playsInline
            className={fit === "contain" ? "contain" : "cover"}
            onTimeUpdate={(event) => onTimeChange(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => onTimeChange(Math.min(currentTime, event.currentTarget.duration || currentTime))}
          />
        ) : <EmptyState label="Aucune video enregistree" />}
      </div>
      <div className="analysis-ref-scrub"><i style={{ width: duration ? `${Math.min(100, (currentTime / duration) * 100)}%` : "0%" }} /></div>
      <div className="analysis-ref-player-controls">
        <button onClick={() => seek(currentTime - 1 / 30)} aria-label="Image precedente"><SkipBack /></button>
        <button onClick={() => videoRef.current?.paused ? void videoRef.current.play() : videoRef.current?.pause()} aria-label="Lecture pause">{videoRef.current?.paused === false ? <Pause /> : <Play />}</button>
        <button onClick={() => seek(currentTime + 1 / 30)} aria-label="Image suivante"><SkipForward /></button>
        <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="Vitesse">
          {[0.25, 0.5, 1, 1.5, 2].map((value) => <option value={value} key={value}>{value}x</option>)}
        </select>
        <button onClick={() => setFit((value) => value === "contain" ? "cover" : "contain")}>{fit === "contain" ? "Contain" : "Fill"}</button>
        <strong>{fmtTime(currentTime, true)} / {fmtTime(duration, true)}</strong>
        <Volume2 />
        <button onClick={() => videoRef.current?.requestFullscreen()} aria-label="Plein ecran">⛶</button>
      </div>
    </section>
  );
}

function PhaseIllustration({ phase, active, onClick }: { phase: ViewPhase; active: boolean; onClick: () => void }) {
  const info = phaseInfo[phase.name];
  return (
    <button className={`phase-illustration ${active ? "active" : ""}`} style={{ "--phase": info.color } as React.CSSProperties} onClick={onClick} aria-label={`${info.label} ${fmtTime(phase.startTime, true)}`}>
      <Image src={info.asset} alt={info.label} width={112} height={74} />
      <b>{info.label}</b>
      <small>{fmtTime(phase.startTime, true)}</small>
    </button>
  );
}

function RowingStrokeCycle({ stroke, activePhase, currentTime, onSeek }: { stroke: ViewStroke | null; activePhase: ViewPhase | null; currentTime: number; onSeek: (time: number) => void }) {
  if (!stroke) return <section className="analysis-ref-card cycle-card"><EmptyState label="Cycle non disponible" /></section>;
  const points = stroke.phases.map((phase, index) => ({ phase, x: 34 + index * 61, y: 74 + Math.sin(index * 1.6) * 22 }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "S"} ${point.x - 20} ${point.y + 30}, ${point.x} ${point.y}`).join(" ");
  const duration = Math.max(stroke.endTime - stroke.startTime, 0.01);
  const cursorX = 34 + Math.min(1, Math.max(0, (currentTime - stroke.startTime) / duration)) * 305;
  return (
    <section className="analysis-ref-card cycle-card">
      <header><h2>Cycle du coup</h2><span>Stroke <b>{stroke.index}</b></span></header>
      <svg viewBox="0 0 380 150" aria-label="Cycle du coup avec phases">
        <path d={path} />
        <line className="cycle-cursor" x1={cursorX} x2={cursorX} y1="24" y2="128" />
        {points.map(({ phase, x, y }) => <circle key={phase.id} cx={x} cy={y} r={activePhase?.id === phase.id ? 8 : 6} tabIndex={0} role="button" aria-label={phaseInfo[phase.name].label} style={{ fill: phaseInfo[phase.name].color }} onClick={() => onSeek(phase.startTime)} />)}
      </svg>
      <div className="cycle-phase-strip">{stroke.phases.map((phase) => <PhaseIllustration phase={phase} active={activePhase?.id === phase.id} key={phase.id} onClick={() => onSeek(phase.startTime)} />)}</div>
    </section>
  );
}

function FullPhaseTimeline({ stroke, activePhase, onSeek }: { stroke: ViewStroke | null; activePhase: ViewPhase | null; onSeek: (time: number) => void }) {
  return (
    <section className="analysis-ref-card full-phase-timeline">
      {stroke?.phases.map((phase, index) => {
        const info = phaseInfo[phase.name];
        return (
          <button key={phase.id} className={activePhase?.id === phase.id ? "active" : ""} style={{ "--phase": info.color } as React.CSSProperties} onClick={() => onSeek(phase.startTime)}>
            <Image src={info.asset} alt={info.label} width={118} height={78} />
            <strong>{index + 1} {info.short}</strong>
            <span><i />{fmtTime(phase.startTime, true)}</span>
          </button>
        );
      }) ?? <EmptyState label="Phases non disponibles" />}
    </section>
  );
}

function ActivePhaseCard({ phase }: { phase: ViewPhase | null }) {
  const metrics = phase?.metrics;
  const rows = [
    ["Genou", metrics?.kneeAngle, "°"],
    ["Hanche", metrics?.hipAngle, "°"],
    ["Tronc", metrics?.trunkAngle, "°"],
    ["Coude", metrics?.elbowAngle, "°"],
    ["Epaule", metrics?.shoulderAngle, "°"],
    ["Puissance", metrics?.power, "W"],
    ["Cadence", metrics?.cadence, "spm"],
    ["Force", metrics?.force, "N"],
    ["Longueur", metrics?.strokeLength, "m"],
  ];
  return (
    <section className="active-phase-row">
      <article className="analysis-ref-card active-phase-card">
        <small>Phase active</small>
        <h2>{phase ? `${Object.keys(phaseInfo).indexOf(phase.name) + 1} ${phaseInfo[phase.name].label}` : "—"}</h2>
        <p>{phase ? `${fmtTime(phase.startTime, true)} – ${fmtTime(phase.endTime, true)}` : "Non disponible"}</p>
        <em>Confiance {phase?.confidence == null ? "—" : `${Math.round(phase.confidence * 100)}%`}</em>
      </article>
      <article className="analysis-ref-card phase-metrics-card">
        <h2>Metriques de la phase</h2>
        <div>{rows.map(([label, value, unit]) => <article key={label as string}><small>{label}</small><strong>{fmt(value as number | null | undefined, unit as string, unit === "m" ? 2 : 1)}</strong></article>)}</div>
      </article>
    </section>
  );
}

function StrokeNavigation({ selected, total, onChange, stroke }: { selected: number; total: number; onChange: (index: number) => void; stroke: ViewStroke | null }) {
  return (
    <section className="stroke-nav-row">
      <article className="analysis-ref-card stroke-nav-card">
        <h2>Navigation des coups</h2>
        <button disabled={selected <= 0} onClick={() => onChange(selected - 1)}><ChevronLeft />Precedent</button>
        <strong>{total ? `${selected + 1} / ${total}` : "—"}</strong>
        <button disabled={!total || selected >= total - 1} onClick={() => onChange(selected + 1)}>Suivant<ChevronRight /></button>
      </article>
      <article className="analysis-ref-card phase-buttons-card">
        <h2>Phases du coup</h2>
        {stroke?.phases.map((phase, index) => <button key={phase.id} style={{ "--phase": phaseInfo[phase.name].color } as React.CSSProperties} onClick={() => onChange(selected)}>{index + 1}</button>)}
      </article>
    </section>
  );
}

function MultiLineChart({ title, series, currentTime, onSeek }: { title: string; currentTime: number; onSeek: (time: number) => void; series: Array<{ label: string; color: string; samples: TimePoint[] }> }) {
  const available = series.filter((item) => item.samples.length >= 2);
  const maxTime = Math.max(...available.flatMap((item) => item.samples.map((sample) => sample.time)), 1);
  const cursorX = Math.min(100, Math.max(0, currentTime / maxTime * 100));
  return (
    <section className="analysis-ref-card biomech-chart-card">
      <header><h2>{title}</h2><div>{available.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}</div></header>
      {available.length ? (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onSeek(((event.clientX - rect.left) / rect.width) * maxTime);
        }} role="img" aria-label={title}>
          {[20, 40, 60, 80].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} />)}
          {available.map((item) => <path key={item.label} d={seriesPath(item.samples)} style={{ stroke: item.color }} />)}
          <line className="chart-cursor" x1={cursorX} x2={cursorX} y1="0" y2="100" />
        </svg>
      ) : <EmptyState label="Donnees biomecaniques non disponibles" />}
    </section>
  );
}

function SingleChart({ title, value, unit, samples, color, currentTime, onSeek }: { title: string; value?: number | null; unit: string; samples: TimePoint[]; color: string; currentTime: number; onSeek: (time: number) => void }) {
  return (
    <article className="analysis-ref-card small-line-chart">
      <h2>{title}</h2><strong>{fmt(value, unit)}</strong>
      <MultiLineMini samples={samples} color={color} currentTime={currentTime} onSeek={onSeek} />
    </article>
  );
}

function MultiLineMini({ samples, color, currentTime, onSeek }: { samples: TimePoint[]; color: string; currentTime: number; onSeek?: (time: number) => void }) {
  const maxTime = Math.max(...samples.map((sample) => sample.time), 1);
  return samples.length >= 2 ? (
    <svg viewBox="0 0 100 52" preserveAspectRatio="none" onClick={(event) => {
      if (!onSeek) return;
      const rect = event.currentTarget.getBoundingClientRect();
      onSeek(((event.clientX - rect.left) / rect.width) * maxTime);
    }}>
      <path d={seriesPath(samples, 100, 52)} style={{ stroke: color }} />
      <line x1={Math.min(100, currentTime / maxTime * 100)} x2={Math.min(100, currentTime / maxTime * 100)} y1="0" y2="52" />
    </svg>
  ) : <EmptyState label="Non disponible" />;
}

function DetectedCycles({ strokes, selected, onSelect }: { strokes: ViewStroke[]; selected: number; onSelect: (index: number) => void }) {
  return (
    <section className="analysis-ref-card detected-cycles">
      <h2>Phases et cycles detectes</h2>
      <div>{strokes.slice(0, 8).map((stroke, index) => <button className={selected === index ? "active" : ""} onClick={() => onSelect(index)} key={stroke.index}><strong>Cycle {stroke.index}</strong><span>{fmtTime(stroke.startTime)} → {fmtTime(stroke.endTime)}</span><small>{fmt(stroke.cadence, "spm")}</small></button>)}</div>
      {!strokes.length && <EmptyState label="Aucun cycle detecte" />}
    </section>
  );
}

function PhaseEvaluation({ stroke }: { stroke: ViewStroke | null }) {
  return (
    <section className="analysis-ref-card phase-evaluation">
      <h2>Evaluation par phase</h2>
      {stroke?.phases.map((phase) => {
        const confidence = phase.confidence == null ? null : Math.round(phase.confidence * 100);
        const status = confidence == null ? "Non disponible" : confidence >= 80 ? "Bon" : confidence >= 55 ? "A ameliorer" : "Critique";
        return <article key={phase.id}><i style={{ background: phaseInfo[phase.name].color }} /><strong>{phaseInfo[phase.name].label}</strong><span>{confidence == null ? "Observation non disponible" : `${confidence}% de confiance`}</span><em>{status}</em></article>;
      }) ?? <EmptyState label="Evaluation non disponible" />}
    </section>
  );
}

function MuscleAnalysis({ vm }: { vm: AnalysisViewModel }) {
  const muscle = vm.muscleAnalysis;
  return (
    <section className="muscle-analysis-grid">
      <article className="analysis-ref-card muscle-cards-panel">
        <h2>Groupes musculaires <small>(activation moyenne)</small></h2>
        <div>{muscle?.activations.map((item) => <article key={item.muscle}><Image src={item.asset} alt={item.label} width={88} height={132} /><span style={{ background: `conic-gradient(#1597ff ${item.activation ?? 0}%, #14344c 0)` }}><b>{item.activation == null ? "—" : `${Math.round(item.activation)}%`}</b></span><strong>{item.label}</strong><small>{item.activation == null ? "Non disponible" : item.confidence == null ? "Estimation biomecanique" : `Confiance ${item.confidence}%`}</small></article>)}</div>
      </article>
      <article className="analysis-ref-card muscle-distribution">
        <h2>Repartition de l&apos;utilisation musculaire</h2>
        {muscle?.distribution.map((row) => <p key={row.label}><span>{row.label}</span><i><b style={{ width: `${row.value ?? 0}%` }} /></i><strong>{row.value == null ? "Non mesure" : `${Math.round(row.value)}%`}</strong></p>)}
      </article>
      <article className="analysis-ref-card emg-panel">
        <h2>{muscle?.emg ? "Activite EMG" : "Estimation d'activation musculaire"}</h2>
        <p className="source-pill">Estimation biomecanique</p>
        {["Quadriceps", "Ischio-jambiers", "Fessiers", "Grand dorsal", "Biceps", "Epaules"].map((label) => <p key={label}><span>{label}</span><strong>Non mesure</strong></p>)}
      </article>
    </section>
  );
}

function CrewAnalysis({ vm }: { vm: AnalysisViewModel }) {
  const crew = vm.crewAnalysis;
  return (
    <section className="analysis-ref-card crew-ref-card">
      <h2>Analyse du bateau double</h2>
      <div className="crew-score-grid">
        <article><small>Score technique global</small><strong>{vm.summary.technicalScore == null ? "—" : `${vm.summary.technicalScore.toFixed(1)}/10`}</strong></article>
        <article><small>Score d&apos;efficacite</small><strong>{crew?.simultaneousDriveScore == null ? "Non disponible" : `${(crew.simultaneousDriveScore / 10).toFixed(1)}/10`}</strong></article>
      </div>
      <div className="crew-indicators">
        {[
          ["Synchronisation", crew?.synchronizationScore],
          ["Equilibre", crew?.simultaneousDriveScore],
          ["Rythme", vm.raw.metrics.rhythmScore],
          ["Coordination", vm.raw.metrics.sequenceScore],
          ["Homogeneite", vm.raw.metrics.symmetryScore],
        ].map(([label, value]) => <p key={label as string}><span>{label}</span><strong>{typeof value === "number" ? `${value.toFixed(1)}%` : "Non disponible"}</strong></p>)}
      </div>
    </section>
  );
}

function MovementProfile({ vm }: { vm: AnalysisViewModel }) {
  const tags = [
    vm.raw.metrics.estimatedPower != null ? "Solide en puissance" : null,
    vm.crewAnalysis?.synchronizationScore != null ? "Synchronisation bonne" : null,
    vm.raw.metrics.rhythmScore != null ? "Rythme regulier" : null,
    vm.errors.length ? "A optimiser" : null,
  ].filter(Boolean);
  return (
    <section className="analysis-ref-card movement-profile">
      <h2>Profil de mouvement</h2>
      <p>{vm.raw.metrics.rhythmScore == null ? "Profil de mouvement incomplet : certaines mesures ne sont pas disponibles." : `Rythme mesure a ${vm.raw.metrics.rhythmScore.toFixed(1)}%, avec donnees calculees depuis la video.`}</p>
      <div>{tags.length ? tags.map((tag) => <span key={tag}>{tag}</span>) : <span>Non disponible</span>}</div>
    </section>
  );
}

function MiniCharts({ vm, currentTime, onSeek }: { vm: AnalysisViewModel; currentTime: number; onSeek: (time: number) => void }) {
  const items = [
    ["Angle genou", vm.raw.metrics.kneeAngle, vm.biomechanics.knee, "#1597ff"],
    ["Angle hanche", vm.raw.metrics.hipAngle, vm.biomechanics.hip, "#1fd18a"],
    ["Angle tronc", vm.raw.metrics.backAngle, vm.biomechanics.trunk, "#ff8b18"],
    ["Angle coude", vm.raw.metrics.elbowAngle, vm.biomechanics.elbow, "#9b63ff"],
    ["Angle epaule", vm.raw.metrics.shoulderAngle, vm.biomechanics.shoulder, "#19d3f3"],
  ] as const;
  return <section className="analysis-ref-card mini-chart-grid"><h2>Courbes biomecaniques detaillees</h2><div>{items.map(([label, value, samples, color]) => <article key={label}><small>{label}</small><strong>{fmt(value, "°")}</strong><MultiLineMini samples={samples} color={color} currentTime={currentTime} onSeek={onSeek} /></article>)}</div></section>;
}

function Conclusion({ vm }: { vm: AnalysisViewModel }) {
  const columns = [
    ["Ce qui est positif", vm.conclusions.positives],
    ["Points d'amelioration", vm.conclusions.improvements],
    ["Prochaines actions", vm.conclusions.nextActions],
  ];
  return <section className="analysis-ref-card conclusion-grid"><h2>Conclusion de l&apos;analyse</h2><div>{columns.map(([title, rows]) => <article key={title as string}><strong>{title}</strong>{(rows as string[]).length ? (rows as string[]).map((row) => <p key={row}>✓ {row}</p>) : <p>Non disponible</p>}</article>)}</div></section>;
}

function KeyIndicators({ vm }: { vm: AnalysisViewModel }) {
  const indicators = [
    ["Score technique", vm.summary.technicalScore, "/10"],
    ["Cadence moyenne", vm.summary.averageCadence, "spm"],
    ["Puissance moyenne", vm.summary.averagePower, "W"],
    ["Efficacite", vm.crewAnalysis?.simultaneousDriveScore ?? vm.raw.scores?.efficiency, "%"],
    ["Longueur / coup", vm.raw.metrics.strokeLength, "m"],
    ["Force moyenne", null, "N"],
  ] as const;
  return <section className="analysis-ref-card key-indicators"><h2>Indicateurs cles</h2><div>{indicators.map(([label, value, unit]) => <article key={label}><small>{label}</small><strong>{fmt(value, unit, unit === "m" ? 2 : 1)}</strong></article>)}</div></section>;
}

function TechnicalResults({ vm }: { vm: AnalysisViewModel }) {
  const rows = [
    ["Transfert de puissance des jambes", vm.raw.metrics.estimatedPower],
    ["Utilisation du tronc", vm.raw.metrics.backAngle],
    ["Coordination", vm.raw.metrics.sequenceScore],
    ["Amplitude de mouvement", vm.raw.metrics.strokeLength],
    ["Rythme et regularite", vm.raw.metrics.rhythmScore],
  ] as const;
  return <section className="analysis-ref-card technical-results"><h2>Resultats techniques</h2>{rows.map(([label, value]) => <p key={label}><ShieldCheck /><span>{label}</span><strong>{value == null ? "Non disponible" : "Mesure"}</strong></p>)}</section>;
}

function DataOrigin({ vm }: { vm: AnalysisViewModel }) {
  const rows = [
    ["Video analysis", vm.video.url ? "Measured" : "Non disponible"],
    ["Pose detection model", vm.raw.metricsSource === "biomechanics_engine" ? "Detected" : "Detected"],
    ["Rowing biomechanical engine", vm.raw.biomechanics ? "Calculated" : "Non disponible"],
    ["Sensor sources", vm.raw.metricValues ? "Measured / Manual" : "Non disponible"],
    ["Muscle activation", vm.raw.muscleEstimation || vm.raw.muscleUsage ? "Estimated" : "Non disponible"],
  ];
  return <section className="analysis-ref-card data-origin"><Gauge /><div><h2>Origine des donnees</h2>{rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div></section>;
}

function CoachNote({ vm }: { vm: AnalysisViewModel }) {
  const { profile } = useAuth();
  const [note, setNote] = useState(vm.coachNote);
  const [saving, setSaving] = useState(false);
  useEffect(() => setNote(vm.coachNote), [vm.coachNote]);
  if (!profile || !["COACH", "CLUB_ADMIN", "SUPER_ADMIN", "TECHNICAL_DIRECTOR"].includes(profile.role)) return null;
  return (
    <section className="analysis-ref-card coach-note">
      <h2>Note coach</h2>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ajouter votre commentaire technique..." />
      <button disabled={saving} onClick={() => {
        setSaving(true);
        void updateAnalysis(vm.id, { coachComment: note }).finally(() => setSaving(false));
      }}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
    </section>
  );
}

function Detail({ id }: { id: string }) {
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<RowingAnalysis | null>(null);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStroke, setSelectedStroke] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!profile) return;
    return subscribeToAnalysis(id, profile, setAnalysis, (reason) => setError(reason.message));
  }, [id, profile]);

  const vm = useMemo(() => analysis ? buildViewModel(analysis) : null, [analysis]);
  const stroke = vm?.strokes[selectedStroke] ?? vm?.strokes[0] ?? null;
  const activePhase = stroke?.phases.find((phase) => currentTime >= phase.startTime && currentTime <= phase.endTime) ?? stroke?.phases[0] ?? null;
  const seek = (time: number) => setCurrentTime(time);
  const selectStroke = (index: number) => {
    const next = Math.min(Math.max(index, 0), Math.max((vm?.strokes.length ?? 1) - 1, 0));
    setSelectedStroke(next);
    const nextStroke = vm?.strokes[next];
    if (nextStroke) setCurrentTime(nextStroke.startTime);
  };

  if (!profile) return null;

  return (
    <main className="analysis-ref-page">
      <AnalysisSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <section className="analysis-ref-main">
        {!vm || !analysis ? (
          <div className="analysis-ref-loading">{error ? <EmptyState label={error} /> : <EmptyState label="Chargement de l'analyse" />}</div>
        ) : (
          <>
            <AnalysisHeader vm={vm} analysis={analysis} onMenu={() => setDrawerOpen(true)} />
            <KpiRow vm={vm} />
            <section className="video-cycle-grid">
              <AnalysisVideoPlayer analysis={analysis} currentTime={currentTime} onTimeChange={setCurrentTime} />
              <RowingStrokeCycle stroke={stroke} activePhase={activePhase} currentTime={currentTime} onSeek={seek} />
            </section>
            <FullPhaseTimeline stroke={stroke} activePhase={activePhase} onSeek={seek} />
            <ActivePhaseCard phase={activePhase} />
            <StrokeNavigation selected={selectedStroke} total={vm.strokes.length} onChange={selectStroke} stroke={stroke} />
            <section className="biomech-power-grid">
              <MultiLineChart title="Courbes biomecaniques" currentTime={currentTime} onSeek={seek} series={[
                { label: "Genou", color: "#1597ff", samples: vm.biomechanics.knee },
                { label: "Hanche", color: "#1fd18a", samples: vm.biomechanics.hip },
                { label: "Tronc", color: "#ffbd24", samples: vm.biomechanics.trunk },
                { label: "Coude", color: "#9b63ff", samples: vm.biomechanics.elbow },
                { label: "Epaule", color: "#19d3f3", samples: vm.biomechanics.shoulder },
              ]} />
              <div className="power-cadence-column">
                <SingleChart title="Puissance instantanee" value={vm.summary.averagePower} unit="W" samples={vm.biomechanics.power} color="#1fd18a" currentTime={currentTime} onSeek={seek} />
                <SingleChart title="Cadence (spm)" value={vm.summary.averageCadence} unit="spm" samples={vm.biomechanics.cadence} color="#9b63ff" currentTime={currentTime} onSeek={seek} />
              </div>
            </section>
            <section className="cycles-eval-grid">
              <DetectedCycles strokes={vm.strokes} selected={selectedStroke} onSelect={selectStroke} />
              <PhaseEvaluation stroke={stroke} />
            </section>
            <MuscleAnalysis vm={vm} />
            <section className="crew-movement-grid">
              <CrewAnalysis vm={vm} />
              <div>
                <MovementProfile vm={vm} />
                <MiniCharts vm={vm} currentTime={currentTime} onSeek={seek} />
              </div>
            </section>
            <section className="bottom-analysis-grid">
              <Conclusion vm={vm} />
              <KeyIndicators vm={vm} />
              <TechnicalResults vm={vm} />
            </section>
            <section className="origin-note-grid">
              <DataOrigin vm={vm} />
              <CoachNote vm={vm} />
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default function Page({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = use(params);
  return <ProtectedPage><Detail id={analysisId} /></ProtectedPage>;
}
