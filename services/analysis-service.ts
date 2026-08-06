import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { normalizeAnalysis } from "@/lib/analysis/normalize-analysis";
import { sanitizeFirestoreData } from "@/lib/firestore-sanitize";
import { emptyAnalysisMetrics, initialAnalysisProgress, type AnalysisDistanceType, type AnalysisEnvironment, type AnalysisScope, type AnalysisSource, type AnalysisTrainingType, type RowingAnalysis } from "@/types/analysis";
import type { UserProfile } from "@/types/user";

function requireFirebase() {
  if (!auth?.currentUser || !db) throw new Error("Vous devez être connecté pour effectuer cette action.");
  return { user: auth.currentUser, database: db };
}

export function canAccessAnalysis(profile: UserProfile, analysis: RowingAnalysis) {
  if (profile.role === "SUPER_ADMIN") return true;
  if (profile.role === "TECHNICAL_DIRECTOR") return Boolean((profile.technicalScope?.clubIds ?? [profile.clubId]).includes(analysis.clubId ?? ""));
  if (profile.role === "CLUB_ADMIN") return Boolean(profile.clubId && profile.clubId === analysis.clubId);
  if (profile.role === "COACH") return profile.uid === analysis.coachId || profile.uid === analysis.createdBy;
  return profile.uid === analysis.athleteId;
}

export async function listAnalyses(profile: UserProfile, max = 100): Promise<RowingAnalysis[]> {
  const { database } = requireFirebase();
  const base = collection(database, "analyses");
  const constraints = profile.role === "SUPER_ADMIN" ? [orderBy("createdAt", "desc"), limit(max)]
    : profile.role === "TECHNICAL_DIRECTOR" && (profile.technicalScope?.clubIds[0] ?? profile.clubId) ? [where("clubId", "==", profile.technicalScope?.clubIds[0] ?? profile.clubId), limit(max)]
    : profile.role === "CLUB_ADMIN" && profile.clubId ? [where("clubId", "==", profile.clubId), limit(max)]
    : profile.role === "COACH" ? [where("coachId", "==", profile.uid), limit(max)]
    : [where("athleteId", "==", profile.uid), limit(max)];
  const snapshot = await getDocs(query(base, ...constraints));
  return snapshot.docs.map((item) => normalizeAnalysis({ id: item.id, ...item.data() } as RowingAnalysis));
}

export async function getAnalysis(id: string, profile: UserProfile): Promise<RowingAnalysis> {
  const { database } = requireFirebase();
  const snapshot = await getDoc(doc(database, "analyses", id));
  if (!snapshot.exists()) throw new Error("Analyse introuvable.");
  const analysis = normalizeAnalysis({ id: snapshot.id, ...snapshot.data() } as RowingAnalysis);
  if (!canAccessAnalysis(profile, analysis)) throw new Error("Vous n’êtes pas autorisé à accéder à cette analyse.");
  return analysis;
}

export async function createAnalysis(input: { athleteId: string; athleteName: string; environment: AnalysisEnvironment; sourceType: AnalysisSource; trainingType?: AnalysisTrainingType; analysisScope?: AnalysisScope; analysisType?: AnalysisDistanceType; distance?: number | null; profile: UserProfile; fileName?: string }) {
  const { database, user } = requireFirebase();
  const payload = sanitizeFirestoreData({
    athleteId: input.athleteId, athleteName: input.athleteName,
    coachId: input.profile.role === "COACH" ? input.profile.uid : input.profile.coachId,
    clubId: input.profile.clubId, createdBy: user.uid, sourceType: input.sourceType,
    environment: input.environment, rowingType: input.environment, trainingType: input.trainingType ?? "technique", analysisScope: input.analysisScope ?? "complete", analysisType: input.analysisType ?? "free_technique", distance: input.distance ?? null, status: input.sourceType === "video" ? "uploading" : "draft",
    progress: { ...initialAnalysisProgress, status: input.sourceType === "video" ? "uploading" : "draft", currentStep: input.sourceType === "video" ? "upload" : "validation" },
    videoUrl: null, storagePath: null, videoStorageMode: "none", thumbnailUrl: null, fileName: input.fileName ?? null,
    durationSeconds: null, technicalScore: null, metrics: emptyAnalysisMetrics,
    phases: {}, splits: [], racePhases: [], strokes: [], turns: [], errors: [], recommendations: [], coachComment: null,
    crewAnalysis: null, startAnalysis: null, finishAnalysis: null, biomechanics: null, muscleEstimation: null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  if (process.env.NODE_ENV === "development") console.info("[RowMotion] ANALYSIS_SAVE", { athleteId: input.athleteId, environment: input.environment, sourceType: input.sourceType });
  const reference = await addDoc(collection(database, "analyses"), payload);
  return reference.id;
}

export function subscribeToAnalysis(id: string, profile: UserProfile, onValue: (analysis: RowingAnalysis) => void, onError: (error: Error) => void) {
  const { database } = requireFirebase();
  return onSnapshot(doc(database, "analyses", id), (snapshot) => {
    if (!snapshot.exists()) { onError(new Error("Analyse introuvable.")); return; }
    const analysis = normalizeAnalysis({ id: snapshot.id, ...snapshot.data() } as RowingAnalysis);
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
  const payload = sanitizeFirestoreData({ ...safeValues, updatedAt: serverTimestamp() });
  try {
    if (process.env.NODE_ENV === "development") console.info("[RowMotion] ANALYSIS_SAVE", { id, fields: Object.keys(payload) });
    await updateDoc(doc(database, "analyses", id), payload);
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("[RowMotion] ANALYSIS_SAVE_ERROR", { id, error });
    throw error;
  }
}

export async function removeAnalysis(id: string, profile: UserProfile) {
  const analysis = await getAnalysis(id, profile);
  if (profile.role === "ATHLETE" && analysis.status === "processing") throw new Error("Une analyse en cours ne peut pas être supprimée.");
  const { database } = requireFirebase();
  await deleteDoc(doc(database, "analyses", id));
  return analysis;
}
