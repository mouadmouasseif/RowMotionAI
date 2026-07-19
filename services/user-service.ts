import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore/lite";
import { auth, db } from "@/lib/firebase";
import { createUserProfile } from "@/services/auth-service";
import type { UserProfile } from "@/types/user";

export async function listAthletes(profile: UserProfile): Promise<UserProfile[]> {
  if (!auth?.currentUser || !db) throw new Error("Session Firebase indisponible.");
  const users = collection(db, "users");
  const constraints = profile.role === "superadmin" ? [where("role", "==", "athlete")]
    : profile.role === "club_admin" && profile.clubId ? [where("role", "==", "athlete"), where("clubId", "==", profile.clubId)]
    : profile.role === "coach" ? [where("role", "==", "athlete"), where("coachId", "==", profile.uid)] : [where("uid", "==", profile.uid)];
  const snapshot = await getDocs(query(users, ...constraints));
  return snapshot.docs.map((item) => createUserProfile(item.id, typeof item.data().email === "string" ? item.data().email : null, item.data()));
}

export async function updateOwnProfile(uid: string, values: Pick<UserProfile, "firstName" | "lastName" | "phone"> & { height?: number | null; weight?: number | null }) {
  if (!auth?.currentUser || auth.currentUser.uid !== uid || !db) throw new Error("Modification non autorisée.");
  await updateDoc(doc(db, "users", uid), { ...values, updatedAt: serverTimestamp() });
}
