import { resolveAnalysisMetrics } from "@/lib/analysis/normalize-analysis";
import type { JointAngleRange, MetricSample, RowingAnalysis } from "@/types/analysis";

export const movementVisualPath = "/biomechanics/muscle-overview-cards.png";

export type MuscleVisualKey = "back" | "legs" | "arms" | "core" | "shoulders";

export const muscleVisuals: Record<MuscleVisualKey, { label: string; path: string; color: string; trend: string }> = {
  back: { label: "Dos", path: "/biomechanics/muscle-back.png", color: "#20bff3", trend: "M 0 26 L 18 26 L 35 18 L 52 23 L 69 12 L 86 17 L 100 6" },
  legs: { label: "Jambes", path: "/biomechanics/muscle-legs.png", color: "#2ed99b", trend: "M 0 28 L 16 27 L 34 18 L 51 22 L 68 10 L 84 13 L 100 5" },
  arms: { label: "Bras", path: "/biomechanics/muscle-arms.png", color: "#9a63f4", trend: "M 0 9 L 14 9 L 31 22 L 50 14 L 68 29 L 86 23 L 100 34" },
  core: { label: "Gainage", path: "/biomechanics/muscle-core.png", color: "#ffb21c", trend: "M 0 31 L 16 28 L 32 20 L 48 25 L 64 12 L 82 17 L 100 3" },
  shoulders: { label: "Epaules", path: "/biomechanics/muscle-shoulders.png", color: "#24c8de", trend: "M 0 9 L 15 9 L 33 22 L 50 15 L 67 31 L 85 26 L 100 38" },
};

export const muscleVisualOrder: MuscleVisualKey[] = ["back", "legs", "arms", "core", "shoulders"];

export const jointDisplay = [
  { label: "Genou", key: "knee", timeline: "kneeAngle", metric: "kneeAngle" },
  { label: "Hanche", key: "hip", timeline: "hipAngle", metric: "hipAngle" },
  { label: "Tronc", key: "trunk", timeline: "backAngle", metric: "backAngle" },
  { label: "Coude", key: "elbow", timeline: "elbowAngle", metric: "elbowAngle" },
  { label: "Epaule", key: "shoulder", timeline: "shoulderAngle", metric: "shoulderAngle" },
  { label: "Poignet", key: "wrist", timeline: null, metric: null },
] as const;

type JointKey = typeof jointDisplay[number]["key"];

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function rangeFromSamples(samples: MetricSample[] | undefined): JointAngleRange | null {
  const values = samples?.map((sample) => sample.value).filter((value) => Number.isFinite(value)) ?? [];
  if (!values.length) return null;
  const min = round(Math.min(...values));
  const max = round(Math.max(...values));
  return { min, max, amplitude: round(max - min), measurementSource: "camera", confidence: null };
}

function rangeFromSingleValue(value: number | null | undefined): JointAngleRange | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = round(value);
  return { min: rounded, max: rounded, amplitude: 0, measurementSource: "camera", confidence: null };
}

export function getDisplayJointRanges(analysis: RowingAnalysis): Record<JointKey, JointAngleRange | null> {
  const metrics = resolveAnalysisMetrics(analysis);
  return Object.fromEntries(jointDisplay.map((joint) => {
    const stored = analysis.biomechanics?.jointRanges?.[joint.key];
    if (stored && (stored.min != null || stored.max != null || stored.amplitude != null)) return [joint.key, stored];
    const timeline = joint.timeline ? analysis.timelines?.[joint.timeline] : undefined;
    const fromTimeline = rangeFromSamples(timeline);
    if (fromTimeline) return [joint.key, fromTimeline];
    const metric = joint.metric ? metrics[joint.metric] : null;
    return [joint.key, rangeFromSingleValue(metric)];
  })) as Record<JointKey, JointAngleRange | null>;
}

export function getDisplayMuscleRows(analysis: RowingAnalysis): Array<[string, number | null]> {
  if (analysis.muscleEstimation?.groups && Object.keys(analysis.muscleEstimation.groups).length) {
    return Object.entries(analysis.muscleEstimation.groups);
  }
  if (analysis.muscleUsage) {
    return [
      ["Dos", analysis.muscleUsage.back],
      ["Jambes", analysis.muscleUsage.legs],
      ["Bras", analysis.muscleUsage.arms],
      ["Gainage", analysis.muscleUsage.core],
      ["Epaules", analysis.muscleUsage.shoulders],
    ];
  }
  return [
    ["Dos", null],
    ["Jambes", null],
    ["Bras", null],
    ["Gainage", null],
    ["Epaules", null],
  ];
}

export function muscleVisualKeyForLabel(label: string): MuscleVisualKey {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("jambe") || normalized.includes("leg")) return "legs";
  if (normalized.includes("bras") || normalized.includes("arm")) return "arms";
  if (normalized.includes("gainage") || normalized.includes("core")) return "core";
  if (normalized.includes("epaule") || normalized.includes("shoulder")) return "shoulders";
  return "back";
}

export function getMuscleMeasurementMeta(analysis: RowingAnalysis) {
  if (analysis.muscleEstimation) {
    return {
      source: analysis.muscleEstimation.measurementSource,
      confidence: analysis.muscleEstimation.confidence,
      note: analysis.muscleEstimation.note,
    };
  }
  if (analysis.muscleUsage) {
    return {
      source: "estimated",
      confidence: null,
      note: "Contribution musculaire estimee depuis les amplitudes articulaires, la posture et la regularite. Ce n'est pas une mesure EMG directe.",
    };
  }
  return {
    source: "unavailable",
    confidence: null,
    note: "Aucune estimation musculaire disponible pour cette analyse.",
  };
}
