"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Plus, Save, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import { createCompetition, listCompetitions, updateCompetition } from "@/services/competition-service";
import type { Competition } from "@/types/competition";
import type { ProfileCategory, ProfileDiscipline } from "@/types/user";

const disciplines: ProfileDiscipline[] = ["ERGOMETER", "SKIFF", "BEACH_ROWING"];
const categories: ProfileCategory[] = ["U15", "U19", "U21", "U23", "SENIOR"];

function CompetitionsContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Competition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const load = () => listCompetitions().then(setItems).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Chargement impossible."));
  useEffect(() => { if (profile) void load(); }, [profile]);
  if (!profile) return null;
  const canManage = ["coach", "club_admin", "superadmin"].includes(profile.role);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { setError(""); await createCompetition(profile, { name: String(form.get("name")), startDate: String(form.get("startDate")), endDate: String(form.get("endDate")), location: String(form.get("location")), disciplines: form.getAll("disciplines") as ProfileDiscipline[], categories: form.getAll("categories") as ProfileCategory[], status: String(form.get("status")) as Competition["status"], clubId: String(form.get("clubId") || "") || null, notes: String(form.get("notes") || "") || null }); event.currentTarget.reset(); setShowForm(false); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Création impossible."); }
  };
  return <AppShell title="Compétitions" subtitle="Calendrier et résultats sportifs"><div className="page-actions">{canManage && <button className="button primary" onClick={() => setShowForm((value) => !value)}><Plus />Nouvelle compétition</button>}</div>{error && <div className="error-card">{error}</div>}{showForm && <form className="content-card form-card" onSubmit={submit}><h2>Créer une compétition</h2><div className="form-grid"><label className="plain-field">Nom<input name="name" required /></label><label className="plain-field">Lieu<input name="location" required /></label><label className="plain-field">Début<input name="startDate" type="date" required /></label><label className="plain-field">Fin<input name="endDate" type="date" required /></label><label className="plain-field">Statut<select name="status"><option value="planned">Planifiée</option><option value="open">Inscriptions ouvertes</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option></select></label>{profile.role === "superadmin" && <label className="plain-field">Club<input name="clubId" /></label>}</div><h3>Disciplines</h3><div className="choice-grid">{disciplines.map((value) => <label key={value}><input type="checkbox" name="disciplines" value={value} />{value}</label>)}</div><h3>Catégories</h3><div className="choice-grid">{categories.map((value) => <label key={value}><input type="checkbox" name="categories" value={value} />{value}</label>)}</div><label className="plain-field">Notes<textarea name="notes" /></label><button className="button primary"><Save />Enregistrer</button></form>}
    {items.length === 0 ? <div className="empty-state"><Trophy /><h2>Aucune compétition</h2><p>Ajoutez le calendrier des événements du club.</p></div> : <div className="data-grid">{items.map((competition) => <article className="data-card" key={competition.id}><div className="card-heading"><span className={`status-pill ${competition.status === "completed" ? "completed" : "processing"}`}>{competition.status}</span></div><h2>{competition.name}</h2><p><CalendarDays /> {competition.startDate}{competition.endDate !== competition.startDate ? ` — ${competition.endDate}` : ""}</p><p><MapPin /> {competition.location}</p><div className="profile-disciplines">{competition.disciplines.map((value) => <span key={value}>{value}</span>)}</div><small>Catégories : {competition.categories.join(", ") || "Toutes"}</small>{canManage && competition.status !== "completed" && <button className="button ghost" onClick={() => void updateCompetition(profile, competition.id, { status: "completed" }).then(load)}>Marquer terminée</button>}</article>)}</div>}
  </AppShell>;
}

export default function CompetitionsPage() { return <ProtectedPage><CompetitionsContent /></ProtectedPage>; }
