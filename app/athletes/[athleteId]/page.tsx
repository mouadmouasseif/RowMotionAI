"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Clock3, Edit3, FileVideo, Medal, Save, Trophy, Waves } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { ProfileQrCard } from "@/components/profile/ProfileQrCard";
import { DATA_UNAVAILABLE, numberOrUnavailable, textOrUnavailable } from "@/lib/data-availability";
import { displayAge } from "@/lib/user-profile";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses } from "@/services/analysis-service";
import { listAthletes, listPersonalBests, updateManagedAthleteProfile } from "@/services/user-service";
import type { RowingAnalysis } from "@/types/analysis";
import type { AthleteBestPerformance } from "@/types/athlete";
import type { ProfileCategory, ProfileDiscipline, UserProfile } from "@/types/user";
import type { LucideIcon } from "lucide-react";

const disciplineLabels: Record<ProfileDiscipline, string> = {
  ERGOMETER: "Ergometre",
  SKIFF: "Skiff",
  BEACH_ROWING: "Beach Rowing",
};
const categories: ProfileCategory[] = ["U15", "U19", "U21", "U23", "SENIOR"];
const statCards: Array<[LucideIcon, string, string | number]> = [
  [FileVideo, "Analyses realisees", 0],
  [BarChart3, "Score technique moyen", DATA_UNAVAILABLE],
  [Waves, "Distance totale analysee", DATA_UNAVAILABLE],
  [Clock3, "Heures d'entrainement", DATA_UNAVAILABLE],
  [Trophy, "Classement club", DATA_UNAVAILABLE],
];

