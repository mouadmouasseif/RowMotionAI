export type PublicRegistrationRole = "athlete" | "coach" | "club_admin";
export type UserRole =
  | "SUPER_ADMIN"
  | "TECHNICAL_DIRECTOR"
  | "CLUB_ADMIN"
  | "COACH"
  | "ATHLETE"
  | "JURY";
export type FutureUserRole = "FEDERATION_ADMIN" | "MEDICAL_STAFF" | "PHYSICAL_TRAINER";
export type LegacyUserRole =
  | "athlete"
  | "coach"
  | "club_admin"
  | "clubadmin"
  | "club-admin"
  | "super_admin"
  | "superadmin"
  | "super-admin"
  | "technical_director"
  | "technical-director"
  | "directeur_technique"
  | "jury";
export type ProfileDiscipline = "ERGOMETER" | "SKIFF" | "BEACH_ROWING";
export type ProfileCategory = "U15" | "U19" | "U21" | "U23" | "SENIOR";
export type ProfileGender = "male" | "female" | "other" | "not_specified";
export interface ProfilePrivacySettings {
  qrEnabled: boolean;
  qrVisibility: "public" | "authenticated" | "club_only" | "coach_only";
  showAge: boolean;
  showGender: boolean;
  showLicenseNumber: boolean;
  showBestPerformances: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  clubId: string | null;
  coachId: string | null;
  coachIds?: string[];
  licenseNumber: string | null;
  phone: string | null;
  profilePhotoUrl: string | null;
  birthDate: unknown | null;
  trainingStartYear: number | null;
  specialty: string | null;
  category: string | null;
  level: string | null;
  height: number | null;
  weight: number | null;
  legacyAge: number | null;
  gender: ProfileGender;
  disciplines: ProfileDiscipline[];
  primaryDiscipline: ProfileDiscipline | null;
  calculatedCategory: ProfileCategory | null;
  officialCategory: ProfileCategory | null;
  categoryOverrideReason: string | null;
  nationality: string | null;
  dominantSide: "left" | "right" | "ambidextrous" | null;
  qrCodeId: string | null;
  privacySettings: ProfilePrivacySettings;
  sportStatus: "active" | "injured" | "inactive" | "archived";
  createdAt?: unknown;
  updatedAt?: unknown;
  displayName?: string;
  photoURL?: string | null;
  onboardingCompleted?: boolean;
  technicalScope?: {
    type: "CLUB" | "MULTI_CLUB" | "FEDERATION";
    clubIds: string[];
  } | null;
}

export const userRoles: UserRole[] = ["SUPER_ADMIN", "TECHNICAL_DIRECTOR", "CLUB_ADMIN", "COACH", "ATHLETE", "JURY"];
const legacyRoleMap: Record<LegacyUserRole, UserRole> = {
  athlete: "ATHLETE",
  coach: "COACH",
  club_admin: "CLUB_ADMIN",
  clubadmin: "CLUB_ADMIN",
  "club-admin": "CLUB_ADMIN",
  super_admin: "SUPER_ADMIN",
  superadmin: "SUPER_ADMIN",
  "super-admin": "SUPER_ADMIN",
  technical_director: "TECHNICAL_DIRECTOR",
  "technical-director": "TECHNICAL_DIRECTOR",
  directeur_technique: "TECHNICAL_DIRECTOR",
  jury: "JURY",
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function normalizeUserRole(value: unknown): UserRole | null {
  if (isUserRole(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized in legacyRoleMap) return legacyRoleMap[normalized as LegacyUserRole];
  return null;
}

export function getDashboardRouteByRole(role: UserRole | null | undefined): string {
  if (!role) return "/connexion";
  const paths: Record<UserRole, string> = {
    SUPER_ADMIN: "/super-admin/dashboard",
    TECHNICAL_DIRECTOR: "/technical-director/dashboard",
    CLUB_ADMIN: "/club/dashboard",
    COACH: "/coach/dashboard",
    ATHLETE: "/athlete/dashboard",
    JURY: "/jury/dashboard",
  };
  return paths[role] ?? "/connexion";
}

export const getDashboardPath = getDashboardRouteByRole;
