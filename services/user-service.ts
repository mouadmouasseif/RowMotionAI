import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore/lite";
import { auth, db } from "@/lib/firebase";
import { createUserProfile } from "@/services/auth-service";
import type { UserProfile } from "@/types/user";

export async function listAthletes(profile: UserProfile): Promise<UserProfile[]> {
  if (!auth?.currentUser || !db) throw new Error("Session Firebase indisponible.");
  if (profile.role === "athlete") return [profile];
  const users = collection(db, "users");
  const constraints = profile.role === "superadmin" ? [where("role", "==", "athlete")]
    : profile.role === "club_admin" && profile.clubId ? [where("role", "==", "athlete"), where("clubId", "==", profile.clubId)]
    : [where("role", "==", "athlete"), where("coachId", "==", profile.uid)];
  const snapshot = await getDocs(query(users, ...constraints));
  return snapshot.docs.map((item) => createUserProfile(item.id, typeof item.data().email === "string" ? item.data().email : null, item.data()));
}

export async function updateOwnProfile(uid: string, values: Pick<UserProfile, "firstName" | "lastName" | "phone"> & { height?: number | null; weight?: number | null; birthDate?: unknown | null; category?: string | null; level?: string | null; specialty?: string | null }) {
  if (!auth?.currentUser || auth.currentUser.uid !== uid || !db) throw new Error("Modification non autorisée.");
  await updateDoc(doc(db, "users", uid), { ...values, updatedAt: serverTimestamp() });
}

export async function listCoaches(profile: UserProfile): Promise<UserProfile[]> {
  if (!auth?.currentUser || !db || !["superadmin", "club_admin"].includes(profile.role) || !profile.active) throw new Error("Accès réservé à l’administration.");
  const constraints = [where("role", "==", "coach")];
  if (profile.role === "club_admin") { if (!profile.clubId) return []; constraints.push(where("clubId", "==", profile.clubId)); }
  const snapshot = await getDocs(query(collection(db, "users"), ...constraints));
  return snapshot.docs.map((item) => createUserProfile(item.id, typeof item.data().email === "string" ? item.data().email : null, item.data()));
}

export async function setCoachActive(profile: UserProfile, coachUid: string, active: boolean) {
  if (!auth?.currentUser || !db || !["superadmin", "club_admin"].includes(profile.role) || !profile.active) throw new Error("Accès réservé à l’administration.");
  if (profile.role === "club_admin") { const snapshot = await getDoc(doc(db, "users", coachUid)); if (!snapshot.exists() || snapshot.data().clubId !== profile.clubId || snapshot.data().role !== "coach") throw new Error("Ce coach ne fait pas partie de votre club."); }
  await updateDoc(doc(db, "users", coachUid), { active, validatedBy: profile.uid, validatedAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function getAssociatedCoach(profile: UserProfile): Promise<UserProfile | null> {
  if (!auth?.currentUser || !db || !profile.coachId) return null;
  const snapshot = await getDoc(doc(db, "users", profile.coachId));
  if (!snapshot.exists()) return null;
  const coach = createUserProfile(snapshot.id, typeof snapshot.data().email === "string" ? snapshot.data().email : null, snapshot.data());
  return coach.role === "coach" ? coach : null;
}
