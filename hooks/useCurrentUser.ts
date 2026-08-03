import { useAuth } from "@/providers/AuthProvider";

export function useCurrentUser() {
  return useAuth().profile;
}
