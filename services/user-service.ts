import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getAthleteCategory } from "@/lib/athlete-category";
import { createUserProfile } from "@/services/auth-service";
import type { AthleteBestPerformance } from "@/types/athlete";
import type { ProfileDiscipline, ProfileGender, ProfilePrivacySettings, UserProfile } from "@/types/user";

export interface EditableOwnProfile {
  firstName: string;
  lastName: string;
  phone: string | null;
  birthDate?: string | null;
  trainingStartYear?: number | null;
  height?: number | null;
  weight?: number | null;
  level?: string | null;
  specialty?: string | null;
  gender?: ProfileGender;
  disciplines?: ProfileDiscipline[];
  primaryDiscipline?: ProfileDiscipline | null;
  nationality?: string | null;
  dominantSide?: "left" | "right" | "ambidextrous" | null;
  privacySettings?: ProfilePrivacySettings;
  sportStatus?: UserProfile["sportStatus"];
}

export interface QrProfile {
  athleteId: string; role: UserProfile["role"]; firstName: string; lastName: string; profilePhotoUrl: string | null;
  birthDate: unknown | null; gender: UserProfile["gender"]; category: string | null; disciplines: ProfileDiscipline[];
  clubId: string | null; coachId: string | null; licenseNumber: string | null; sportStatus: UserProfile["sportStatus"];
  privacySettings: ProfilePrivacySettings;
}

function qrProjection(profile: UserProfile): QrProfile {
  return { athleteId: profile.uid, role: profile.role, firstName: profile.firstName, lastName: profile.lastName, profilePhotoUrl: profile.profilePhotoUrl, birthDate: profile.birthDate, gender: profile.gender, category: profile.officialCategory ?? profile.calculatedCategory ?? profile.category, disciplines: profile.disciplines, clubId: profile.clubId, coachId: profile.coachId, licenseNumber: profile.licenseNumber, sportStatus: profile.sportStatus, privacySettings: profile.privacySettings };
}

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

export async function updateOwnProfile(uid: string, values: EditableOwnProfile) {
  if (!auth?.currentUser || auth.currentUser.uid !== uid || !db) throw new Error("Modification non autorisée.");
  if (values.disciplines && values.primaryDiscipline && !values.disciplines.includes(values.primaryDiscipline)) throw new Error("La discipline principale doit faire partie des disciplines sélectionnées.");
  const calculatedCategory = values.birthDate ? getAthleteCategory(new Date(values.birthDate), new Date().getUTCFullYear()) : null;
  await updateDoc(doc(db, "users", uid), { ...values, ...(calculatedCategory ? { calculatedCategory, category: calculatedCategory } : {}), updatedAt: serverTimestamp() });
  const refreshed = await getDoc(doc(db, "users", uid));
  if (refreshed.exists()) { const profile = createUserProfile(uid, auth.currentUser.email, refreshed.data()); if (profile.qrCodeId) await setDoc(doc(db, "qrProfiles", profile.qrCodeId), { ...qrProjection(profile), updatedAt: serverTimestamp() }); }
}

export async function ensureProfileQrCode(uid: string) {
  if (!auth?.currentUser || auth.currentUser.uid !== uid || !db) throw new Error("Modification non autorisée.");
  const current = await getDoc(doc(db, "users", uid));
  if (!current.exists()) throw new Error("Profil introuvable.");
  const previousCode = typeof current.data().qrCodeId === "string" ? current.data().qrCodeId : null;
  const qrCodeId = crypto.randomUUID();
  await updateDoc(doc(db, "users", uid), { qrCodeId, updatedAt: serverTimestamp() });
  const profile = createUserProfile(uid, auth.currentUser.email, { ...current.data(), qrCodeId });
  await setDoc(doc(db, "qrProfiles", qrCodeId), { ...qrProjection(profile), updatedAt: serverTimestamp() });
  if (previousCode) await deleteDoc(doc(db, "qrProfiles", previousCode));
  return qrCodeId;
}

export async function getProfileByQrCode(qrCodeId: string): Promise<QrProfile | null> {
  if (!db) throw new Error("Firebase indisponible.");
  const snapshot = await getDoc(doc(db, "qrProfiles", qrCodeId));
  return snapshot.exists() ? snapshot.data() as QrProfile : null;
}

export async function logQrScan(qrCodeId: string, athleteId: string) {
  if (!db || !auth?.currentUser) return;
  const deviceType = /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? "mobile" : "desktop";
  await addDoc(collection(db, "athleteQrScans"), { qrCodeId, athleteId, authenticatedUserId: auth.currentUser.uid, deviceType, allowed: true, scannedAt: serverTimestamp() });
}

export async function listPersonalBests(uid: string): Promise<AthleteBestPerformance[]> {
  if (!db) throw new Error("Firebase indisponible.");
  const snapshot = await getDocs(query(collection(db, "users", uid, "personalBests"), orderBy("achievedAt", "desc")));
  return snapshot.docs.map((row) => ({ id: row.id, ...row.data() } as AthleteBestPerformance));
}

export async function addPersonalBest(uid: string, value: Omit<AthleteBestPerformance, "id" | "verified" | "verifiedBy">) {
  if (!auth?.currentUser || !db) throw new Error("Session Firebase indisponible.");
  await addDoc(collection(db, "users", uid, "personalBests"), { ...value, verified: false, createdBy: auth.currentUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function removePersonalBest(uid: string, performanceId: string) {
  if (!auth?.currentUser || !db) throw new Error("Session Firebase indisponible.");
  await deleteDoc(doc(db, "users", uid, "personalBests", performanceId));
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

export async function updateManagedAthleteProfile(manager: UserProfile, athleteUid: string, values: { officialCategory?: string | null; categoryOverrideReason?: string | null; disciplines?: ProfileDiscipline[]; primaryDiscipline?: ProfileDiscipline | null; sportStatus?: UserProfile["sportStatus"] }) {
  if (!auth?.currentUser || !db || !["coach", "club_admin", "superadmin"].includes(manager.role)) throw new Error("Modification réservée aux responsables autorisés.");
  const snapshot = await getDoc(doc(db, "users", athleteUid));
  if (!snapshot.exists() || snapshot.data().role !== "athlete") throw new Error("Athlète introuvable.");
  const current = createUserProfile(snapshot.id, typeof snapshot.data().email === "string" ? snapshot.data().email : null, snapshot.data());
  const allowed = manager.role === "superadmin" || (manager.role === "club_admin" && Boolean(manager.clubId && manager.clubId === current.clubId)) || (manager.role === "coach" && current.coachId === manager.uid);
  if (!allowed) throw new Error("Vous n’êtes pas autorisé à modifier cet athlète.");
  if (values.disciplines && values.primaryDiscipline && !values.disciplines.includes(values.primaryDiscipline)) throw new Error("Discipline principale invalide.");
  await updateDoc(doc(db, "users", athleteUid), { ...values, categoryOverrideBy: manager.uid, updatedAt: serverTimestamp() });
}

export async function getAssociatedCoach(profile: UserProfile): Promise<UserProfile | null> {
  if (!auth?.currentUser || !db || !profile.coachId) return null;
  const snapshot = await getDoc(doc(db, "users", profile.coachId));
  if (!snapshot.exists()) return null;
  const coach = createUserProfile(snapshot.id, typeof snapshot.data().email === "string" ? snapshot.data().email : null, snapshot.data());
  return coach.role === "coach" ? coach : null;
}
