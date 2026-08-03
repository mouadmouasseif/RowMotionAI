export type AnalysisEnvironment = "boat" | "double_scull" | "ergometer" | "beach_sprint";
export type AnalysisSource = "video" | "live";
export type AnalysisTrainingType = "technique" | "endurance" | "power" | "interval" | "recovery" | "competition";
export type AnalysisScope = "general" | "complete";
export type AnalysisStatus = "draft" | "uploading" | "uploaded" | "queued" | "processing" | "completed" | "failed" | "cancelled";
export type AnalysisStep = "validation" | "upload" | "video_preprocessing" | "pose_detection" | "stroke_detection" | "metrics_calculation" | "recommendations" | "saving_results" | "completed";
export type VideoStorageMode = "local" | "firebase" | "none";
export type MeasurementSource = "camera" | "ergometer" | "sensor" | "manual" | "estimated" | "unavailable";
export type AnalysisDistanceType = "free_technique" | "250m" | "500m" | "750m" | "1000m" | "1500m" | "2000m" | "5000m" | "6000m" | "custom" | "ergometer_test" | "training" | "competition";

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
export interface MeasurementMeta { measurementSource: MeasurementSource; confidence: number }
export interface MetricValue { value: number | null; unit: MetricUnit; confidence: number; source: "pose" | "manual" | "sensor" | "estimated"; measurementSource?: MeasurementSource }
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
export interface CadenceSample { time: number; value: number }
export interface MetricSample { time: number; value: number }
export interface AnalysisTimelines {
  cadence: MetricSample[];
  movementSpeed: MetricSample[];
  kneeAngle: MetricSample[];
  hipAngle: MetricSample[];
  backAngle: MetricSample[];
  elbowAngle?: MetricSample[];
  shoulderAngle?: MetricSample[];
  symmetry: MetricSample[];
}
export interface MuscleUsage {
  back: number;
  legs: number;
  arms: number;
  core: number;
  shoulders: number;
}
export interface AnalysisSplit extends MeasurementMeta {
  startDistance: number;
  endDistance: number;
  duration: number | null;
  pace: number | null;
  speed: number | null;
  strokeRate: number | null;
  strokeCount: number | null;
  strokeLength: number | null;
  power: number | null;
  heartRate?: number | null;
  averageStrokeTime?: number | null;
  propulsion?: number | null;
  recovery?: number | null;
  driveRecoveryRatio?: number | null;
  technicalQuality?: string | null;
  techniqueScore: number | null;
  efficiencyScore: number | null;
}
export type RacePhaseName = "START" | "ACCELERATION" | "CRUISE" | "TRANSITION" | "TURN" | "RE-ACCELERATION" | "ATTACK" | "FINISH" | "RECOVERY";
export interface RacePhaseAnalysis extends MeasurementMeta {
  name: RacePhaseName;
  duration: number | null;
  distance: number | null;
  speed: number | null;
  strokeRate: number | null;
  power: number | null;
  acceleration: number | null;
  strokeCount: number | null;
  efficiency: number | null;
  strokeLength: number | null;
  technicalQuality: string | null;
  estimatedFatigue: number | null;
}
export interface DetailedStroke extends MeasurementMeta {
  index: number;
  timestampStart: number | null;
  timestampEnd: number | null;
  duration: number | null;
  strokeRate: number | null;
  power: number | null;
  speed: number | null;
  acceleration: number | null;
  strokeLength?: number | null;
  handSpeed?: number | null;
  seatSpeed?: number | null;
  legTrunkArmSynchronization?: number | null;
  angles?: {
    kneeMin?: number | null; kneeMax?: number | null;
    hipMin?: number | null; hipMax?: number | null;
    trunkMin?: number | null; trunkMax?: number | null;
    elbowMin?: number | null; elbowMax?: number | null;
    shoulderMin?: number | null; shoulderMax?: number | null;
    wristMin?: number | null; wristMax?: number | null;
  };
  phases?: Partial<Record<"catch" | "legDrive" | "bodySwing" | "armPull" | "finish" | "recovery", number | null>>;
}
export interface StartAnalysis extends MeasurementMeta {
  strokes: DetailedStroke[];
  scores: { explosivity: number | null; synchronization: number | null; cadence: number | null; power: number | null; technique: number | null; overall: number | null };
}
export interface FinishAnalysis extends MeasurementMeta {
  last500m?: Record<string, number | null>;
  last250m?: Record<string, number | null>;
  last100m?: Record<string, number | null>;
  last10Strokes?: DetailedStroke[];
  score: number | null;
}
export interface TurnAnalysis extends MeasurementMeta {
  entrySpeed: number | null; minimumSpeed: number | null; duration: number | null; angle: number | null;
  exitSpeed: number | null; accelerationTime: number | null; strokeRateBefore: number | null; strokeRateAfter: number | null;
  powerBefore: number | null; powerAfter: number | null; efficiencyScore: number | null;
}
export interface JointAngleRange extends MeasurementMeta { min: number | null; max: number | null; amplitude: number | null }
export interface PowerByJointAngle extends MeasurementMeta { joint: string; points: { angle: number; power: number | null }[]; peakPowerAngle: number | null; peakPower: number | null }
export interface MuscleEstimation extends MeasurementMeta { groups: Record<string, number | null>; note: string }
export interface PowerCurve extends MeasurementMeta { peakPower: number | null; averagePower: number | null; powerDuration: number | null; timeToPeakPower: number | null; points: { strokePercent: number; power: number | null }[] }
export interface ForcePowerVelocityAnalysis extends MeasurementMeta { force: number | null; power: number | null; velocity: number | null; acceleration: number | null }
export interface SymmetryAnalysis extends MeasurementMeta { left: number | null; right: number | null; score: number | null }
export interface FatigueAnalysis extends MeasurementMeta { powerLoss: number | null; strokeLengthLoss: number | null; cadenceVariation: number | null; angleModification: number | null; timingModification: number | null; synchronizationLoss: number | null; techniqueLoss: number | null; index: number | null }
export interface AnalysisScores { technique?: number | null; power?: number | null; efficiency?: number | null; symmetry?: number | null; start?: number | null; finish?: number | null; fatigue?: number | null }
export interface CrewRowerResult {
  position: 1 | 2;
  detectedFrames: number;
  confidence: number;
  technicalScore: number | null;
  metrics: Pick<AnalysisMetrics, "backAngle" | "kneeAngle" | "hipAngle" | "strokeRate" | "symmetryScore">;
}
export interface CrewAnalysisResult {
  rowers: CrewRowerResult[];
  synchronizationScore: number | null;
  timingOffsetSeconds: number | null;
  simultaneousDriveScore: number | null;
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
  cadenceTimeline?: CadenceSample[];
  timelines?: AnalysisTimelines;
  muscleUsage?: MuscleUsage;
  crewAnalysis?: CrewAnalysisResult;
  errors: string[]; recommendations: string[]; coachComment: string | null;
  trainingType?: AnalysisTrainingType;
  analysisType?: AnalysisDistanceType;
  distance?: number | null;
  rowingType?: AnalysisEnvironment;
  splits?: AnalysisSplit[];
  racePhases?: RacePhaseAnalysis[];
  strokes?: DetailedStroke[];
  biomechanics?: { jointRanges?: Record<string, JointAngleRange>; powerByJointAngle?: PowerByJointAngle[]; powerCurve?: PowerCurve; forcePowerVelocity?: ForcePowerVelocityAnalysis };
  powerMetrics?: Record<string, MetricValue>;
  muscleEstimation?: MuscleEstimation;
  startAnalysis?: StartAnalysis;
  finishAnalysis?: FinishAnalysis;
  turns?: TurnAnalysis[];
  fatigue?: FatigueAnalysis;
  scores?: AnalysisScores;
  analysisScope?: AnalysisScope;
  isLegacy?: boolean; metricsSource?: "biomechanics_engine" | "legacy_simulation";
  createdAt?: unknown; updatedAt?: unknown;
}
export const emptyAnalysisMetrics: AnalysisMetrics = { backAngle:null,kneeAngle:null,hipAngle:null,elbowAngle:null,shoulderAngle:null,strokeRate:null,strokeLength:null,estimatedPower:null,symmetryScore:null,rhythmScore:null,sequenceScore:null };
export const initialAnalysisProgress: AnalysisProgress = { status:"draft",progress:0,currentStep:"validation",processedFrames:0,totalFrames:0 };
