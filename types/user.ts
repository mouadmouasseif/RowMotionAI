export type UserRole = "athlete" | "coach" | "club_admin" | "superadmin";

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  active: boolean;
  clubId?: string | null;
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
