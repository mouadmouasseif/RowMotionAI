"use client";

import { Activity, Bell, ChevronRight, Clock3, FileVideo, LayoutDashboard, LogOut, Play, Settings, TrendingUp, Upload, Users, Waves } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { Brand } from "./Brand";

const roleNames = { athlete: "Athlète", coach: "Entraîneur", club_admin: "Administrateur du club", superadmin: "Super administrateur" } as const;

export function DashboardView() {
  const { profile, logout } = useAuth();
  if (!profile) return null;
  const coachView = profile.role !== "athlete";
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;
  const initials = `${profile.firstName?.[0] ?? "R"}${profile.lastName?.[0] ?? "M"}`.toUpperCase();
  return (
    <main className="dashboard-page">
      <aside className="sidebar"><Brand compact /><nav><Link className="current" href="#"><LayoutDashboard /> Vue d’ensemble</Link><Link href="#"><FileVideo /> Analyses vidéo</Link><Link href="#"><Users /> {coachView ? "Athlètes" : "Mon entraîneur"}</Link><Link href="#"><TrendingUp /> Progression</Link><Link href="#"><Settings /> Paramètres</Link></nav><button className="logout" onClick={() => void logout()}><LogOut /> Se déconnecter</button></aside>
      <section className="dashboard-main">
        <header className="dash-header"><div><small>Espace {roleNames[profile.role]}</small><h1>Bonjour {profile.firstName || "et bienvenue"} 👋</h1></div><div className="dash-profile"><button><Bell /></button><span>{initials}</span><div><strong>{displayName}</strong><small>{roleNames[profile.role]}</small></div></div></header>
        <div className="welcome-card"><div><span className="mini-label"><Activity /> Nouvelle analyse IA</span><h2>{profile.role === "superadmin" ? "Pilotez toute la plateforme RowMotion AI." : "Transformez chaque coup de rame en progrès."}</h2><p>{profile.role === "superadmin" ? "Gérez les clubs, les comptes et les analyses depuis votre espace sécurisé." : "Importez une vidéo sur ergomètre ou sur l’eau pour obtenir une analyse biomécanique complète."}</p><div><button className="button primary"><Upload /> Importer une vidéo</button><button className="button ghost"><Play /> Analyse en direct</button></div></div><Waves className="welcome-wave" /></div>
        <div className="dash-stats"><article><span><FileVideo /></span><div><small>Analyses réalisées</small><strong>24</strong><em>+4 ce mois</em></div></article><article><span><TrendingUp /></span><div><small>Score technique</small><strong>82<small>/100</small></strong><em>+6,4% progression</em></div></article><article><span><Clock3 /></span><div><small>Dernière séance</small><strong>2:05</strong><em>allure moyenne /500m</em></div></article></div>
        <section className="recent-panel"><div className="panel-title"><div><h2>Analyses récentes</h2><p>Dernières séances analysées par l’intelligence artificielle.</p></div><button>Voir tout <ChevronRight /></button></div><div className="analysis-row"><div className="analysis-thumb"><Image src="/rowing-analysis.png" alt="Athlète en aviron" width={956} height={537}/><span><Play /></span></div><div><strong>Entraînement sur l’eau</strong><small>18 juillet 2026 · 08:42</small></div><div className="analysis-score"><small>Score technique</small><strong>82/100</strong></div><span className="status-ready">Terminée</span><button className="row-arrow"><ChevronRight /></button></div></section>
      </section>
    </main>
  );
}
