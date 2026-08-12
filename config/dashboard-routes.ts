import type { UserRole } from "@/types/user";

export function getDashboardRouteByRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard";
    case "FEDERATION_PRESIDENT":
      return "/technical-director/dashboard";
    case "TECHNICAL_DIRECTOR":
      return "/technical-director/dashboard";
    case "CLUB_ADMIN":
      return "/club/dashboard";
    case "COACH":
      return "/coach/dashboard";
    case "ATHLETE":
      return "/athlete/dashboard";
    case "JURY":
      return "/jury/dashboard";
    default:
      return "/connexion";
  }
}
