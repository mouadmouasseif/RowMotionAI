import { describe, expect, it } from "vitest";
import { normalizeAnalysis, resolveAnalysisMetrics } from "@/lib/analysis/normalize-analysis";
import { createAnalysisPdf, createReportsPdf } from "@/lib/report-pdf";
import { emptyAnalysisMetrics, type RowingAnalysis } from "@/types/analysis";

function analysisFixture(overrides: Partial<RowingAnalysis> = {}): RowingAnalysis {
  return {
    id: "analysis-1",
    athleteId: "athlete-1",
    athleteName: "Camille Martin",
    coachId: null,
    clubId: null,
    createdBy: "user-1",
    sourceType: "video",
    environment: "ergometer",
    status: "completed",
    progress: { status: "completed", progress: 100, currentStep: "completed", processedFrames: 80, totalFrames: 80 },
    videoUrl: null,
    storagePath: null,
    videoStorageMode: "none",
    thumbnailUrl: null,
    fileName: "session.mp4",
    durationSeconds: 24,
    technicalScore: 74,
    metrics: { ...emptyAnalysisMetrics, strokeRate: 31.4, symmetryScore: 71.7, rhythmScore: 90 },
    phases: {},
    errors: ["Asymétrie notable entre les jambes."],
    recommendations: ["Travaillez une poussée simultanée et équilibrée."],
    coachComment: null,
    ...overrides,
  };
}

describe("normalisation des angles", () => {
  it("récupère les angles manquants depuis les courbes enregistrées", () => {
    const analysis = analysisFixture({
      timelines: {
        cadence: [],
        movementSpeed: [],
        kneeAngle: [{ time: 0, value: 80 }, { time: 1, value: 100 }],
        hipAngle: [{ time: 0, value: 90 }, { time: 1, value: 110 }],
        backAngle: [{ time: 0, value: 20 }, { time: 1, value: 30 }],
        elbowAngle: [{ time: 0, value: 120 }, { time: 1, value: 140 }],
        shoulderAngle: [{ time: 0, value: 50 }, { time: 1, value: 70 }],
        symmetry: [{ time: 0, value: 70 }, { time: 1, value: 80 }],
      },
    });

    expect(resolveAnalysisMetrics(analysis)).toMatchObject({
      kneeAngle: 90,
      hipAngle: 100,
      backAngle: 25,
      elbowAngle: 130,
      shoulderAngle: 60,
      symmetryScore: 71.7,
    });
  });

  it("accepte les anciens noms et les objets metricValues", () => {
    const legacy = analysisFixture({ metrics: { ...emptyAnalysisMetrics } }) as RowingAnalysis & Record<string, unknown>;
    legacy.biomechanics = { knee_angle: 92, hip_angle: "104,5", elbow_angle: 128 } as unknown as RowingAnalysis["biomechanics"];
    legacy.metricValues = { shoulderAngle: { value: 61, unit: "deg", confidence: 0.9, source: "pose" } };

    const normalized = normalizeAnalysis(legacy);
    expect(normalized.metrics.kneeAngle).toBe(92);
    expect(normalized.metrics.hipAngle).toBe(104.5);
    expect(normalized.metrics.elbowAngle).toBe(128);
    expect(normalized.metrics.shoulderAngle).toBe(61);
  });
});

describe("exports PDF", () => {
  it("génère un vrai fichier PDF pour une analyse", async () => {
    const { doc, filename } = await createAnalysisPdf(analysisFixture());
    const bytes = new Uint8Array(doc.output("arraybuffer"));
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(filename).toMatch(/\.pdf$/);
  }, 10000);

  it("génère le rapport global téléchargeable", async () => {
    const { doc, filename } = await createReportsPdf({ analyses: [analysisFixture()], clubs: 2, competitions: 3, athletes: 8, coaches: 2 });
    const bytes = new Uint8Array(doc.output("arraybuffer"));
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(filename).toMatch(/\.pdf$/);
  });
});
