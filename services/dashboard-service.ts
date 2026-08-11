import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DATA_UNAVAILABLE } from "@/lib/data-availability";
import { listAnalyses } from "@/services/analysis-service";
import { createUserProfile } from "@/services/auth-service";
import type { RowingAnalysis } from "@/types/analysis";
import { normalizeUserRole, type UserProfile, type UserRole } from "@/types/user";

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
  if (!values.length) return null;
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
  const constraints = [];
  if (filters.clubId) constraints.push(where("clubId", "==", filters.clubId));
  if (filters.coachId) constraints.push(where("coachId", "==", filters.coachId));
  if (filters.clubIds?.length === 1) constraints.push(where("clubId", "==", filters.clubIds[0]));
  const snapshot = await getDocs(query(collection(database, "users"), ...constraints));
  return snapshot.docs.filter((item) => normalizeUserRole(item.data().role) === role).length;
}

async function listUsers(role: UserRole, filters: { clubId?: string | null; coachId?: string | null } = {}, max = 8) {
  const database = requireDb();
  const constraints = [];
  if (filters.clubId) constraints.push(where("clubId", "==", filters.clubId));
  if (filters.coachId) constraints.push(where("coachId", "==", filters.coachId));
  const snapshot = await getDocs(query(collection(database, "users"), ...constraints));
  return snapshot.docs
    .filter((item) => normalizeUserRole(item.data().role) === role)
    .slice(0, max)
    .map((item) => createUserProfile(item.id, typeof item.data().email === "string" ? item.data().email : null, item.data()));
}

async function countCollection(collectionName: string) {
  const database = requireDb();
  const snapshot = await getDocs(collection(database, collectionName));
  return snapshot.size;
}

function athleteKpis(analyses: RowingAnalysis[]): DashboardKpi[] {
  const metrics = completedMetrics(analyses);
  return [
    { label: "Distance totale", value: DATA_UNAVAILABLE, unit: "km" },
    { label: "Temps total", value: metrics.totalSeconds ? `${Math.floor(metrics.totalSeconds / 3600)}h` : DATA_UNAVAILABLE, tone: "green" },
    { label: "Puissance moyenne", value: metrics.averagePower == null ? DATA_UNAVAILABLE : String(Math.round(metrics.averagePower)), unit: "W", tone: "purple" },
    { label: "Cadence moyenne", value: metrics.averageCadence == null ? DATA_UNAVAILABLE : String(Math.round(metrics.averageCadence)), unit: "spm" },
    { label: "Score technique", value: metrics.averageScore == null ? DATA_UNAVAILABLE : metrics.averageScore.toFixed(1), unit: "/100", tone: "green" },
    { label: "Nombre d'analyses", value: numberLabel(analyses.length) },
  ];
}

