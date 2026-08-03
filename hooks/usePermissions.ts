import { hasPermission, type Permission } from "@/config/role-permissions";
import { useAuth } from "@/providers/AuthProvider";

export function usePermissions() {
  const { profile } = useAuth();
  return {
    permissions: profile ? [] : [],
    can: (permission: Permission) => hasPermission(profile?.role, permission),
  };
}
