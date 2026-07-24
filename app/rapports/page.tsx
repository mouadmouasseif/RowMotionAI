"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Download,
  FileBarChart,
  FileSpreadsheet,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses } from "@/services/analysis-service";
import { listClubs } from "@/services/club-service";
import { listCompetitions } from "@/services/competition-service";
import { listAthletes, listCoaches } from "@/services/user-service";
import type { RowingAnalysis } from "@/types/analysis";
import type { Club } from "@/types/club";
import type { Competition } from "@/types/competition";
import type { UserProfile } from "@/types/user";

function dateFromUnknown(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  return value instanceof Date ? value : null;
}

function ReportsContent() {
  const { profile } = useAuth();
  const [analyses, setAnalyses] = useState<RowingAnalysis[]>([]);
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [coaches, setCoaches] = useState<UserProfile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    let active = true;
    void Promise.allSettled([
      listAnalyses(profile, 500),
      listAthletes(profile),
      listCoaches(profile),
      listClubs(profile),
      listCompetitions(),
    ]).then((results) => {
      if (!active) return;
      const [analysisResult, athleteResult, coachResult, clubResult, competitionResult] = results;
      if (analysisResult.status === "fulfilled") setAnalyses(analysisResult.value);
      if (athleteResult.status === "fulfilled") setAthletes(athleteResult.value);
      if (coachResult.status === "fulfilled") setCoaches(coachResult.value);
      if (clubResult.status === "fulfilled") setClubs(clubResult.value);
      if (competitionResult.status === "fulfilled") setCompetitions(competitionResult.value);
      if (results.some((result) => result.status === "rejected")) {
        setError("Certaines données ne sont pas accessibles avec votre rôle.");
      }
    });
    return () => {
      active = false;
    };
  }, [profile]);

  const completed = analyses.filter((analysis) => analysis.status === "completed");
  const monthly = useMemo(() => {
    const values = Array.from({ length: 12 }, () => 0);
    completed.forEach((analysis) => {
      const date = dateFromUnknown(analysis.createdAt);
      if (date) values[date.getMonth()] += 1;
    });
    return values;
  }, [completed]);
  const maxMonthly = Math.max(...monthly, 1);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    athletes.forEach((athlete) => {
      const category = athlete.officialCategory ?? athlete.calculatedCategory ?? athlete.category ?? "Non définie";
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [athletes]);

  const exportCsv = () => {
    const rows = [
      ["Identifiant", "Athlète", "Statut", "Discipline", "Score", "Durée (s)"],
      ...analyses.map((analysis) => [
        analysis.id,
        analysis.athleteName,
        analysis.status,
        analysis.environment,
        analysis.technicalScore ?? "",
        analysis.durationSeconds ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rowmotion-analyses-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!profile) return null;

  const summary = [
    { label: "Clubs actifs", value: clubs.filter((club) => club.active).length, icon: Building2, color: "blue" },
    { label: "Compétitions", value: competitions.length, icon: Trophy, color: "green" },
    { label: "Athlètes", value: athletes.length, icon: Users, color: "purple" },
    { label: "Coachs", value: coaches.length, icon: UserCog, color: "yellow" },
    { label: "Analyses réalisées", value: completed.length, icon: FileBarChart, color: "blue" },
  ];

  return (
    <AppShell
      referenceMode
      title="Rapports"
      subtitle="Générez des rapports détaillés et exportez les données de votre structure."
      headerActions={
        <div className="report-period">
          <CalendarDays />
          <span>Données Firebase disponibles</span>
        </div>
      }
    >
      <div className="reports-reference">
        <nav className="reports-tabs">
          <button className="active">Aperçu</button>
          <button>Rapports prédéfinis</button>
          <button>Rapports personnalisés</button>
          <button>Exports programmés</button>
        </nav>
        {error && <div className="notice-card">{error}</div>}
        <section className="report-types">
          {summary.slice(0, 4).map(({ label, value, icon: Icon, color }) => (
            <article key={label} className={color}>
              <Icon />
              <div><h2>{label}</h2><p>Données et statistiques accessibles</p><strong>{value} enregistré{value > 1 ? "s" : ""}</strong></div>
            </article>
          ))}
        </section>
        <div className="reports-layout">
          <main>
            <h2 className="reports-heading">Vue d’ensemble</h2>
            <section className="reports-summary">
              {summary.map(({ label, value, icon: Icon, color }) => (
                <article key={label}><Icon className={color} /><strong>{value}</strong><small>{label}</small></article>
              ))}
            </section>
            <section className="reports-charts">
              <article>
                <h2>Évolution des analyses</h2>
                <div className="monthly-bars">
                  {monthly.map((value, index) => (
                    <span key={index}><i style={{ height: `${Math.max((value / maxMonthly) * 100, 3)}%` }} /><small>{["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"][index]}</small></span>
                  ))}
                </div>
              </article>
              <article>
                <h2>Répartition des athlètes par catégorie</h2>
                <div className="category-report">
                  <div className="report-donut"><strong>{athletes.length}</strong><small>Athlètes</small></div>
                  <ul>{categories.map(([label, value]) => <li key={label}><span>{label}</span><strong>{value}</strong></li>)}</ul>
                </div>
              </article>
            </section>
            <h2 className="reports-heading">Rapports disponibles</h2>
            <section className="popular-reports">
              {[
                [Building2, "Rapport clubs", "Activité des clubs et de leurs membres"],
                [Trophy, "Rapport compétitions", "Participation et résultats"],
                [Users, "Rapport athlètes", "Performances et progression"],
                [UserCog, "Rapport coachs", "Athlètes encadrés et analyses"],
              ].map(([Icon, title, description]) => {
                const ReportIcon = Icon as typeof Building2;
                return <article key={String(title)}><ReportIcon /><h2>{String(title)}</h2><p>{String(description)}</p><button onClick={exportCsv}>Générer le rapport <Download /></button></article>;
              })}
            </section>
          </main>
          <aside className="reports-aside">
            <section>
              <h2>Exporter rapidement</h2>
              <button onClick={exportCsv}><FileSpreadsheet /><span><strong>Export CSV</strong><small>Données réelles des analyses</small></span><Download /></button>
              <button onClick={() => window.print()}><FileBarChart /><span><strong>Imprimer / PDF</strong><small>Vue synthétique actuelle</small></span><Download /></button>
            </section>
            <section>
              <h2>État des données</h2>
              <p><span>Analyses terminées</span><strong>{completed.length}</strong></p>
              <p><span>Analyses en cours</span><strong>{analyses.filter((item) => item.status === "processing").length}</strong></p>
              <p><span>Compétitions</span><strong>{competitions.length}</strong></p>
              <p><span>Profils sportifs</span><strong>{athletes.length + coaches.length}</strong></p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default function ReportsPage() {
  return <ProtectedPage><ReportsContent /></ProtectedPage>;
}
