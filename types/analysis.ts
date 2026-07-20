export type AnalysisEnvironment = "boat" | "ergometer";
export type AnalysisSource = "video" | "live";
export type AnalysisStatus = "draft" | "uploading" | "processing" | "completed" | "failed";
export type VideoStorageMode = "local" | "firebase" | "none";

export interface AnalysisMetrics {
  backAngle: number | null;
  kneeAngle: number | null;
  hipAngle: number | null;
  elbowAngle: number | null;
  shoulderAngle: number | null;
  strokeRate: number | null;
  strokeLength: number | null;
  estimatedPower: number | null;
  symmetryScore: number | null;
  rhythmScore: number | null;
  sequenceScore: number | null;
}

export interface RowingAnalysis {
  id: string;
  athleteId: string;
  athleteName: string;
  coachId: string | null;
  clubId: string | null;
  createdBy: string;
  sourceType: AnalysisSource;
  environment: AnalysisEnvironment;
  status: AnalysisStatus;
  videoUrl: string | null;
  storagePath: string | null;
  videoStorageMode: VideoStorageMode;
  thumbnailUrl: string | null;
  fileName: string | null;
  durationSeconds: number | null;
  technicalScore: number | null;
  metrics: AnalysisMetrics;
  phases: Record<string, unknown>;
  errors: string[];
  recommendations: string[];
  coachComment: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const emptyAnalysisMetrics: AnalysisMetrics = {
  backAngle: null, kneeAngle: null, hipAngle: null, elbowAngle: null,
  shoulderAngle: null, strokeRate: null, strokeLength: null,
  estimatedPower: null, symmetryScore: null, rhythmScore: null, sequenceScore: null,
};
