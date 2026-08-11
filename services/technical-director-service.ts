import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DATA_UNAVAILABLE } from "@/lib/data-availability";
import { toDate } from "@/lib/user-profile";
import { normalizeAnalysis } from "@/lib/analysis/normalize-analysis";
import { createUserProfile } from "@/services/auth-service";
import type { RowingAnalysis } from "@/types/analysis";
import { normalizeUserRole, type UserProfile } from "@/types/user";

export interface WatchedAthlete {
  athlete: UserProfile;
  analysisCount: number;
  lastAnalysisAt: Date | null;
  averageScore: number | null;
  reasons: string[];
}

export interface TechnicalDirectorOverview {
  scopeClubIds: string[];
  athletes: UserProfile[];
  coaches: UserProfile[];
  analyses: RowingAnalysis[];
  watchedAthletes: WatchedAthlete[];
  kpis: Array<{ label: string; value: string; detail: string }>;
  alerts: Array<{ title: string; detail: string; tone: "blue" | "yellow" | "red" }>;
}

function requireDb() {
  if (!db) throw new Error("Firebase est indisponible.");
  return db;
}

function scopeClubIds(profile: UserProfile) {
  return Array.from(new Set([...(profile.technicalScope?.clubIds ?? []), profile.clubId].filter((value): value is string => Boolean(value))));
}

async function listScopedUsers(profile: UserProfile) {
  const database = requireDb();
  const clubIds = scopeClubIds(profile);
  if (!clubIds.length) return [];
  const snapshots = await Promise.all(clubIds.map((clubId) => getDocs(query(collection(database, "users"), where("clubId", "==", clubId)))));
  const rows = new Map<string, UserProfile>();
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((item) => {
    const role = normalizeUserRole(item.data().role);
    if (role !== "ATHLETE" && role !== "COACH") return;
    rows.set(item.id, createUserProfile(item.id, typeof item.data().email === "string" ? item.data().email : null, item.data()));
  });
  return Array.from(rows.values());
}

async function listScopedAnalyses(profile: UserProfile) {
  const database = requireDb();
  const clubIds = scopeClubIds(profile);
  if (!clubIds.length) return [];
  const snapshots = await Promise.all(clubIds.map((clubId) => getDocs(query(collection(database, "analyses"), where("clubId", "==", clubId)))));
  const rows = new Map<string, RowingAnalysis>();
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((item) => {
    rows.set(item.id, normalizeAnalysis({ id: item.id, ...item.data() } as RowingAnalysis));
  });
  return Array.from(rows.values()).sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
}

function averageScore(analyses: RowingAnalysis[]) {
  const scores = analyses.map((analysis) => analysis.technicalScore).filter((value): value is number => typeof value === "number");
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
}

function buildWatchedAthletes(athletes: UserProfile[], analyses: RowingAnalysis[]) {
  const byAthlete = new Map<string, RowingAnalysis[]>();
  analyses.forEach((analysis) => {
    const rows = byAthlete.get(analysis.athleteId) ?? [];
    rows.push(analysis);
    byAthlete.set(analysis.athleteId, rows);
  });

  return athletes.map((athlete): WatchedAthlete => {
    const athleteAnalyses = byAthlete.get(athlete.uid) ?? [];
    const lastAnalysisAt = athleteAnalyses.map((analysis) => toDate(analysis.createdAt)).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const score = averageScore(athleteAnalyses);
    const reasons: string[] = [];
    if (!athlete.coachId && !athlete.coachIds?.length) reasons.push("Coach non affecte");
    if (!athleteAnalyses.length) reasons.push("Aucune analyse Firebase");
    if (score != null && score < 60) reasons.push("Score technique faible");
    if (!athlete.clubId) reasons.push("Club non renseigne");
    if (!athlete.disciplines.length) reasons.push("Discipline non renseignee");
    return { athlete, analysisCount: athleteAnalyses.length, lastAnalysisAt, averageScore: score, reasons };
  }).filter((row) => row.reasons.length > 0);
}

export async function getTechnicalDirectorOverview(profile: UserProfile): Promise<TechnicalDirectorOverview> {
  const clubIds = scopeClubIds(profile);
  const [users, analyses] = await Promise.all([listScopedUsers(profile), listScopedAnalyses(profile)]);
  const athletes = users.filter((user) => user.role === "ATHLETE");
  const coaches = users.filter((user) => user.role === "COACH");
  const watchedAthletes = buildWatchedAthletes(athletes, analyses);
  const completed = analyses.filter((analysis) => analysis.status === "completed");
  const score = averageScore(completed);
  const athletesWithoutCoach = athletes.filter((athlete) => !athlete.coachId && !athlete.coachIds?.length).length;

  return {
    scopeClubIds: clubIds,
    athletes,
    coaches,
    analyses,
    watchedAthletes,
    kpis: [
      { label: "Clubs dans le scope", value: clubIds.length ? String(clubIds.length) : DATA_UNAVAILABLE, detail: clubIds.length ? "Scope Firebase" : "Scope non configure" },
      { label: "Athletes suivis", value: String(athletes.length), detail: "Profils Firebase" },
      { label: "Coaches actifs", value: String(coaches.filter((coach) => coach.active).length), detail: `${coaches.length} coach(s) total` },
      { label: "Analyses disponibles", value: String(analyses.length), detail: "Analyses du scope" },
      { label: "Score technique moyen", value: score == null ? DATA_UNAVAILABLE : score.toFixed(1), detail: completed.length ? "Analyses terminees" : DATA_UNAVAILABLE },
      { label: "Athletes a surveiller", value: String(watchedAthletes.length), detail: "Data incomplete ou risque" },
    ],
    alerts: [
      athletesWithoutCoach ? { title: "Athletes sans coach", detail: `${athletesWithoutCoach} athlete(s) sans affectation coach`, tone: "yellow" } : null,
      !clubIds.length ? { title: "Scope Direction Technique absent", detail: "Configurer technicalScope.clubIds dans Firebase", tone: "red" } : null,
      !analyses.length ? { title: "Aucune analyse dans le scope", detail: "Les indicateurs de performance restent indisponibles", tone: "blue" } : null,
    ].filter((item): item is TechnicalDirectorOverview["alerts"][number] => Boolean(item)),
  };
}
