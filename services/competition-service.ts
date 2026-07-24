import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Competition, CompetitionResult } from "@/types/competition";
import type { UserProfile } from "@/types/user";

function requireCompetitionManager(profile: UserProfile) {
  if (!auth?.currentUser || !db || !["coach", "club_admin", "superadmin"].includes(profile.role)) throw new Error("Gestion des compétitions non autorisée.");
  return { database: db, user: auth.currentUser };
}

export async function listCompetitions(): Promise<Competition[]> {
  if (!auth?.currentUser || !db) throw new Error("Connexion requise.");
  const snapshot = await getDocs(query(collection(db, "competitions"), orderBy("startDate", "desc")));
  return snapshot.docs.map((row) => ({ id: row.id, ...row.data() } as Competition));
}

export async function createCompetition(profile: UserProfile, value: Omit<Competition, "id" | "createdBy" | "createdAt" | "updatedAt">) {
  const { database, user } = requireCompetitionManager(profile);
  const reference = await addDoc(collection(database, "competitions"), { ...value, clubId: profile.role === "superadmin" ? value.clubId : profile.clubId, createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return reference.id;
}

export async function updateCompetition(profile: UserProfile, id: string, values: Partial<Pick<Competition, "name" | "startDate" | "endDate" | "location" | "disciplines" | "categories" | "status" | "notes">>) {
  const { database } = requireCompetitionManager(profile);
  await updateDoc(doc(database, "competitions", id), { ...values, updatedAt: serverTimestamp() });
}

export async function listCompetitionResults(competitionId?: string) {
  if (!auth?.currentUser || !db) throw new Error("Connexion requise.");
  const base = collection(db, "competitionResults");
  const snapshot = competitionId
    ? await getDocs(query(base, orderBy("points", "desc")))
    : await getDocs(query(base, orderBy("points", "desc")));
  return snapshot.docs
    .map((row) => ({ id: row.id, ...row.data() } as CompetitionResult))
    .filter((row) => !competitionId || row.competitionId === competitionId);
}
