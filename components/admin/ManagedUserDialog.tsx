"use client";

import { useMemo, useState } from "react";
import { Save, X } from "lucide-react";
import { toDate } from "@/lib/user-profile";
import { updateManagedUser, type ManagedUserValues } from "@/services/admin-management-service";
import type { Club } from "@/types/club";
import type { ProfileDiscipline, ProfileGender, UserProfile } from "@/types/user";

const disciplineLabels: Record<ProfileDiscipline, string> = {
  ERGOMETER: "Ergomètre",
  SKIFF: "Skiff",
  BEACH_ROWING: "Beach Rowing",
};
const disciplines = Object.keys(disciplineLabels) as ProfileDiscipline[];

function dateInputValue(value: unknown) {
  const date = toDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function numberValue(value: number | null) {
  return value === null ? "" : String(value);
}

export function ManagedUserDialog({
  user,
  clubs,
  coaches,
  onClose,
  onSaved,
}: {
  user: UserProfile;
  clubs: Club[];
  coaches: UserProfile[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [form, setForm] = useState({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? "",
    birthDate: dateInputValue(user.birthDate),
    licenseNumber: user.licenseNumber ?? "",
    trainingStartYear: numberValue(user.trainingStartYear),
    specialty: user.specialty ?? "",
    category: user.category ?? "",
    officialCategory: user.officialCategory ?? "",
    level: user.level ?? "",
    height: numberValue(user.height),
    weight: numberValue(user.weight),
    gender: user.gender,
    primaryDiscipline: user.primaryDiscipline ?? "",
    nationality: user.nationality ?? "",
    dominantSide: user.dominantSide ?? "",
    sportStatus: user.sportStatus,
    active: user.active,
    clubId: user.clubId ?? "",
    coachId: user.coachId ?? "",
  });
  const [selectedDisciplines, setSelectedDisciplines] = useState<ProfileDiscipline[]>(
    user.disciplines,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const availableCoaches = useMemo(
    () => coaches.filter((coach) => coach.clubId === form.clubId),
    [coaches, form.clubId],
  );
  const update = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const optionalNumber = (value: string) => (value.trim() ? Number(value) : null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values: ManagedUserValues = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
        birthDate: form.birthDate || null,
        licenseNumber: form.licenseNumber.trim() || null,
        trainingStartYear: optionalNumber(form.trainingStartYear),
        specialty: form.specialty.trim() || null,
        category: form.category.trim() || null,
        officialCategory: form.officialCategory.trim() || null,
        level: form.level.trim() || null,
        height: optionalNumber(form.height),
        weight: optionalNumber(form.weight),
        gender: form.gender as ProfileGender,
        disciplines: selectedDisciplines,
        primaryDiscipline:
          selectedDisciplines.includes(form.primaryDiscipline as ProfileDiscipline)
            ? (form.primaryDiscipline as ProfileDiscipline)
            : selectedDisciplines[0] ?? null,
        nationality: form.nationality.trim() || null,
        dominantSide:
          form.dominantSide === "left" ||
          form.dominantSide === "right" ||
          form.dominantSide === "ambidextrous"
            ? form.dominantSide
            : null,
        sportStatus: form.sportStatus as UserProfile["sportStatus"],
        active: form.active,
        clubId: form.clubId || null,
        coachId: user.role === "ATHLETE" ? form.coachId || null : null,
      };
      await updateManagedUser(user.uid, values);
      await onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="managed-user-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="managed-user-title">
              Modifier {user.role === "ATHLETE" ? "l’athlète" : "le coach"}
            </h2>
            <p>Toutes les informations et affectations sont modifiables par le Super administrateur.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="admin-form-grid">
            <label>Prénom<input required value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></label>
            <label>Nom<input required value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></label>
            <label className="wide">Adresse e-mail<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></label>
            <label>Téléphone<input value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
            <label>Date de naissance<input type="date" value={form.birthDate} onChange={(event) => update("birthDate", event.target.value)} /></label>
            <label>Numéro de licence<input value={form.licenseNumber} onChange={(event) => update("licenseNumber", event.target.value)} /></label>
            <label>Nationalité<input value={form.nationality} onChange={(event) => update("nationality", event.target.value)} /></label>
            <label>Genre<select value={form.gender} onChange={(event) => update("gender", event.target.value as ProfileGender)}><option value="not_specified">Non renseigné</option><option value="male">Homme</option><option value="female">Femme</option><option value="other">Autre</option></select></label>
            <label>Niveau<input value={form.level} onChange={(event) => update("level", event.target.value)} /></label>
            <label>Club<select value={form.clubId} onChange={(event) => setForm((current) => ({ ...current, clubId: event.target.value, coachId: "" }))}><option value="">Sans club</option>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
            {user.role === "ATHLETE" && (
              <>
                <label>Coach affecté<select value={form.coachId} disabled={!form.clubId} onChange={(event) => update("coachId", event.target.value)}><option value="">Sans coach</option>{availableCoaches.map((coach) => <option value={coach.uid} key={coach.uid}>{coach.firstName} {coach.lastName}</option>)}</select></label>
                <label>Catégorie officielle<select value={form.officialCategory} onChange={(event) => update("officialCategory", event.target.value)}><option value="">Catégorie calculée</option>{["U15", "U19", "U21", "U23", "SENIOR"].map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>Poids (kg)<input min="0" step="0.1" type="number" value={form.weight} onChange={(event) => update("weight", event.target.value)} /></label>
                <label>Taille (cm)<input min="0" step="1" type="number" value={form.height} onChange={(event) => update("height", event.target.value)} /></label>
                <label>Année de début<input min="1900" max="2100" type="number" value={form.trainingStartYear} onChange={(event) => update("trainingStartYear", event.target.value)} /></label>
                <label>Côté dominant<select value={form.dominantSide} onChange={(event) => update("dominantSide", event.target.value)}><option value="">Non renseigné</option><option value="right">Droitier</option><option value="left">Gaucher</option><option value="ambidextrous">Ambidextre</option></select></label>
                <label>Statut sportif<select value={form.sportStatus} onChange={(event) => update("sportStatus", event.target.value as UserProfile["sportStatus"])}><option value="active">Actif</option><option value="injured">Blessé</option><option value="inactive">Inactif</option><option value="archived">Archivé</option></select></label>
              </>
            )}
            {user.role === "COACH" && (
              <label className="wide">Spécialité<input value={form.specialty} onChange={(event) => update("specialty", event.target.value)} /></label>
            )}
            <label>Compte<select value={form.active ? "active" : "inactive"} onChange={(event) => update("active", event.target.value === "active")}><option value="active">Actif</option><option value="inactive">Inactif</option></select></label>
            <fieldset className="wide">
              <legend>Disciplines</legend>
              {disciplines.map((discipline) => (
                <label key={discipline}>
                  <input
                    type="checkbox"
                    checked={selectedDisciplines.includes(discipline)}
                    onChange={() =>
                      setSelectedDisciplines((current) =>
                        current.includes(discipline)
                          ? current.filter((item) => item !== discipline)
                          : [...current, discipline],
                      )
                    }
                  />
                  {disciplineLabels[discipline]}
                </label>
              ))}
            </fieldset>
            {selectedDisciplines.length > 0 && (
              <label>Discipline principale<select value={form.primaryDiscipline} onChange={(event) => update("primaryDiscipline", event.target.value)}>{selectedDisciplines.map((discipline) => <option key={discipline} value={discipline}>{disciplineLabels[discipline]}</option>)}</select></label>
            )}
          </div>
          {error && <div className="error-card">{error}</div>}
          <footer>
            <button className="button ghost" type="button" onClick={onClose}>Annuler</button>
            <button className="button primary" disabled={busy}><Save />{busy ? "Enregistrement…" : "Enregistrer toutes les modifications"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
