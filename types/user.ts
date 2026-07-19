export type PublicRegistrationRole = "athlete" | "coach" | "club_admin";
export type UserRole = PublicRegistrationRole | "superadmin";

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
