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
    let disposed=false;const timers=new Set<ReturnType<typeof setTimeout>>();
    const delay=(duration:number)=>new Promise<void>((resolve)=>{const timer=setTimeout(()=>{timers.delete(timer);resolve();},duration);timers.add(timer);});
    const unsubscribe=onAuthStateChanged(currentAuth, async (firebaseUser) => {
      if(disposed)return;
      setLoading(true);
      if (!firebaseUser) { setUser(null); setProfile(null); setLoading(false); return; }
      try {
        let snapshot = await getDoc(doc(currentDb, "users", firebaseUser.uid));
        // La création Authentication précède de quelques millisecondes l’écriture du profil.
        for (let attempt = 0; !snapshot.exists() && attempt < 4; attempt += 1) {
          await delay(250);if(disposed)return;
          snapshot = await getDoc(doc(currentDb, "users", firebaseUser.uid));
        }
        if (!snapshot.exists()) throw new Error("Profil absent");
        const loadedProfile = createUserProfile(firebaseUser.uid, firebaseUser.email, snapshot.data());
        if (!loadedProfile.active) throw new Error("Compte désactivé");
        if(!disposed){setUser(firebaseUser);setProfile(loadedProfile);}
      } catch {
        await signOut(currentAuth);
        if(!disposed){setUser(null);setProfile(null);}
      } finally { if(!disposed)setLoading(false); }
    });
    return()=>{disposed=true;unsubscribe();timers.forEach(clearTimeout);timers.clear();};
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