function AthleteProfile({ id }: { id: string }) {
  const { profile } = useAuth();
  const [athlete, setAthlete] = useState<UserProfile | null>(null);
  const [analyses, setAnalyses] = useState<RowingAnalysis[]>([]);
  const [bests, setBests] = useState<AthleteBestPerformance[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<ProfileCategory | "">("");
  const [status, setStatus] = useState<UserProfile["sportStatus"]>("active");
  const [selected, setSelected] = useState<ProfileDiscipline[]>([]);

  const reload = useCallback(async (manager: UserProfile) => {
    const [users, rows, performances] = await Promise.all([
      listAthletes(manager),
      listAnalyses(manager),
      listPersonalBests(id),
    ]);
    const found = users.find((item) => item.uid === id) ?? null;
    setAthlete(found);
    setAnalyses(rows.filter((row) => row.athleteId === id));
    setBests(performances);
    if (found) {
      setCategory(found.officialCategory ?? "");
      setStatus(found.sportStatus);
      setSelected(found.disciplines);
    }
  }, [id]);

  useEffect(() => {
    if (profile) void reload(profile).catch(() => setError("Profil athlete introuvable."));
  }, [profile, reload]);

  const average = useMemo(() => {
    const scores = analyses.map((row) => row.technicalScore).filter((value): value is number => value != null);
    return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
  }, [analyses]);

  if (!profile) return null;

  const save = async () => {
    if (!athlete || !selected.length) return;
    try {
      await updateManagedAthleteProfile(profile, athlete.uid, {
        officialCategory: category || null,
        disciplines: selected,
        primaryDiscipline: selected[0],
        sportStatus: status,
      });
      await reload(profile);
      setEditing(false);
      setMessage("Profil athlete mis a jour.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    }
  };

  return (
    <AppShell
      referenceMode
      title="Profil de l'athlete"
      subtitle="Donnees chargees depuis Firebase."
      headerActions={
        <>
          <Link className="button ghost" href="/athletes"><ArrowLeft />Retour a la liste</Link>
          {editing ? (
            <button className="button primary" onClick={() => void save()}><Save />Enregistrer</button>
          ) : (
            <button className="button primary" onClick={() => setEditing(true)}><Edit3 />Modifier le profil</button>
          )}
        </>
      }
    >
      <div className="entity-profile athlete-profile-reference">
        {error && <div className="error-card">{error}</div>}
        {message && <div className="notice-card">{message}</div>}
        {!athlete ? (
          <div className="loading-card">Chargement...</div>
        ) : (
          <>
            <section className="athlete-profile-hero">
              <div className="athlete-photo-column">
                <ProfilePhotoUploader
                  uid={athlete.uid}
                  firstName={athlete.firstName}
                  lastName={athlete.lastName}
                  initialUrl={athlete.profilePhotoUrl}
                  onChange={(profilePhotoUrl) => setAthlete({ ...athlete, profilePhotoUrl })}
                />
                {athlete.qrCodeId && athlete.privacySettings.qrEnabled && <ProfileQrCard qrCodeId={athlete.qrCodeId} />}
              </div>
              <div>
                {editing ? (
                  <div className="entity-edit-grid">
                    <label>Categorie<select value={category} onChange={(event) => setCategory(event.target.value as ProfileCategory)}><option value="">data non dispo</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label>Statut<select value={status} onChange={(event) => setStatus(event.target.value as UserProfile["sportStatus"])}><option value="active">Actif</option><option value="injured">Blesse</option><option value="inactive">Inactif</option><option value="archived">Archive</option></select></label>
                    <fieldset>{Object.entries(disciplineLabels).map(([value, label]) => <label key={value}><input type="checkbox" checked={selected.includes(value as ProfileDiscipline)} onChange={() => setSelected((current) => current.includes(value as ProfileDiscipline) ? current.filter((item) => item !== value) : [...current, value as ProfileDiscipline])} />{label}</label>)}</fieldset>
                  </div>
                ) : (
                  <>
                    <h2>{textOrUnavailable(`${athlete.firstName} ${athlete.lastName}`)}</h2>
                    <p>Athlete - <em>{athlete.active ? "Compte actif" : "Compte inactif"}</em></p>
                    <ul>
                      <li>Age <strong>{displayAge(athlete) == null ? DATA_UNAVAILABLE : `${displayAge(athlete)} ans`}</strong></li>
                      <li>Genre <strong>{athlete.gender === "female" ? "Femme" : athlete.gender === "male" ? "Homme" : DATA_UNAVAILABLE}</strong></li>
                      <li>Email <strong>{textOrUnavailable(athlete.email)}</strong></li>
                      <li>Telephone <strong>{textOrUnavailable(athlete.phone)}</strong></li>
                    </ul>
                    <div className="athlete-body-stats">
                      <span><small>Poids</small><strong>{numberOrUnavailable(athlete.weight, (value) => `${value} kg`)}</strong></span>
                      <span><small>Taille</small><strong>{numberOrUnavailable(athlete.height, (value) => `${(value / 100).toFixed(2)} m`)}</strong></span>
                      <span><small>IMC</small><strong>{DATA_UNAVAILABLE}</strong></span>
                    </div>
                  </>
                )}
              </div>
              <aside>
                <h3>Club</h3>
                <div className="club-big-logo">RM</div>
                <p>{textOrUnavailable(athlete.clubId)}</p>
                <p>Categorie <strong>{textOrUnavailable(athlete.officialCategory ?? athlete.calculatedCategory ?? athlete.category)}</strong></p>
                <p>Numero de licence <strong>{textOrUnavailable(athlete.licenseNumber)}</strong></p>
                <p>Nationalite <strong>{textOrUnavailable(athlete.nationality)}</strong></p>
              </aside>
            </section>

            <nav className="directory-tabs athlete-profile-tabs">
              <button>Muscle & Power</button><button className="active">Resume</button><button>Performances</button><button>Analyses</button><button>Progression</button><button>Seances</button><button>Plans d&apos;entrainement</button><button>Historique</button>
            </nav>

            <section className="entity-stats five">
              {statCards.map(([Icon, label, defaultValue]) => {
                const value = label === "Analyses realisees"
                  ? analyses.length
                  : label === "Score technique moyen" && average != null
                    ? `${(average / 10).toFixed(1)}/10`
                    : defaultValue;
                return (
                <article key={String(label)}><Icon /><span><small>{label}</small><strong>{value}</strong><em>Donnees Firebase</em></span></article>
                );
              })}
            </section>

            <div className="athlete-profile-grid">
              <section>
                <h2>Informations personnelles</h2>
                {[
                  ["Date de naissance", typeof athlete.birthDate === "string" ? athlete.birthDate : DATA_UNAVAILABLE],
                  ["Lieu de naissance", DATA_UNAVAILABLE],
                  ["Specialites", athlete.disciplines.map((item) => disciplineLabels[item]).join(", ") || DATA_UNAVAILABLE],
                  ["Bras dominant", athlete.dominantSide === "left" ? "Gaucher" : athlete.dominantSide === "right" ? "Droitier" : DATA_UNAVAILABLE],
                  ["Niveau", textOrUnavailable(athlete.level)],
                  ["Scolarite / Etudes", DATA_UNAVAILABLE],
                  ["Objectifs", DATA_UNAVAILABLE],
                ].map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}
              </section>

              <section className="athlete-chart-card">
                <div className="reference-card-title"><h2>Evolution du score technique</h2><select><option>Firebase</option></select></div>
                <p>{average == null ? DATA_UNAVAILABLE : `${(average / 10).toFixed(1)}/10`}</p>
                <em>{DATA_UNAVAILABLE}</em>
              </section>

              <section className="athlete-muscle-power-card">
                <div className="reference-card-title"><h2>Muscle & Power</h2><small>Exploration biomecanique</small></div>
                <div className="joint-range-grid">{["Genou", "Hanche", "Tronc", "Coude", "Epaule", "Poignet"].map((joint) => <article key={joint}><strong>{joint}</strong><span>Min : {DATA_UNAVAILABLE}</span><span>Max : {DATA_UNAVAILABLE}</span><span>Amplitude : {DATA_UNAVAILABLE}</span></article>)}</div>
                <p>{DATA_UNAVAILABLE}</p>
                <small>{DATA_UNAVAILABLE}</small>
              </section>

              <section>
                <div className="reference-card-title"><h2>Meilleures performances</h2><a>Voir tout</a></div>
                {(bests.length ? bests.slice(0, 5).map((item) => [item.testOrEvent, `${item.value} ${item.unit}`]) : [[DATA_UNAVAILABLE, DATA_UNAVAILABLE]]).map(([label, value]) => <p key={String(label)}><Medal /><span>{label}</span><strong>{value}</strong></p>)}
              </section>

              <section>
                <div className="reference-card-title"><h2>Analyses recentes</h2><a>Voir tout</a></div>
                {analyses.length ? analyses.slice(0, 4).map((row) => (
                  <Link className="athlete-analysis-row" key={row.id} href={`/analyses/${row.id}`}>
                    <Waves /><span><strong>{row.fileName || row.athleteName || DATA_UNAVAILABLE}</strong><small>{DATA_UNAVAILABLE}</small></span><em>{row.technicalScore == null ? DATA_UNAVAILABLE : (row.technicalScore / 10).toFixed(1)}</em>
                  </Link>
                )) : <p>{DATA_UNAVAILABLE}</p>}
              </section>

              <section>
                <h2>Statut actuel</h2>
                {[
                  ["Statut du compte", athlete.active ? "Actif" : "Inactif"],
                  ["Derniere connexion", DATA_UNAVAILABLE],
                  ["Depuis", DATA_UNAVAILABLE],
                  ["Role", "Athlete"],
                  ["Coach associe", textOrUnavailable(athlete.coachId)],
                  ["Groupe", DATA_UNAVAILABLE],
                ].map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function AthleteProfilePage({ params }: { params: Promise<{ athleteId: string }> }) {
  const { athleteId } = use(params);
  return <ProtectedPage allowedRoles={["COACH", "CLUB_ADMIN", "SUPER_ADMIN"]}><AthleteProfile id={athleteId} /></ProtectedPage>;
}
