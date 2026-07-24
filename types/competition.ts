import type { ProfileCategory, ProfileDiscipline } from "@/types/user";

export interface Competition {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  disciplines: ProfileDiscipline[];
  categories: ProfileCategory[];
  status: "planned" | "open" | "completed" | "cancelled";
  clubId: string | null;
  notes: string | null;
  type?: "championship" | "international_regatta" | "cup" | "national_regatta" | "other";
  organizer?: string | null;
  country?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  gender?: "all" | "male" | "female" | "mixed";
  level?: "international" | "national" | "regional" | "local";
  eventCount?: number;
  registrationDeadline?: string | null;
  onlineRegistration?: boolean;
  published?: boolean;
  contact?: string | null;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CompetitionResult {
  id: string;
  competitionId: string;
  athleteId: string;
  athleteName: string;
  clubId: string | null;
  category: ProfileCategory;
  discipline: ProfileDiscipline;
  rank: number;
  points: number;
  gold: number;
  silver: number;
  bronze: number;
}
