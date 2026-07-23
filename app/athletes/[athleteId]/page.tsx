"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileVideo, Medal, MessageSquare, Plus, Save, Trash2, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileQrCard } from "@/components/profile/ProfileQrCard";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses } from "@/services/analysis-service";
import { addPersonalBest, listAthletes, listPersonalBests, removePersonalBest, updateManagedAthleteProfile } from "@/services/user-service";
import { displayAge } from "@/lib/user-profile";
import type { RowingAnalysis } from "@/types/analysis";
import type { AthleteBestPerformance, AthleteDiscipline } from "@/types/athlete";
import type { ProfileCategory, ProfileDiscipline, UserProfile } from "@/types/user";

const disciplineLabels: Record<ProfileDiscipline, string> = { ERGOMETER: "Ergomètre", SKIFF: "Skiff", BEACH_ROWING: "Beach Rowing" };
const categoryOptions: ProfileCategory[] = ["U15", "U19", "U21", "U23", "SENIOR"];

function AthleteDetail({ id }: { id: string }) {
  const { profile } = useAuth();
  const [athlete, setAthlete] = useState<UserProfile | null>(null);
  const [analyses, setAnalyses] = useState<RowingAnalysis[]>([]);
  const [performances, setPerformances] = useState<AthleteBestPerformance[]>([]);
  const [officialCategory, setOfficialCategory] = useState<ProfileCategory | "">("");
  const [overrideReason, setOverrideReason] = useState("");
  const [disciplines, setDisciplines] = useState<ProfileDiscipline[]>([]);
  const [primaryDiscipline, setPrimaryDiscipline] = useState<ProfileDiscipline | "">("");
  const [sportStatus, setSportStatus] = useState<UserProfile["sportStatus"]>("active");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async (manager: UserProfile) => {
    const [users, rows, bests] = await Promise.all([listAthletes(manager), listAnalyses(manager), listPersonalBests(id)]);
    const found = users.find((item) => item.uid === id) ?? null;
    setAthlete(found); setAnalyses(rows.filter((row) => row.athleteId === id)); setPerformances(bests);
    if (found) { setOfficialCategory(found.officialCategory ?? ""); setOverrideReason(found.categoryOverrideReason ?? ""); setDisciplines(found.disciplines); setPrimaryDiscipline(found.primaryDiscipline ?? ""); setSportStatus(found.sportStatus); }
  }, [id]);
  useEffect(() => { if (profile) void reload(profile).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible.")); }, [profile, reload]);
  if (!profile) return null;
  const toggleDiscipline = (value: ProfileDiscipline) => setDisciplines((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const saveManaged = async () => {
    if (!athlete || !disciplines.length) return;
    try { setError(""); await updateManagedAthleteProfile(profile, athlete.uid, { officialCategory: officialCategory || null, categoryOverrideReason: overrideReason || null, disciplines, primaryDiscipline: primaryDiscipline || disciplines[0], sportStatus }); setMessage("Profil sportif mis à jour."); await reload(profile); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Modification impossible."); }
  };
  const addPerformance = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try {
      await addPersonalBest(id, { discipline: String(form.get("discipline")) as AthleteDiscipline, testOrEvent: String(form.get("testOrEvent")), value: Number(form.get("value")), unit: String(form.get("unit")), achievedAt: String(form.get("achievedAt")), competitionName: String(form.get("competitionName") || "") || undefined, location: String(form.get("location") || "") || undefined, proofUrl: undefined, source: String(form.get("source")) as AthleteBestPerformance["source"] });
      event.currentTarget.reset(); setMessage("Performance/compétition ajoutée."); await reload(profile);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ajout impossible."); }
  };
  return <AppShell title={athlete ? `${athlete.firstName} ${athlete.lastName}` : "Profil athlète"} subtitle="Fiche sportive complète">
    <Link className="back-link" href="/athletes"><ArrowLeft />Retour aux athlètes</Link>
    {error && <div className="error-card">{error}</div>}{message && <div className="notice-card">{message}</div>}
    {!athlete ? <div className="empty-state"><p>Profil athlète introuvable ou non autorisé.</p></div> : <>
      <section className="profile-summary"><ProfileAvatar photoUrl={athlete.profilePhotoUrl} firstName={athlete.firstName} lastName={athlete.lastName} large /><div><h2>{athlete.firstName} {athlete.lastName}</h2><p>{athlete.email}</p><small>{displayAge(athlete) !== null ? `${displayAge(athlete)} ans` : "Âge non renseigné"} · Catégorie {athlete.officialCategory ?? athlete.calculatedCategory ?? "—"}<br />Club : {athlete.clubId ?? "Non associé"} · Licence : {athlete.licenseNumber ?? "—"}</small><div className="profile-disciplines">{athlete.disciplines.map((discipline) => <span key={discipline}>{disciplineLabels[discipline]}</span>)}</div></div><Link className="button primary" href={`/analyses/nouvelle?athleteId=${athlete.uid}`}><FileVideo />Lancer une analyse</Link></section>
      <div className="dash-stats"><article><span><FileVideo /></span><div><small>Analyses</small><strong>{analyses.length}</strong></div></article><article><span><TrendingUp /></span><div><small>Meilleur score</small><strong>{Math.max(0, ...analyses.map((item) => item.technicalScore ?? 0))}</strong></div></article><article><span><Medal /></span><div><small>Performances</small><strong>{performances.length}</strong></div></article><article><span><MessageSquare /></span><div><small>Notes coach</small><strong>{analyses.filter((item) => item.coachComment).length}</strong></div></article></div>
      <section className="content-card form-card"><h2>Modifier le profil sportif</h2><div className="form-grid"><label className="plain-field">Catégorie calculée<input value={athlete.calculatedCategory ?? "—"} disabled /></label><label className="plain-field">Catégorie officielle<select value={officialCategory} onChange={(event) => setOfficialCategory(event.target.value as ProfileCategory)}><option value="">Catégorie calculée</option>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label><label className="plain-field">Motif de dérogation<input value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Règlement fédéral ou compétition" /></label><label className="plain-field">Statut<select value={sportStatus} onChange={(event) => setSportStatus(event.target.value as UserProfile["sportStatus"])}><option value="active">Actif</option><option value="injured">Blessé</option><option value="inactive">Inactif</option><option value="archived">Archivé</option></select></label></div><h3>Disciplines</h3><div className="choice-grid">{(Object.keys(disciplineLabels) as ProfileDiscipline[]).map((discipline) => <label className={disciplines.includes(discipline) ? "selected" : ""} key={discipline}><input type="checkbox" checked={disciplines.includes(discipline)} onChange={() => toggleDiscipline(discipline)} />{disciplineLabels[discipline]}</label>)}</div><label className="plain-field">Discipline principale<select value={primaryDiscipline} onChange={(event) => setPrimaryDiscipline(event.target.value as ProfileDiscipline)}>{disciplines.map((discipline) => <option key={discipline} value={discipline}>{disciplineLabels[discipline]}</option>)}</select></label><button className="button primary" onClick={() => void saveManaged()}><Save />Enregistrer les modifications</button></section>
      <section className="content-card"><h2>Performances et compétitions</h2>{performances.length === 0 ? <p>Aucune performance enregistrée.</p> : <div className="performance-list">{performances.map((performance) => <article key={performance.id}><div><strong>{performance.testOrEvent}</strong><span>{performance.value} {performance.unit} · {disciplineLabels[performance.discipline]}</span><small>{performance.competitionName || "Hors compétition"} · {performance.achievedAt}{performance.location ? ` · ${performance.location}` : ""} · Source : {performance.source}</small></div><button className="danger-button" onClick={() => void removePersonalBest(id, performance.id).then(() => reload(profile))}><Trash2 />Supprimer</button></article>)}</div>}
        <form className="form-card" onSubmit={addPerformance}><h3><Plus />Ajouter un résultat</h3><div className="form-grid"><label className="plain-field">Discipline<select name="discipline" required>{(Object.keys(disciplineLabels) as ProfileDiscipline[]).map((discipline) => <option value={discipline} key={discipline}>{disciplineLabels[discipline]}</option>)}</select></label><label className="plain-field">Épreuve<input name="testOrEvent" placeholder="ERG_2000M, BEACH_SPRINT…" required /></label><label className="plain-field">Résultat<input name="value" type="number" step="0.01" required /></label><label className="plain-field">Unité<input name="unit" placeholder="s, m, km/h, W…" required /></label><label className="plain-field">Date<input name="achievedAt" type="date" required /></label><label className="plain-field">Compétition<input name="competitionName" /></label><label className="plain-field">Lieu<input name="location" /></label><label className="plain-field">Source<select name="source"><option value="official_result">Résultat officiel</option><option value="coach">Coach</option><option value="concept2">Concept2</option><option value="gps">GPS</option><option value="sensor">Capteur</option><option value="manual">Saisie manuelle</option><option value="video_estimation">Estimation vidéo</option></select></label></div><button className="button primary"><Plus />Ajouter</button></form>
      </section>
      {athlete.qrCodeId && athlete.privacySettings.qrEnabled && <ProfileQrCard qrCodeId={athlete.qrCodeId} />}
    </>}
  </AppShell>;
}

export default function AthleteDetailPage({ params }: { params: Promise<{ athleteId: string }> }) { const { athleteId } = use(params); return <ProtectedPage allowedRoles={["coach", "club_admin", "superadmin"]}><AthleteDetail id={athleteId} /></ProtectedPage>; }
