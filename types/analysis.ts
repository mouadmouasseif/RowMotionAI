export type AnalysisEnvironment = "boat" | "ergometer" | "beach_sprint";
export type AnalysisSource = "video" | "live";
export type AnalysisStatus = "draft" | "uploading" | "uploaded" | "queued" | "processing" | "completed" | "failed" | "cancelled";
export type AnalysisStep = "validation" | "upload" | "video_preprocessing" | "pose_detection" | "stroke_detection" | "metrics_calculation" | "recommendations" | "saving_results" | "completed";
export type VideoStorageMode = "local" | "firebase" | "none";

export interface AnalysisProgress {
  status: AnalysisStatus;
  progress: number;
  currentStep: AnalysisStep;
  processedFrames: number;
  totalFrames: number;
  startedAt?: unknown;
  completedAt?: unknown;
  errorCode?: string;
  errorMessage?: string;
}

export type MetricUnit = "deg" | "percent" | "spm" | "watt" | "m" | "m/s" | "s";
export interface MetricValue { value: number | null; unit: MetricUnit; confidence: number; source: "pose" | "manual" | "sensor" | "estimated" }
export interface AnalysisMetrics {
  backAngle: number | null; kneeAngle: number | null; hipAngle: number | null;
  elbowAngle: number | null; shoulderAngle: number | null; strokeRate: number | null;
  strokeLength: number | null; estimatedPower: number | null; symmetryScore: number | null;
  rhythmScore: number | null; sequenceScore: number | null;
}
export interface StrokePhase { name: string; startTime: number; endTime: number; confidence: number }
export interface TechniqueError { code: string; message: string; severity: "low" | "moderate" | "high"; confidence: number }
export interface CycleMetrics { regularity: number | null; sequenceScore: number | null; symmetry: number | null; technicalScore: number | null }
export interface StrokeCycle {
  index: number; startTime: number; endTime: number; duration: number; driveTime: number;
  recoveryTime: number; driveRecoveryRatio: number; strokeRate: number; phases: StrokePhase[];
  metrics: CycleMetrics; errors: TechniqueError[]; confidence: number;
}
export interface AnalysisJob {
  id: string; analysisId: string; status: "queued" | "processing" | "completed" | "failed" | "dead_letter";
  attempts: number; maxAttempts: number; lockedBy?: string; lockedAt?: unknown; heartbeatAt?: unknown;
  nextRetryAt?: unknown; createdAt?: unknown; updatedAt?: unknown;
}
export interface RowingAnalysis {
  id: string; athleteId: string; athleteName: string; coachId: string | null; clubId: string | null;
  createdBy: string; sourceType: AnalysisSource; environment: AnalysisEnvironment; status: AnalysisStatus;
  progress: AnalysisProgress; videoUrl: string | null; storagePath: string | null;
  videoStorageMode: VideoStorageMode; thumbnailUrl: string | null; fileName: string | null;
  durationSeconds: number | null; technicalScore: number | null; metrics: AnalysisMetrics;
  metricValues?: Record<string, MetricValue>; phases: Record<string, unknown>; cycles?: StrokeCycle[];
  errors: string[]; recommendations: string[]; coachComment: string | null;
  isLegacy?: boolean; metricsSource?: "biomechanics_engine" | "legacy_simulation";
  createdAt?: unknown; updatedAt?: unknown;
}
export const emptyAnalysisMetrics: AnalysisMetrics = { backAngle:null,kneeAngle:null,hipAngle:null,elbowAngle:null,shoulderAngle:null,strokeRate:null,strokeLength:null,estimatedPower:null,symmetryScore:null,rhythmScore:null,sequenceScore:null };
export const initialAnalysisProgress: AnalysisProgress = { status:"draft",progress:0,currentStep:"validation",processedFrames:0,totalFrames:0 };
