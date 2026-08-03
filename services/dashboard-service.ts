import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listAnalyses } from "@/services/analysis-service";
import { createUserProfile } from "@/services/auth-service";
import type { RowingAnalysis } from "@/types/analysis";
import type { UserProfile, UserRole } from "@/types/user";

export interface DashboardKpi {
  label: string;
  value: string;
  unit?: string;
  tone?: "blue" | "green" | "purple" | "yellow" | "red";
}

export interface DashboardTableRow {
  cells: string[];
  href?: string;
}

export interface RoleDashboardData {
  analyses: RowingAnalysis[];
  kpis: DashboardKpi[];
  rows: DashboardTableRow[];
  alerts: string[];
}

function requireDb() {
  if (!db) throw new Error("Firebase est indisponible.");
  return db;
}

function numberLabel(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function completedMetrics(analyses: RowingAnalysis[]) {
  const completed = analyses.filter((analysis) => analysis.status === "completed");
  const scores = completed.map((analysis) => analysis.technicalScore).filter((value): value is number => typeof value === "number");
  const powers = completed.map((analysis) => analysis.metrics?.estimatedPower).filter((value): value is number => typeof value === "number" && value > 0);
  const cadences = completed.map((analysis) => analysis.metrics?.strokeRate).filter((value): value is number => typeof value === "number" && value > 0);
  return {
    completed,
    averageScore: average(scores),
    averagePower: average(powers),
    averageCadence: average(cadences),
    totalSeconds: completed.reduce((sum, analysis) => sum + (analysis.durationSeconds ?? 0), 0),
  };
}

async function countUsers(role: UserRole, filters: { clubId?: string | null; coachId?: string | null; clubIds?: string[] } = {}) {
  const database = requireDb();
  const constraints = [where("role", "==", role)];
  if (filters.clubId) constraints.push(where("clubId", "==", filters.clubId));
  if (filters.coachId) constraints.push(where("coachId", "==", filters.coachId));
  if (filters.clubIds?.length === 1) constraints.push(where("clubId", "==", filters.clubIds[0]));
  const snapshot = await getDocs(query(collection(database, "users"), ...constraints));
  return snapshot.size;
}

async function listUsers(role: UserRole, filters: { clubId?: string | null; coachId?: string | null } = {}, max = 8) {
  const database = requireDb();
  const constraints = [where("role", "==", role), limit(max)];
  if (filters.clubId) constraints.push(where("clubId", "==", filters.clubId));
  if (filters.coachId) constraints.push(where("coachId", "==", filters.coachId));
  const snapshot = await getDocs(query(collection(database, "users"), ...constraints));
  return snapshot.docs.map((item) => createUserProfile(item.id, typeof item.data().email === "string" ? item.data().email : null, item.data()));
}

function athleteKpis(analyses: RowingAnalysis[]): DashboardKpi[] {
  const metrics = completedMetrics(analyses);
  return [
    { label: "Distance totale", value: "0", unit: "km" },
    { label: "Temps total", value: `${Math.floor(metrics.totalSeconds / 3600)}h`, tone: "green" },
    { label: "Puissance moyenne", value: metrics.averagePower ? String(Math.round(metrics.averagePower)) : "0", unit: "W", tone: "purple" },
    { label: "Cadence moyenne", value: metrics.averageCadence ? String(Math.round(metrics.averageCadence)) : "0", unit: "spm" },
    { label: "Score technique", value: metrics.averageScore ? metrics.averageScore.toFixed(1) : "0", unit: "/100", tone: "green" },
    { label: "Nombre d'analyses", value: numberLabel(analyses.length) },
  ];
}

export async function getAthleteDashboardData(profile: UserProfile): Promise<RoleDashboardData> {
  const analyses = await listAnalyses(profile, 40);
  return {
    analyses,
    kpis: athleteKpis(analyses),
    rows: analyses.slice(0, 6).map((analysis) => ({
      cells: [analysis.fileName || analysis.athleteName || "Analyse", analysis.status, analysis.technicalScore ? `${analysis.technicalScore}/100` : "-"],
      href: `/analyses/${analysis.id}`,
    })),
    alerts: [],
  };
}

export async function getCoachDashboardData(profile: UserProfile): Promise<RoleDashboardData> {
  const [analyses, athletes] = await Promise.all([listAnalyses(profile, 80), listUsers("ATHLETE", { coachId: profile.uid }, 12)]);
  const metrics = completedMetrics(analyses);
  return {
    analyses,
    kpis: [
      { label: "Athletes actifs", value: numberLabel(athletes.filter((athlete) => athlete.active).length), tone: "green" },
      { label: "Analyses cette semaine", value: numberLabel(analyses.length) },
      { label: "Volume d'entrainement", value: `${Math.floor(metrics.totalSeconds / 3600)}h` },
      { label: "Heures totales", value: `${Math.floor(metrics.totalSeconds / 3600)}h`, tone: "purple" },
      { label: "Seances realisees", value: numberLabel(metrics.completed.length) },
      { label: "Score technique equipe", value: metrics.averageScore ? metrics.averageScore.toFixed(1) : "0", unit: "/100", tone: "green" },
      { label: "Alertes fatigue", value: "0", tone: "yellow" },
    ],
    rows: athletes.map((athlete) => ({
      cells: [`${athlete.firstName} ${athlete.lastName}`.trim() || athlete.email, "0 km", "0h", "0", "-", "-", "Stable"],
      href: `/coach/athletes/${athlete.uid}`,
    })),
    alerts: [],
  };
}

export async function getClubDashboardData(profile: UserProfile): Promise<RoleDashboardData> {
  const [analyses, athletes, coaches] = await Promise.all([
    listAnalyses(profile, 100),
    countUsers("ATHLETE", { clubId: profile.clubId }),
    countUsers("COACH", { clubId: profile.clubId }),
  ]);
  const metrics = completedMetrics(analyses);
  return {
    analyses,
    kpis: [
      { label: "Athletes", value: numberLabel(athletes), tone: "green" },
      { label: "Coaches", value: numberLabel(coaches) },
      { label: "Seances du mois", value: numberLabel(metrics.completed.length) },
      { label: "Heures entrainement", value: `${Math.floor(metrics.totalSeconds / 3600)}h`, tone: "purple" },
      { label: "Distance totale", value: "0", unit: "km" },
      { label: "Competitions", value: "0" },
      { label: "Analyses", value: numberLabel(analyses.length) },
    ],
    rows: analyses.slice(0, 8).map((analysis) => ({ cells: [analysis.athleteName, analysis.status, analysis.technicalScore ? `${analysis.technicalScore}/100` : "-"], href: `/analyses/${analysis.id}` })),
    alerts: [],
  };
}

export async function getTechnicalDirectorDashboardData(profile: UserProfile): Promise<RoleDashboardData> {
  const scopeClubId = profile.technicalScope?.clubIds[0] ?? profile.clubId;
  const scopedProfile = { ...profile, role: "CLUB_ADMIN" as const, clubId: scopeClubId };
  const [analyses, athletes, coaches] = await Promise.all([
    scopeClubId ? listAnalyses(scopedProfile, 100) : Promise.resolve([]),
    countUsers("ATHLETE", { clubId: scopeClubId }),
    countUsers("COACH", { clubId: scopeClubId }),
  ]);
  const metrics = completedMetrics(analyses);
  return {
    analyses,
    kpis: [
      { label: "Athletes suivis", value: numberLabel(athletes), tone: "green" },
      { label: "Coaches actifs", value: numberLabel(coaches) },
      { label: "Analyses cette semaine", value: numberLabel(analyses.length) },
      { label: "Volume total", value: `${Math.floor(metrics.totalSeconds / 3600)}h` },
      { label: "Score technique moyen", value: metrics.averageScore ? metrics.averageScore.toFixed(1) : "0", unit: "/100", tone: "purple" },
      { label: "Charge equipe", value: "0", unit: "/10" },
      { label: "Athletes en progression", value: "0", tone: "green" },
      { label: "Alertes performance", value: "0", tone: "yellow" },
    ],
    rows: [],
    alerts: [],
  };
}

export async function getSuperAdminDashboardData(profile: UserProfile): Promise<RoleDashboardData> {
  const [analyses, athletes, coaches, directors, clubs, jury] = await Promise.all([
    listAnalyses(profile, 120),
    countUsers("ATHLETE"),
    countUsers("COACH"),
    countUsers("TECHNICAL_DIRECTOR"),
    getDocs(collection(requireDb(), "clubs")).then((snapshot) => snapshot.size),
    countUsers("JURY"),
  ]);
  return {
    analyses,
    kpis: [
      { label: "Athletes", value: numberLabel(athletes), tone: "green" },
      { label: "Coaches", value: numberLabel(coaches) },
      { label: "Directeurs techniques", value: numberLabel(directors), tone: "purple" },
      { label: "Clubs", value: numberLabel(clubs) },
      { label: "Competitions", value: "0" },
      { label: "Jury / Jurees", value: numberLabel(jury) },
      { label: "Analyses totales", value: numberLabel(analyses.length) },
      { label: "Utilisateurs actifs", value: numberLabel(athletes + coaches + directors + jury) },
    ],
    rows: analyses.slice(0, 8).map((analysis) => ({ cells: [analysis.athleteName, analysis.status, analysis.clubId ?? "-"], href: `/analyses/${analysis.id}` })),
    alerts: [],
  };
}

export async function getJuryDashboardData(): Promise<RoleDashboardData> {
  return {
    analyses: [],
    kpis: [
      { label: "Competitions assignees", value: "0" },
      { label: "Courses aujourd'hui", value: "0" },
      { label: "Departs", value: "0" },
      { label: "Resultats a valider", value: "0", tone: "yellow" },
      { label: "Penalites", value: "0" },
      { label: "Protestations", value: "0" },
    ],
    rows: [],
    alerts: [],
  };
}
