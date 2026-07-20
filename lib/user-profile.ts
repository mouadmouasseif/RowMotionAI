import type { UserProfile } from "@/types/user";

type TimestampLike = { toDate?: () => Date; seconds?: number };

export function toDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
  if (value && typeof value === "object") { const timestamp = value as TimestampLike; if (typeof timestamp.toDate === "function") return timestamp.toDate(); if (typeof timestamp.seconds === "number") return new Date(timestamp.seconds * 1000); }
  return null;
}

export function calculateAge(birthDate: unknown, now = new Date()): number | null {
  const birth = toDate(birthDate); if (!birth || birth > now) return null;
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export function displayAge(profile: UserProfile) { return calculateAge(profile.birthDate) ?? profile.legacyAge; }