export async function getAthleteDashboardData(profile: UserProfile): Promise<RoleDashboardData> {
  const analyses = await listAnalyses(profile, 40);
  return {
    analyses,
    kpis: athleteKpis(analyses),
    rows: analyses.slice(0, 6).map((analysis) => ({
      cells: [analysis.fileName || analysis.athleteName || DATA_UNAVAILABLE, analysis.status, analysis.technicalScore == null ? DATA_UNAVAILABLE : `${analysis.technicalScore}/100`],
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
      { label: "Volume d'entrainement", value: metrics.totalSeconds ? `${Math.floor(metrics.totalSeconds / 3600)}h` : DATA_UNAVAILABLE },
      { label: "Heures totales", value: metrics.totalSeconds ? `${Math.floor(metrics.totalSeconds / 3600)}h` : DATA_UNAVAILABLE, tone: "purple" },
      { label: "Seances realisees", value: numberLabel(metrics.completed.length) },
      { label: "Score technique equipe", value: metrics.averageScore == null ? DATA_UNAVAILABLE : metrics.averageScore.toFixed(1), unit: "/100", tone: "green" },
      { label: "Alertes fatigue", value: DATA_UNAVAILABLE, tone: "yellow" },
    ],
    rows: athletes.map((athlete) => ({
      cells: [`${athlete.firstName} ${athlete.lastName}`.trim() || athlete.email || DATA_UNAVAILABLE, DATA_UNAVAILABLE, DATA_UNAVAILABLE, DATA_UNAVAILABLE, DATA_UNAVAILABLE, DATA_UNAVAILABLE, DATA_UNAVAILABLE],
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
      { label: "Heures entrainement", value: metrics.totalSeconds ? `${Math.floor(metrics.totalSeconds / 3600)}h` : DATA_UNAVAILABLE, tone: "purple" },
      { label: "Distance totale", value: DATA_UNAVAILABLE, unit: "km" },
      { label: "Competitions", value: "0" },
      { label: "Analyses", value: numberLabel(analyses.length) },
    ],
    rows: analyses.slice(0, 8).map((analysis) => ({ cells: [analysis.athleteName || DATA_UNAVAILABLE, analysis.status, analysis.technicalScore == null ? DATA_UNAVAILABLE : `${analysis.technicalScore}/100`], href: `/analyses/${analysis.id}` })),
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
      { label: "Volume total", value: metrics.totalSeconds ? `${Math.floor(metrics.totalSeconds / 3600)}h` : DATA_UNAVAILABLE },
      { label: "Score technique moyen", value: metrics.averageScore == null ? DATA_UNAVAILABLE : metrics.averageScore.toFixed(1), unit: "/100", tone: "purple" },
      { label: "Charge equipe", value: DATA_UNAVAILABLE, unit: "/10" },
      { label: "Athletes en progression", value: DATA_UNAVAILABLE, tone: "green" },
      { label: "Alertes performance", value: DATA_UNAVAILABLE, tone: "yellow" },
    ],
    rows: [],
    alerts: [],
  };
}

export async function getSuperAdminDashboardData(profile: UserProfile): Promise<RoleDashboardData> {
  const [analyses, athletes, coaches, directors, clubs, jury, competitions] = await Promise.all([
    listAnalyses(profile, 120),
    countUsers("ATHLETE"),
    countUsers("COACH"),
    countUsers("TECHNICAL_DIRECTOR"),
    countCollection("clubs"),
    countUsers("JURY"),
    countCollection("competitions"),
  ]);
  return {
    analyses,
    kpis: [
      { label: "Athletes", value: numberLabel(athletes), tone: "green" },
      { label: "Coaches", value: numberLabel(coaches) },
      { label: "Directeurs techniques", value: numberLabel(directors), tone: "purple" },
      { label: "Clubs", value: numberLabel(clubs) },
      { label: "Competitions", value: numberLabel(competitions) },
      { label: "Jury / Jurees", value: numberLabel(jury) },
      { label: "Analyses totales", value: numberLabel(analyses.length) },
      { label: "Utilisateurs actifs", value: numberLabel(athletes + coaches + directors + jury) },
    ],
    rows: analyses.slice(0, 8).map((analysis) => ({ cells: [analysis.athleteName || DATA_UNAVAILABLE, analysis.status, analysis.clubId ?? DATA_UNAVAILABLE], href: `/analyses/${analysis.id}` })),
    alerts: [],
  };
}

export async function getJuryDashboardData(): Promise<RoleDashboardData> {
  return {
    analyses: [],
    kpis: [
      { label: "Competitions assignees", value: "0" },
      { label: "Courses aujourd'hui", value: DATA_UNAVAILABLE },
      { label: "Departs", value: DATA_UNAVAILABLE },
      { label: "Resultats a valider", value: DATA_UNAVAILABLE, tone: "yellow" },
      { label: "Penalites", value: DATA_UNAVAILABLE },
      { label: "Protestations", value: DATA_UNAVAILABLE },
    ],
    rows: [],
    alerts: [],
  };
}
