import {
  emptyAnalysisMetrics,
  type AnalysisMetrics,
  type MetricSample,
  type RowingAnalysis,
} from "@/types/analysis";

type MetricKey = keyof AnalysisMetrics;
type UnknownRecord = Record<string, unknown>;

const aliases: Record<MetricKey, string[]> = {
  backAngle: ["backAngle", "back_angle", "trunkAngle", "trunk_angle", "backInclination", "back_inclination"],
  kneeAngle: ["kneeAngle", "knee_angle", "angleKnee", "angle_genou"],
  hipAngle: ["hipAngle", "hip_angle", "angleHip", "angle_hanche"],
  elbowAngle: ["elbowAngle", "elbow_angle", "angleElbow", "angle_coude"],
  shoulderAngle: ["shoulderAngle", "shoulder_angle", "angleShoulder", "angle_epaule"],
  strokeRate: ["strokeRate", "stroke_rate", "cadence", "cadenceAverage"],
  strokeLength: ["strokeLength", "stroke_length"],
  estimatedPower: ["estimatedPower", "estimated_power", "power", "averagePower"],
  symmetryScore: ["symmetryScore", "symmetry_score", "symmetry", "symetrie"],
  rhythmScore: ["rhythmScore", "rhythm_score", "regularity", "regularityScore"],
  sequenceScore: ["sequenceScore", "sequence_score", "technicalSequence"],
};

const timelineKeys: Partial<Record<MetricKey, keyof NonNullable<RowingAnalysis["timelines"]>>> = {
  backAngle: "backAngle",
  kneeAngle: "kneeAngle",
  hipAngle: "hipAngle",
  elbowAngle: "elbowAngle",
  shoulderAngle: "shoulderAngle",
  symmetryScore: "symmetry",
  strokeRate: "cadence",
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? value as UnknownRecord : null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const record = asRecord(value);
  return record ? finiteNumber(record.value) : null;
}

function averageSamples(value: unknown): number | null {
  if (!Array.isArray(value)) return null;
  const values = value
    .map((sample) => finiteNumber(asRecord(sample)?.value))
    .filter((sample): sample is number => sample !== null);
  if (!values.length) return null;
  return values.reduce((sum, sample) => sum + sample, 0) / values.length;
}

function storedMetric(analysis: RowingAnalysis, key: MetricKey): number | null {
  const raw = analysis as unknown as UnknownRecord;
  const containers = [
    asRecord(raw.metrics),
    asRecord(raw.metricValues),
    asRecord(raw.angles),
    asRecord(raw.biomechanics),
    raw,
  ].filter((container): container is UnknownRecord => container !== null);

  for (const container of containers) {
    for (const alias of aliases[key]) {
      const value = finiteNumber(container[alias]);
      if (value !== null) return value;
    }
  }

  const timelineKey = timelineKeys[key];
  if (!timelineKey) return null;
  return averageSamples(analysis.timelines?.[timelineKey]);
}

export function resolveAnalysisMetrics(analysis: RowingAnalysis): AnalysisMetrics {
  const resolved = { ...emptyAnalysisMetrics, ...(analysis.metrics ?? {}) };
  (Object.keys(emptyAnalysisMetrics) as MetricKey[]).forEach((key) => {
    const current = finiteNumber(resolved[key]);
    resolved[key] = current ?? storedMetric(analysis, key);
  });
  return resolved;
}

export function normalizeAnalysis(analysis: RowingAnalysis): RowingAnalysis {
  return { ...analysis, metrics: resolveAnalysisMetrics(analysis) };
}

export function hasMeasuredAngles(analysis: RowingAnalysis) {
  const metrics = resolveAnalysisMetrics(analysis);
  return [metrics.kneeAngle, metrics.hipAngle, metrics.backAngle, metrics.elbowAngle, metrics.shoulderAngle]
    .some((value) => value !== null);
}

export function timelineAverage(samples: MetricSample[] | undefined) {
  return averageSamples(samples);
}
