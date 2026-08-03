import { resolveAnalysisMetrics } from "@/lib/analysis/normalize-analysis";
import type { JointAngleRange, MetricSample, RowingAnalysis } from "@/types/analysis";

export const movementVisualPath = "/biomechanics/muscle-movement-overview.png";

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
