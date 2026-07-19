"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { createUserProfile } from "@/services/auth-service";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) { setLoading(false); return; }
    const currentAuth = auth;
    const currentDb = db;
    return onAuthStateChanged(currentAuth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) { setUser(null); setProfile(null); setLoading(false); return; }
      try {
        const snapshot = await getDoc(doc(currentDb, "users", firebaseUser.uid));
        if (!snapshot.exists()) throw new Error("Profil absent");
        const loadedProfile = createUserProfile(firebaseUser.uid, firebaseUser.email, snapshot.data());
        if (!loadedProfile.active) throw new Error("Compte désactivé");
        setUser(firebaseUser);
        setProfile(loadedProfile);
      } catch {
        await signOut(currentAuth);
        setUser(null);
        setProfile(null);
      } finally { setLoading(false); }
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, profile, loading,
    logout: async () => { if (auth) await signOut(auth); },
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans AuthProvider.");
  return context;
}
