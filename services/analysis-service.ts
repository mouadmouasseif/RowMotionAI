import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { emptyAnalysisMetrics, initialAnalysisProgress, type AnalysisEnvironment, type AnalysisSource, type RowingAnalysis } from "@/types/analysis";
import type { UserProfile } from "@/types/user";

function requireFirebase() {
  if (!auth?.currentUser || !db) throw new Error("Vous devez être connecté pour effectuer cette action.");
  return { user: auth.currentUser, database: db };
}

export function canAccessAnalysis(profile: UserProfile, analysis: RowingAnalysis) {
  if (profile.role === "superadmin") return true;
  if (profile.role === "club_admin") return Boolean(profile.clubId && profile.clubId === analysis.clubId);
  if (profile.role === "coach") return profile.uid === analysis.coachId || profile.uid === analysis.createdBy;
  return profile.uid === analysis.athleteId;
}

export async function listAnalyses(profile: UserProfile, max = 100): Promise<RowingAnalysis[]> {
  const { database } = requireFirebase();
  const base = collection(database, "analyses");
  const constraints = profile.role === "superadmin" ? [orderBy("createdAt", "desc"), limit(max)]
    : profile.role === "club_admin" && profile.clubId ? [where("clubId", "==", profile.clubId), limit(max)]
    : profile.role === "coach" ? [where("coachId", "==", profile.uid), limit(max)]
    : [where("athleteId", "==", profile.uid), limit(max)];
  const snapshot = await getDocs(query(base, ...constraints));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as RowingAnalysis));
}

export async function getAnalysis(id: string, profile: UserProfile): Promise<RowingAnalysis> {
  const { database } = requireFirebase();
  const snapshot = await getDoc(doc(database, "analyses", id));
  if (!snapshot.exists()) throw new Error("Analyse introuvable.");
  const analysis = { id: snapshot.id, ...snapshot.data() } as RowingAnalysis;
  if (!canAccessAnalysis(profile, analysis)) throw new Error("Vous n’êtes pas autorisé à accéder à cette analyse.");
  return analysis;
}

export async function createAnalysis(input: { athleteId: string; athleteName: string; environment: AnalysisEnvironment; sourceType: AnalysisSource; profile: UserProfile; fileName?: string }) {
  const { database, user } = requireFirebase();
  const reference = await addDoc(collection(database, "analyses"), {
    athleteId: input.athleteId, athleteName: input.athleteName,
    coachId: input.profile.role === "coach" ? input.profile.uid : input.profile.coachId,
    clubId: input.profile.clubId, createdBy: user.uid, sourceType: input.sourceType,
    environment: input.environment, status: input.sourceType === "video" ? "uploading" : "draft",
    progress: { ...initialAnalysisProgress, status: input.sourceType === "video" ? "uploading" : "draft", currentStep: input.sourceType === "video" ? "upload" : "validation" },
    videoUrl: null, storagePath: null, videoStorageMode: "none", thumbnailUrl: null, fileName: input.fileName ?? null,
    durationSeconds: null, technicalScore: null, metrics: emptyAnalysisMetrics,
    phases: {}, errors: [], recommendations: [], coachComment: null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export function subscribeToAnalysis(id: string, profile: UserProfile, onValue: (analysis: RowingAnalysis) => void, onError: (error: Error) => void) {
  const { database } = requireFirebase();
  return onSnapshot(doc(database, "analyses", id), (snapshot) => {
    if (!snapshot.exists()) { onError(new Error("Analyse introuvable.")); return; }
    const analysis = { id: snapshot.id, ...snapshot.data() } as RowingAnalysis;
    if (!canAccessAnalysis(profile, analysis)) { onError(new Error("Accès non autorisé.")); return; }
    onValue(analysis);
  }, (reason) => onError(reason));
}

async function authenticatedRequest(path: string) {
  const { user } = requireFirebase();
  const response = await fetch(path, { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
  const body = await response.json() as { success:boolean; error?:{message:string} };
  if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Action impossible.");
}
export const queueAnalysis = (id: string) => authenticatedRequest(`/api/analyses/${id}/process`);
export const cancelAnalysis = (id: string) => authenticatedRequest(`/api/analyses/${id}/cancel`);
export const retryAnalysis = (id: string) => authenticatedRequest(`/api/analyses/${id}/retry`);

export async function updateAnalysis(id: string, values: Partial<RowingAnalysis>) {
  const { database } = requireFirebase();
  const safeValues = { ...values }; delete safeValues.id;
  await updateDoc(doc(database, "analyses", id), { ...safeValues, updatedAt: serverTimestamp() });
}

export async function removeAnalysis(id: string, profile: UserProfile) {
  const analysis = await getAnalysis(id, profile);
  if (profile.role === "athlete" && analysis.status === "processing") throw new Error("Une analyse en cours ne peut pas être supprimée.");
  const { database } = requireFirebase();
  await deleteDoc(doc(database, "analyses", id));
  return analysis;
}
