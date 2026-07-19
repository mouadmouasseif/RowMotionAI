"use client";
import { Activity, ChevronRight, Clock3, FileVideo, Play, TrendingUp, Upload, Waves } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses } from "@/services/analysis-service";
import type { RowingAnalysis } from "@/types/analysis";
import { AppShell } from "./AppShell";

const roleNames = { athlete: "Athlète", coach: "Entraîneur", club_admin: "Administrateur du club", superadmin: "Super administrateur" } as const;
export function DashboardView() {
  const { profile } = useAuth(); const [analyses, setAnalyses] = useState<RowingAnalysis[]>([]);
  useEffect(() => { if (profile) void listAnalyses(profile, 5).then(setAnalyses).catch(() => setAnalyses([])); }, [profile]);
  if (!profile) return null;
  return <AppShell title={`Bonjour ${profile.firstName || "et bienvenue"}`} subtitle={`Espace ${roleNames[profile.role]}`}>
    <div className="welcome-card"><div><span className="mini-label"><Activity /> Nouvelle analyse IA</span><h2>{profile.role === "superadmin" ? "Pilotez toute la plateforme RowMotion AI." : "Transformez chaque coup de rame en progrès."}</h2><p>Importez une vidéo sur ergomètre ou sur l’eau, ou préparez une analyse en direct.</p><div><Link className="button primary" href="/analyses/nouvelle"><Upload /> Importer une vidéo</Link><Link className="button ghost" href="/analyses/live"><Play /> Analyse en direct</Link></div></div><Waves className="welcome-wave" /></div>
    <div className="dash-stats"><article><span><FileVideo /></span><div><small>Analyses chargées</small><strong>{analyses.length}</strong><em>Données Firestore</em></div></article><article><span><TrendingUp /></span><div><small>Meilleur score</small><strong>{Math.max(0, ...analyses.map((a) => a.technicalScore ?? 0))}<small>/100</small></strong><em>Analyses terminées</em></div></article><article><span><Clock3 /></span><div><small>Dernière séance</small><strong>{analyses[0] ? analyses[0].environment === "boat" ? "Bateau" : "Ergomètre" : "—"}</strong><em>{analyses[0]?.status ?? "Aucune analyse"}</em></div></article></div>
    <section className="recent-panel"><div className="panel-title"><div><h2>Analyses récentes</h2><p>Dernières séances accessibles selon votre rôle.</p></div><Link href="/analyses">Voir tout <ChevronRight /></Link></div>{analyses.length === 0 ? <div className="empty-state"><FileVideo /><h3>Aucune analyse</h3><p>Importez votre première vidéo pour commencer.</p></div> : analyses.map((analysis) => <Link className="analysis-row" href={`/analyses/${analysis.id}`} key={analysis.id}><div className="machine-thumb"><Play /></div><div><strong>{analysis.athleteName || "Athlète"}</strong><small>{analysis.environment === "boat" ? "Bateau" : "Ergomètre"}</small></div><div className="analysis-score"><small>Score technique</small><strong>{analysis.technicalScore ?? "—"}/100</strong></div><span className="status-ready">{analysis.status}</span><span className="row-arrow"><ChevronRight /></span></Link>)}</section>
  </AppShell>;
}
