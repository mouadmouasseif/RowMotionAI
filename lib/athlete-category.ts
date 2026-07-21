import type { AthleteCategory } from "@/types/athlete";
export function getAthleteCategory(dateOfBirth: Date, seasonYear: number): AthleteCategory {
  if (Number.isNaN(dateOfBirth.getTime()) || !Number.isInteger(seasonYear)) throw new Error("Date de naissance ou saison invalide.");
  const age = seasonYear - dateOfBirth.getUTCFullYear();
  if (age < 15) return "U15"; if (age < 19) return "U19"; if (age < 21) return "U21"; if (age < 23) return "U23"; return "SENIOR";
}
