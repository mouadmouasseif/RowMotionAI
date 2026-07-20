export type RowingEnvironment = "ERGOMETER" | "FLAT_WATER" | "COASTAL_ROWING" | "BEACH_SPRINT";
export type AnalysisDataSource = "REAL" | "DEMO" | "MANUAL";
export type StrokePhase = "CATCH" | "DRIVE" | "FINISH" | "RECOVERY";
export type TrainingZone = "UT2" | "UT1" | "AT" | "TR" | "AN" | "SPRINT";
export type InjuryRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface Point { x: number; y: number; z?: number }
export interface PoseLandmark extends Point { visibility?: number }
export interface JointAngles {
  back?: number; trunk?: number; leftKnee?: number; rightKnee?: number;
  hip?: number; leftElbow?: number; rightElbow?: number;
  shoulder?: number; leftWrist?: number; rightWrist?: number;
}
export interface FramePoseAnalysis {
  timestamp: number; frameNumber: number; landmarks: PoseLandmark[];
  jointAngles: JointAngles; postureScore: number; symmetryScore: number;
  stabilityScore: number; confidence: number;
}
export interface RowingStroke {
  id: string; startTime: number; endTime: number; duration: number;
  catchTime: number; driveTime: number; finishTime: number; recoveryTime: number;
  driveRecoveryRatio: number; strokeRate: number; technicalScore: number;
}
export interface PhysiologicalSample {
  timestamp: number; heartRate?: number; power?: number; strokeRate?: number;
  speed?: number; pace500m?: number; lactate?: number; oxygenSaturation?: number;
}
export interface BeachSprintPhase {
  id: string;
  type: "REACTION" | "BEACH_RUN_START" | "WATER_ENTRY" | "BOAT_ENTRY" |
    "FIRST_STROKES" | "ACCELERATION" | "OUTBOUND_ROW" | "BUOY_TURN" |
    "RETURN_ROW" | "BOAT_EXIT" | "FINAL_RUN" | "FINISH";
  startTime: number; endTime: number; duration: number; score: number;
  observations: string[]; recommendations: string[];
}
export interface InjuryRiskItem {
  bodyArea: "NECK" | "SHOULDER" | "ELBOW" | "WRIST" | "BACK" |
    "LOWER_BACK" | "HIP" | "KNEE" | "ANKLE";
  score: number; level: InjuryRiskLevel; factors: string[];
  recommendations: string[]; confidence: number;
}
export interface TrainingZoneConfig {
  zone: TrainingZone; minHeartRatePercent?: number; maxHeartRatePercent?: number;
  minPowerPercent?: number; maxPowerPercent?: number; minLactate?: number;
  maxLactate?: number; description: string;
}
export interface SynchronizedAnalysisState {
  currentTime: number; currentFrame: number; selectedMetric: string | null;
  selectedEvent: string | null; isPlaying: boolean;
}
export interface AITrainingFeedback {
  summary: string; strengths: string[]; weaknesses: string[];
  injuryPrevention: string[]; technicalCorrections: string[];
  nextSessionObjectives: string[]; confidence: number;
}

