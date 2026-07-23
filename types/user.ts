export type PublicRegistrationRole = "athlete" | "coach" | "club_admin";
export type UserRole = PublicRegistrationRole | "superadmin";
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
}

export const userRoles: UserRole[] = ["athlete", "coach", "club_admin", "superadmin"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    superadmin: "/super-admin/dashboard",
    club_admin: "/club/dashboard",
    coach: "/coach/dashboard",
    athlete: "/athlete/dashboard",
  };
  return paths[role];
}
