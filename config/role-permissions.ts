import type { UserRole } from "@/types/user";

export type Permission =
  | "*"
  | "analysis:create:self"
  | "analysis:view:self"
  | "training:view:self"
  | "profile:edit:self"
  | "competition:view:self"
  | "athlete:view:assigned"
  | "athlete:update:assigned"
  | "analysis:view:assigned"
  | "analysis:create:assigned"
  | "training:create:assigned"
  | "report:create:assigned"
  | "athlete:view:scope"
  | "coach:view:scope"
  | "analysis:view:scope"
  | "training:create:scope"
  | "training:approve:scope"
  | "technical-report:create:scope"
  | "competition:view:scope"
  | "selection:manage:scope"
  | "club:manage:self"
  | "coach:manage:club"
  | "athlete:manage:club"
  | "competition:manage:club"
  | "jury:manage:club"
  | "report:view:club"
  | "competition:view:assigned"
  | "race:view:assigned"
  | "penalty:create:assigned"
  | "penalty:update:assigned"
  | "result:validate:assigned";

export const permissionsByRole: Record<UserRole, Permission[]> = {
  ATHLETE: ["analysis:create:self", "analysis:view:self", "training:view:self", "profile:edit:self", "competition:view:self"],
  COACH: ["athlete:view:assigned", "athlete:update:assigned", "analysis:view:assigned", "analysis:create:assigned", "training:create:assigned", "report:create:assigned"],
  TECHNICAL_DIRECTOR: ["athlete:view:scope", "coach:view:scope", "analysis:view:scope", "training:create:scope", "training:approve:scope", "technical-report:create:scope", "competition:view:scope", "selection:manage:scope"],
  CLUB_ADMIN: ["club:manage:self", "coach:manage:club", "athlete:manage:club", "competition:manage:club", "jury:manage:club", "report:view:club"],
  SUPER_ADMIN: ["*"],
  JURY: ["competition:view:assigned", "race:view:assigned", "penalty:create:assigned", "penalty:update:assigned", "result:validate:assigned"],
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = permissionsByRole[role];
  return permissions.includes("*") || permissions.includes(permission);
}
