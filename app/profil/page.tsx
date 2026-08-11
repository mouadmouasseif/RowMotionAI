"use client";

import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Edit3, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { ProfileQrCard } from "@/components/profile/ProfileQrCard";
import { DATA_UNAVAILABLE, numberOrUnavailable, textOrUnavailable } from "@/lib/data-availability";
import { displayAge } from "@/lib/user-profile";
import { useAuth } from "@/providers/AuthProvider";
import { ensureProfileQrCode, updateOwnProfile } from "@/services/user-service";
import type { ProfileDiscipline, ProfileGender, ProfilePrivacySettings } from "@/types/user";

const disciplines: ProfileDiscipline[] = ["ERGOMETER", "SKIFF", "BEACH_ROWING"];

function formatBirthDate(value: unknown) {
  return typeof value === "string" && value.trim() ? value : DATA_UNAVAILABLE;
}

function ProfileContent() {
  const { profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [qr, setQr] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    trainingStartYear: "",
    height: "",
    weight: "",
    gender: "not_specified" as ProfileGender,
    nationality: "",
    dominantSide: "" as "" | "left" | "right" | "ambidextrous",
    disciplines: [] as ProfileDiscipline[],
    primaryDiscipline: "" as "" | ProfileDiscipline,
    privacy: {
      qrEnabled: true,
      qrVisibility: "authenticated",
      showAge: false,
      showGender: false,
      showLicenseNumber: false,
      showBestPerformances: true,
    } as ProfilePrivacySettings,
  });

  useEffect(() => {
    if (!profile) return;
    setQr(profile.qrCodeId ?? "");
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? "",
      birthDate: typeof profile.birthDate === "string" ? profile.birthDate : "",
      trainingStartYear: profile.trainingStartYear ? String(profile.trainingStartYear) : "",
      height: profile.height ? String(profile.height) : "",
      weight: profile.weight ? String(profile.weight) : "",
      gender: profile.gender,
      nationality: profile.nationality ?? "",
      dominantSide: profile.dominantSide ?? "",
      disciplines: profile.disciplines,
      primaryDiscipline: profile.primaryDiscipline ?? "",
      privacy: profile.privacySettings,
    });
  }, [profile]);

  if (!profile) return null;

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await updateOwnProfile(profile.uid, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        birthDate: form.birthDate || null,
        trainingStartYear: form.trainingStartYear ? Number(form.trainingStartYear) : null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        gender: form.gender,
        nationality: form.nationality || null,
        dominantSide: form.dominantSide || null,
        disciplines: form.disciplines,
        primaryDiscipline: form.primaryDiscipline || form.disciplines[0] || null,
        privacySettings: form.privacy,
      });
      setMessage("Profil enregistre.");
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <AppShell referenceMode title="Modifier mon profil" subtitle="Mettez a jour vos informations disponibles dans Firebase." headerActions={<button className="button ghost" onClick={() => setEditing(false)}>Annuler</button>}>
        <section className="profile-edit-reference">
          <ProfilePhotoUploader uid={profile.uid} firstName={form.firstName} lastName={form.lastName} initialUrl={profile.profilePhotoUrl} />
          <div className="profile-edit-grid">
            {[
              ["Prenom", "firstName", "text"],
              ["Nom", "lastName", "text"],
              ["Telephone", "phone", "text"],
              ["Date de naissance", "birthDate", "date"],
              ["Annee de debut", "trainingStartYear", "number"],
              ["Taille (cm)", "height", "number"],
              ["Poids (kg)", "weight", "number"],
              ["Nationalite", "nationality", "text"],
            ].map(([label, key, type]) => (
              <label key={key}>{label}<input type={type} value={String(form[key as keyof typeof form])} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>
            ))}
            <label>Genre<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as ProfileGender })}><option value="not_specified">data non dispo</option><option value="male">Homme</option><option value="female">Femme</option><option value="other">Autre</option></select></label>
            <label>Main dominante<select value={form.dominantSide} onChange={(event) => setForm({ ...form, dominantSide: event.target.value as typeof form.dominantSide })}><option value="">data non dispo</option><option value="right">Droite</option><option value="left">Gauche</option><option value="ambidextrous">Ambidextre</option></select></label>
          </div>
          <h2>Disciplines</h2>
          <div className="profile-discipline-edit">
            {disciplines.map((item) => <label key={item}><input type="checkbox" checked={form.disciplines.includes(item)} onChange={() => setForm({ ...form, disciplines: form.disciplines.includes(item) ? form.disciplines.filter((value) => value !== item) : [...form.disciplines, item] })} />{item}</label>)}
          </div>
          <h2>Confidentialite QR</h2>
          <div className="profile-discipline-edit">
            <label><input type="checkbox" checked={form.privacy.qrEnabled} onChange={(event) => setForm({ ...form, privacy: { ...form.privacy, qrEnabled: event.target.checked } })} />QR active</label>
            <label><input type="checkbox" checked={form.privacy.showAge} onChange={(event) => setForm({ ...form, privacy: { ...form.privacy, showAge: event.target.checked } })} />Afficher l&apos;age</label>
            <label><input type="checkbox" checked={form.privacy.showBestPerformances} onChange={(event) => setForm({ ...form, privacy: { ...form.privacy, showBestPerformances: event.target.checked } })} />Afficher les performances</label>
          </div>
          {error && <div className="error-card">{error}</div>}
          <button className="button primary" disabled={busy} onClick={() => void save()}><Save />{busy ? "Enregistrement..." : "Enregistrer"}</button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell referenceMode title="Mon Profil" subtitle="Donnees chargees depuis Firebase." headerActions={<><button className="button ghost" onClick={() => setEditing(true)}><Edit3 />Modifier le profil</button><button className="reference-more" aria-label="Modifier la photo" onClick={() => setEditing(true)}><Camera /></button></>}>
      <div className="profile-reference">
        <nav className="directory-tabs"><button className="active">Profil</button><button>Performances</button><button>Statistiques</button><button>Historique</button><button>Parametres</button></nav>
        {message && <div className="notice-card">{message}</div>}
        <section className="profile-reference-top">
          <article className="profile-identity-card">
            <ProfilePhotoUploader uid={profile.uid} firstName={profile.firstName} lastName={profile.lastName} initialUrl={profile.profilePhotoUrl} />
            <div>
              <h2>{textOrUnavailable(`${profile.firstName} ${profile.lastName}`)} <ShieldCheck /></h2>
              <p>{profile.role === "ATHLETE" ? "Athlete" : profile.role}</p>
              <ul>
                <li><UserRound />Age <strong>{displayAge(profile) == null ? DATA_UNAVAILABLE : `${displayAge(profile)} ans`}</strong></li>
                <li><CheckCircle2 />Compte <strong>{profile.active ? "actif" : "inactif"}</strong></li>
                <li><Mail />Email <strong>{textOrUnavailable(profile.email)}</strong></li>
                <li><Phone />Telephone <strong>{textOrUnavailable(profile.phone)}</strong></li>
              </ul>
            </div>
          </article>
          {form.privacy.qrEnabled && qr ? (
            <ProfileQrCard qrCodeId={qr} onRegenerate={async () => { const next = await ensureProfileQrCode(profile.uid); setQr(next); return next; }} />
          ) : (
            <article className="profile-qr-empty"><h2>Mon code QR</h2><p>{DATA_UNAVAILABLE}</p><button className="button primary" onClick={() => void ensureProfileQrCode(profile.uid).then(setQr)}>Creer mon QR securise</button></article>
          )}
        </section>
        <section className="profile-reference-duo">
          <article>
            <h2>Informations sportives</h2>
            {[
              ["Numero de licence", textOrUnavailable(profile.licenseNumber)],
              ["Club", textOrUnavailable(profile.clubId)],
              ["Categorie", textOrUnavailable(profile.officialCategory ?? profile.calculatedCategory ?? profile.category)],
              ["Poids", numberOrUnavailable(profile.weight, (value) => `${value} kg`)],
              ["Taille", numberOrUnavailable(profile.height, (value) => `${(value / 100).toFixed(2)} m`)],
            ].map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}
          </article>
          <article className="profile-club-card"><h2>Club</h2><div><span className="club-big-logo">RM</span><p><strong>{textOrUnavailable(profile.clubId)}</strong><em>{DATA_UNAVAILABLE}</em><small>{DATA_UNAVAILABLE}</small><button>Voir le profil du club</button></p></div></article>
        </section>
        <section className="profile-personal-summary">
          <div className="reference-card-title"><h2>Resume personnel</h2><select><option>Firebase</option></select></div>
          <div>{["Seances completees", "Distance totale", "Temps total", "Puissance moyenne", "Score technique"].map((label) => <span key={label}><small>{label}</small><strong>{DATA_UNAVAILABLE}</strong><em>{DATA_UNAVAILABLE}</em></span>)}</div>
        </section>
        <section className="profile-reference-duo profile-lower">
          <article><h2>Photos</h2><div className="profile-gallery"><span><Camera /></span></div><button className="add-photo" onClick={() => setEditing(true)}>Ajouter une photo</button></article>
          <article>
            <h2>Informations supplementaires</h2>
            {[
              ["Main dominante", profile.dominantSide ? profile.dominantSide : DATA_UNAVAILABLE],
              ["Date de naissance", formatBirthDate(profile.birthDate)],
              ["Pays", textOrUnavailable(profile.nationality)],
              ["Langues parlees", DATA_UNAVAILABLE],
              ["Niveau", textOrUnavailable(profile.level)],
              ["Objectif principal", DATA_UNAVAILABLE],
              ["Ergometre prefere", DATA_UNAVAILABLE],
            ].map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}
          </article>
        </section>
        <section className="profile-about"><h2>A propos de moi</h2><p>{DATA_UNAVAILABLE}</p></section>
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  return <ProtectedPage><ProfileContent /></ProtectedPage>;
}
