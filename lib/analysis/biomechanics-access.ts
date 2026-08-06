import type { UserRole } from "@/types/user";

export const publicJointKeys = ["knee", "hip"] as const;
export const sensitiveJointKeys = ["trunk", "elbow", "shoulder", "wrist"] as const;
export type DisplayJointKey = (typeof publicJointKeys)[number] | (typeof sensitiveJointKeys)[number];

const restrictedRoles: UserRole[] = ["CLUB_ADMIN", "TECHNICAL_DIRECTOR", "JURY"];

export function canViewSensitiveBiomechanics(role: UserRole | null | undefined) {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;
  return !restrictedRoles.includes(role);
}

export function canViewJointKey(role: UserRole | null | undefined, key: string) {
  return publicJointKeys.includes(key as (typeof publicJointKeys)[number]) || canViewSensitiveBiomechanics(role);
}

export function restrictedBiomechanicsNotice(role: UserRole | null | undefined) {
  if (canViewSensitiveBiomechanics(role)) return null;
  return "Vue limitee : les angles sensibles sont reserves au super-admin, au coach responsable et a l'athlete concerne.";
}
