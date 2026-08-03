import { useAuth } from "@/providers/AuthProvider";

export function useRole() {
  return useAuth().profile?.role ?? null;
}
