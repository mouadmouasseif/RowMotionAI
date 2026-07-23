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
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
