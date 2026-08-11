"use client";

import { use, useEffect, useMemo, useState } from "react";
import { BarChart3, Building2, CalendarDays, Edit3, Mail, Save, Share2, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { ProfileQrCard } from "@/components/profile/ProfileQrCard";
import { DATA_UNAVAILABLE, textOrUnavailable } from "@/lib/data-availability";
import { displayAge } from "@/lib/user-profile";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses } from "@/services/analysis-service";
import { updateCoachProfile } from "@/services/profile-management-service";
import { listAthletes, listCoaches } from "@/services/user-service";
import type { LucideIcon } from "lucide-react";
import type { UserProfile } from "@/types/user";

const coachStatCards: Array<[LucideIcon, string, string | number]> = [
  [Users, "Athletes entraines", 0],
  [Building2, "Clubs encadres", DATA_UNAVAILABLE],
  [BarChart3, "Analyses realisees", 0],
  [CalendarDays, "Plans crees", DATA_UNAVAILABLE],
  [Trophy, "Seances encadrees", DATA_UNAVAILABLE],
];

function CoachProfile({ coachId }: { coachId: string }) {
  const { profile } = useAuth();
  const [coach, setCoach] = useState<UserProfile | null>(null);
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", specialty: "", licenseNumber: "", active: true });

  useEffect(() => {
    if (!profile) return;
    void Promise.all([listCoaches(profile), listAthletes(profile), listAnalyses(profile)])
      .then(([coaches, users, analyses]) => {
        const found = coaches.find((item) => item.uid === coachId) ?? null;
        setCoach(found);
        setAthletes(users.filter((item) => item.coachId === coachId || item.coachIds?.includes(coachId)));
        setAnalysisCount(analyses.filter((item) => item.coachId === coachId || item.createdBy === coachId).length);
        if (found) setForm({ firstName: found.firstName, lastName: found.lastName, phone: found.phone ?? "", specialty: found.specialty ?? "", licenseNumber: found.licenseNumber ?? "", active: found.active });
      })
      .catch(() => setError("Profil coach introuvable."));
  }, [coachId, profile]);

  const averageScore = useMemo(() => {
    const scores = athletes.length ? [] : [];
    return scores.length ? DATA_UNAVAILABLE : DATA_UNAVAILABLE;
  }, [athletes.length]);

  if (!profile) return null;

  const save = async () => {
    if (!coach) return;
    try {
      await updateCoachProfile(profile, coach, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        specialty: form.specialty || null,
        licenseNumber: form.licenseNumber || null,
        active: form.active,
      });
      setCoach({ ...coach, ...form, phone: form.phone || null, specialty: form.specialty || null, licenseNumber: form.licenseNumber || null });
      setEditing(false);
      setMessage("Profil coach mis a jour.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    }
  };

  return (
    <AppShell
      referenceMode
      title="Profil du coach"
      subtitle="Donnees chargees depuis Firebase."
      headerActions={
        <>
          {editing ? <button className="button primary" onClick={() => void save()}><Save />Enregistrer</button> : <button className="button primary" onClick={() => setEditing(true)}><Edit3 />Modifier le profil</button>}
          <button className="button ghost"><Share2 />Partager</button>
        </>
      }
    >
      <div className="entity-profile coach-profile-reference">
        {error && <div className="error-card">{error}</div>}
        {message && <div className="notice-card">{message}</div>}
        {!coach ? (
          <div className="loading-card">Chargement...</div>
        ) : (
          <>
            <section className="coach-profile-hero">
              <div className="coach-photo-column">
                <ProfilePhotoUploader uid={coach.uid} firstName={coach.firstName} lastName={coach.lastName} initialUrl={coach.profilePhotoUrl} onChange={(profilePhotoUrl) => setCoach({ ...coach, profilePhotoUrl })} />
                {coach.qrCodeId && coach.privacySettings.qrEnabled && <ProfileQrCard qrCodeId={coach.qrCodeId} />}
              </div>
              <div>
                {editing ? (
                  <div className="entity-edit-grid">
                    {(["firstName", "lastName", "phone", "specialty", "licenseNumber"] as const).map((key) => <label key={key}>{key}<input value={String(form[key])} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
                    <label>Statut<select value={form.active ? "active" : "inactive"} onChange={(event) => setForm({ ...form, active: event.target.value === "active" })}><option value="active">Actif</option><option value="inactive">Inactif</option></select></label>
                  </div>
                ) : (
                  <>
                    <h2>{textOrUnavailable(`${coach.firstName} ${coach.lastName}`)}</h2>
                    <p>{textOrUnavailable(coach.specialty)} - <em>{coach.active ? "Compte actif" : "Compte inactif"}</em></p>
                    <ul>
                      <li>Age <strong>{displayAge(coach) == null ? DATA_UNAVAILABLE : `${displayAge(coach)} ans`}</strong></li>
                      <li><Mail />Email <strong>{textOrUnavailable(coach.email)}</strong></li>
                      <li>Telephone <strong>{textOrUnavailable(coach.phone)}</strong></li>
                      <li>Nationalite <strong>{textOrUnavailable(coach.nationality)}</strong></li>
                      <li>Adresse <strong>{DATA_UNAVAILABLE}</strong></li>
                      <li>Langues <strong>{DATA_UNAVAILABLE}</strong></li>
                    </ul>
                  </>
                )}
              </div>
              <aside>
                <h3>Club principal <em>{coach.clubId ? "Firebase" : DATA_UNAVAILABLE}</em></h3>
                <span className="club-big-logo">RM</span>
                <h2>{textOrUnavailable(coach.clubId)}</h2>
                <p>{DATA_UNAVAILABLE}</p>
                <hr />
                <h3>Annees d&apos;experience</h3>
                <strong>{DATA_UNAVAILABLE}</strong>
              </aside>
            </section>

            <section className="entity-stats five">
              {coachStatCards.map(([Icon, label, defaultValue]) => {
                const value = label === "Athletes entraines"
                  ? athletes.length
                  : label === "Clubs encadres"
                    ? coach.clubId ? 1 : DATA_UNAVAILABLE
                    : label === "Analyses realisees"
                      ? analysisCount
                      : defaultValue;
                return <article key={String(label)}><Icon /><span><small>{label}</small><strong>{value}</strong><em>Donnees Firebase</em></span></article>;
              })}
            </section>

            <div className="coach-profile-grid">
              <section><h2>Specialites d&apos;entrainement</h2><p>{textOrUnavailable(coach.specialty)}</p></section>
              <section className="coach-performance-summary"><h2>Resume des performances</h2><div>{[["Score moyen", averageScore], ["Progression", DATA_UNAVAILABLE], ["Victoires", DATA_UNAVAILABLE], ["Classement", DATA_UNAVAILABLE]].map(([label, value]) => <span key={label}><strong>{value}</strong><small>{label}</small></span>)}</div></section>
              <section><h2>Mes athletes</h2>{athletes.length ? athletes.slice(0, 5).map((athlete) => <p key={athlete.uid}><ProfileAvatar photoUrl={athlete.profilePhotoUrl} firstName={athlete.firstName} lastName={athlete.lastName} />{athlete.firstName} {athlete.lastName}<strong>{DATA_UNAVAILABLE}</strong></p>) : <p>{DATA_UNAVAILABLE}</p>}</section>
              <section><h2>Activite recente</h2><p>{DATA_UNAVAILABLE}</p></section>
              <section><h2>Prochains rendez-vous</h2><p>{DATA_UNAVAILABLE}</p></section>
              <section><h2>Certifications & formations</h2><p>{DATA_UNAVAILABLE}</p></section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function CoachProfilePage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = use(params);
  return <ProtectedPage allowedRoles={["CLUB_ADMIN", "SUPER_ADMIN"]}><CoachProfile coachId={coachId} /></ProtectedPage>;
}
