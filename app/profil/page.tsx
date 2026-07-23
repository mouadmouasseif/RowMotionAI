"use client";

import { useEffect, useState } from "react";
import { KeyRound, LogOut, Save } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { ProfileQrCard } from "@/components/profile/ProfileQrCard";
import { useAuth } from "@/providers/AuthProvider";
import { auth } from "@/lib/firebase";
import { ensureProfileQrCode, updateOwnProfile } from "@/services/user-service";
import type { ProfileDiscipline, ProfileGender, ProfilePrivacySettings } from "@/types/user";

const disciplineOptions: Array<{ value: ProfileDiscipline; label: string }> = [
  { value: "ERGOMETER", label: "Ergomètre" },
  { value: "SKIFF", label: "Skiff / aviron sur l’eau" },
  { value: "BEACH_ROWING", label: "Beach Rowing / Beach Sprint" },
];

function ProfileContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [trainingStartYear, setTrainingStartYear] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState<ProfileGender>("not_specified");
  const [disciplines, setDisciplines] = useState<ProfileDiscipline[]>([]);
  const [primaryDiscipline, setPrimaryDiscipline] = useState<ProfileDiscipline | "">("");
  const [nationality, setNationality] = useState("");
  const [dominantSide, setDominantSide] = useState<"left" | "right" | "ambidextrous" | "">("");
  const [privacy, setPrivacy] = useState<ProfilePrivacySettings>({ qrEnabled: true, qrVisibility: "authenticated", showAge: false, showGender: false, showLicenseNumber: false, showBestPerformances: true });
  const [qrCodeId, setQrCodeId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName); setLastName(profile.lastName); setPhone(profile.phone ?? "");
    setBirthDate(typeof profile.birthDate === "string" ? profile.birthDate : "");
    setTrainingStartYear(profile.trainingStartYear ? String(profile.trainingStartYear) : "");
    setHeight(profile.height ? String(profile.height) : ""); setWeight(profile.weight ? String(profile.weight) : "");
    setGender(profile.gender); setDisciplines(profile.disciplines); setPrimaryDiscipline(profile.primaryDiscipline ?? "");
    setNationality(profile.nationality ?? ""); setDominantSide(profile.dominantSide ?? ""); setPrivacy(profile.privacySettings); setQrCodeId(profile.qrCodeId ?? "");
  }, [profile]);

  if (!profile) return null;
  const toggleDiscipline = (discipline: ProfileDiscipline) => setDisciplines((current) => current.includes(discipline) ? current.filter((item) => item !== discipline) : [...current, discipline]);
  const save = async () => {
    if (profile.role === "athlete" && disciplines.length === 0) { setError("Sélectionnez au moins une discipline."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      await updateOwnProfile(profile.uid, {
        firstName, lastName, phone: phone || null, birthDate: birthDate || null,
        trainingStartYear: trainingStartYear ? Number(trainingStartYear) : null,
        height: height ? Number(height) : null, weight: weight ? Number(weight) : null,
        gender, disciplines, primaryDiscipline: primaryDiscipline || disciplines[0] || null,
        nationality: nationality || null, dominantSide: dominantSide || null, privacySettings: privacy,
      });
      setMessage("Profil complet enregistré.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  };

  return <AppShell title="Mon profil" subtitle="Identité sportive et confidentialité">
    <section className="content-card form-card">
      <ProfilePhotoUploader uid={profile.uid} firstName={profile.firstName} lastName={profile.lastName} initialUrl={profile.profilePhotoUrl} />
      <div className="form-grid">
        <label className="plain-field">Prénom<input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
        <label className="plain-field">Nom<input value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
        <label className="plain-field">E-mail<input value={profile.email} disabled /></label>
        <label className="plain-field">Téléphone<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label className="plain-field">Date de naissance<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
        <label className="plain-field">Année de début d’entraînement<input type="number" min="1950" max={new Date().getFullYear()} value={trainingStartYear} onChange={(event) => setTrainingStartYear(event.target.value)} /></label>
        <label className="plain-field">Taille (cm)<input type="number" min="80" max="250" value={height} onChange={(event) => setHeight(event.target.value)} /></label>
        <label className="plain-field">Poids (kg)<input type="number" min="20" max="300" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} /></label>
        <label className="plain-field">Genre<select value={gender} onChange={(event) => setGender(event.target.value as ProfileGender)}><option value="not_specified">Non renseigné</option><option value="male">Homme</option><option value="female">Femme</option><option value="other">Autre</option></select></label>
        <label className="plain-field">Nationalité<input value={nationality} onChange={(event) => setNationality(event.target.value)} /></label>
        <label className="plain-field">Côté dominant<select value={dominantSide} onChange={(event) => setDominantSide(event.target.value as typeof dominantSide)}><option value="">Non renseigné</option><option value="left">Gauche</option><option value="right">Droit</option><option value="ambidextrous">Ambidextre</option></select></label>
        <label className="plain-field">Catégorie calculée<input value={profile.calculatedCategory ?? profile.category ?? "Non calculée"} disabled /></label>
        <label className="plain-field">Catégorie officielle<input value={profile.officialCategory ?? profile.category ?? "Non définie"} disabled /></label>
      </div>
      {profile.role === "athlete" && <><h2>Disciplines pratiquées</h2><div className="choice-grid">{disciplineOptions.map((option) => <label className={disciplines.includes(option.value) ? "selected" : ""} key={option.value}><input type="checkbox" checked={disciplines.includes(option.value)} onChange={() => toggleDiscipline(option.value)} /><span>{option.label}</span></label>)}</div><label className="plain-field">Discipline principale<select value={primaryDiscipline} onChange={(event) => setPrimaryDiscipline(event.target.value as ProfileDiscipline)}>{disciplines.map((discipline) => <option key={discipline} value={discipline}>{disciplineOptions.find((option) => option.value === discipline)?.label}</option>)}</select></label></>}
      <h2>Confidentialité du QR</h2><div className="form-grid"><label className="toggle-field"><input type="checkbox" checked={privacy.qrEnabled} onChange={(event) => setPrivacy({ ...privacy, qrEnabled: event.target.checked })} />QR activé</label><label className="plain-field">Visibilité<select value={privacy.qrVisibility} onChange={(event) => setPrivacy({ ...privacy, qrVisibility: event.target.value as ProfilePrivacySettings["qrVisibility"] })}><option value="public">Public</option><option value="authenticated">Utilisateurs connectés</option><option value="club_only">Club uniquement</option><option value="coach_only">Coach uniquement</option></select></label><label className="toggle-field"><input type="checkbox" checked={privacy.showAge} onChange={(event) => setPrivacy({ ...privacy, showAge: event.target.checked })} />Afficher l’âge</label><label className="toggle-field"><input type="checkbox" checked={privacy.showGender} onChange={(event) => setPrivacy({ ...privacy, showGender: event.target.checked })} />Afficher le genre</label><label className="toggle-field"><input type="checkbox" checked={privacy.showLicenseNumber} onChange={(event) => setPrivacy({ ...privacy, showLicenseNumber: event.target.checked })} />Afficher la licence</label><label className="toggle-field"><input type="checkbox" checked={privacy.showBestPerformances} onChange={(event) => setPrivacy({ ...privacy, showBestPerformances: event.target.checked })} />Afficher les performances</label></div>
      {message && <div className="notice-card">{message}</div>}{error && <div className="error-card">{error}</div>}
      <div className="page-actions"><button className="button primary" disabled={busy} onClick={() => void save()}><Save />{busy ? "Enregistrement…" : "Enregistrer"}</button><button className="button ghost" onClick={() => { if (auth) void sendPasswordResetEmail(auth, profile.email).then(() => setMessage("E-mail de réinitialisation envoyé.")); }}><KeyRound />Changer le mot de passe</button><button className="button ghost" onClick={async () => { await logout(); router.replace("/"); }}><LogOut />Déconnexion</button></div>
    </section>
    {privacy.qrEnabled && (qrCodeId ? <ProfileQrCard qrCodeId={qrCodeId} onRegenerate={async () => { const next = await ensureProfileQrCode(profile.uid); setQrCodeId(next); return next; }} /> : <section className="content-card"><button className="button primary" onClick={() => void ensureProfileQrCode(profile.uid).then(setQrCodeId)}>Créer mon QR sécurisé</button></section>)}
  </AppShell>;
}

export default function ProfilePage() { return <ProtectedPage><ProfileContent /></ProtectedPage>; }
