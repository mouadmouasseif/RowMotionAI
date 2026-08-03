export type TrainingSessionCategory =
  | "endurance_fondamentale"
  | "endurance_intensive"
  | "seuil"
  | "vo2_max"
  | "sprint"
  | "force"
  | "puissance"
  | "technique"
  | "ergometre"
  | "depart"
  | "finish"
  | "relance"
  | "virage_tour"
  | "simulation_course"
  | "recuperation"
  | "ppg"
  | "rmg"
  | "mobilite"
  | "preparation_mentale";

export interface TrainingSessionDefinition {
  id: string;
  category: TrainingSessionCategory;
  name: string;
  objective: string;
  durationMinutes: number | null;
  distanceMeters: number | null;
  intensity: string | null;
  targetCadence: string | null;
  targetHeartRate: string | null;
  energyZone: string | null;
  recovery: string | null;
  seriesCount: number | null;
  repetitions: number | null;
  coachComments: string | null;
}

export interface TrainingEvaluation {
  trimester: 1 | 2 | 3;
  evaluationTest: string | null;
  medicalVisitCompleted: boolean;
  progressReportUrl?: string | null;
  previousTrimesterComparison?: string | null;
  createdAt?: unknown;
}

export interface TrainingPlan {
  id: string;
  name: string;
  athleteId: string;
  coachId: string;
  durationWeeks: number;
  trimester: 1 | 2 | 3;
  targetKm: number;
  completedKm: number;
  rmgHours: number;
  ppgHours: number;
  ergHours: number;
  mentalPreparationHours: number;
  sessions: TrainingSessionDefinition[];
  evaluations: TrainingEvaluation[];
  createdAt?: unknown;
  updatedAt?: unknown;
}
