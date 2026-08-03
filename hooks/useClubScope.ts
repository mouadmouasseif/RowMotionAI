import { useAuth } from "@/providers/AuthProvider";

export function useClubScope() {
  const { profile } = useAuth();
  return {
    clubId: profile?.clubId ?? null,
    clubIds: profile?.technicalScope?.clubIds ?? (profile?.clubId ? [profile.clubId] : []),
    scopeType: profile?.technicalScope?.type ?? null,
  };
}
