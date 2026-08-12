"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { createManagedUser } from "@/services/admin-management-service";
import type { Club } from "@/types/club";
import type { UserProfile, UserRole } from "@/types/user";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "ATHLETE", label: "Athlete" },
  { value: "COACH", label: "Coach" },
  { value: "JURY", label: "Jury / Jure" },
  { value: "CLUB_ADMIN", label: "Admin club" },
  { value: "TECHNICAL_DIRECTOR", label: "Directeur technique" },
  { value: "FEDERATION_PRESIDENT", label: "President de federation" },
  { value: "SUPER_ADMIN", label: "Admin super" },
];

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? Number(text) : null;
}

export function CreateManagedUserDialog({
  clubs,
  coaches,
  defaultRole = "ATHLETE",
  fixedRole = false,
  allowedRoles,
  onClose,
  onSaved,
}: {
  clubs: Club[];
  coaches: UserProfile[];
  defaultRole?: UserRole;
  fixedRole?: boolean;
  allowedRoles?: UserRole[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const scopeType = String(form.get("scopeType") ?? "CLUB") as "CLUB" | "MULTI_CLUB" | "FEDERATION";
      const clubIds = String(form.get("clubIds") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      await createManagedUser({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        firstName: String(form.get("firstName") ?? "").trim(),
        lastName: String(form.get("lastName") ?? "").trim(),
        role,
        active: form.get("active") === "true",
        phone: optionalText(form.get("phone")),
        clubId: optionalText(form.get("clubId")),
        coachId: optionalText(form.get("coachId")),
        licenseNumber: optionalText(form.get("licenseNumber")),
        birthDate: optionalText(form.get("birthDate")),
        trainingStartYear: optionalNumber(form.get("trainingStartYear")),
        specialty: optionalText(form.get("specialty")),
        technicalScope:
          role === "TECHNICAL_DIRECTOR"
            ? { type: scopeType, clubIds }
            : role === "FEDERATION_PRESIDENT"
              ? { type: "FEDERATION", clubIds: [] }
              : null,
      });
      await onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Creation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const availableCoaches = role === "ATHLETE" ? coaches : [];
  const availableRoles = allowedRoles?.length
    ? roleOptions.filter((option) => allowedRoles.includes(option.value))
    : roleOptions;
  const defaultClubId = clubs.length === 1 ? clubs[0].id : "";

  return (
    <div className="admin-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="create-user-title">Creer un compte</h2>
            <p>Le compte Firebase Auth et le profil Firestore seront crees ensemble.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="admin-form-grid">
            <label>
              Role
              <select value={role} disabled={fixedRole} onChange={(event) => setRole(event.target.value as UserRole)}>
                {availableRoles.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Statut
              <select name="active" defaultValue="true">
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </label>
            <label>Prenom<input name="firstName" required /></label>
            <label>Nom<input name="lastName" required /></label>
            <label className="wide">Adresse e-mail<input name="email" type="email" required /></label>
            <label className="wide">Mot de passe temporaire<input name="password" type="password" minLength={6} required /></label>
            <label>Telephone<input name="phone" /></label>
            <label>
              Club
              <select name="clubId" defaultValue={defaultClubId}>
                <option value="">Sans club</option>
                {clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
              </select>
            </label>
            {role === "ATHLETE" && (
              <label>
                Coach affecte
                <select name="coachId" defaultValue="">
                  <option value="">Sans coach</option>
                  {availableCoaches.map((coach) => <option value={coach.uid} key={coach.uid}>{coach.firstName} {coach.lastName}</option>)}
                </select>
              </label>
            )}
            {(role === "ATHLETE" || role === "COACH" || role === "JURY") && (
              <label>Numero de licence<input name="licenseNumber" /></label>
            )}
            <label>Date de naissance<input name="birthDate" type="date" /></label>
            {role === "ATHLETE" && <label>Annee de debut<input name="trainingStartYear" min="1900" max="2100" type="number" /></label>}
            {(role === "COACH" || role === "TECHNICAL_DIRECTOR") && <label className="wide">Specialite<input name="specialty" /></label>}
            {role === "TECHNICAL_DIRECTOR" && (
              <>
                <label>
                  Scope
                  <select name="scopeType" defaultValue="CLUB">
                    <option value="CLUB">Club</option>
                    <option value="MULTI_CLUB">Multi-club</option>
                    <option value="FEDERATION">Federation</option>
                  </select>
                </label>
                <label>Clubs supervises<input name="clubIds" placeholder="club-1, club-2" /></label>
              </>
            )}
          </div>
          {error && <div className="error-card">{error}</div>}
          <footer>
            <button className="button ghost" type="button" onClick={onClose}>Annuler</button>
            <button className="button primary" disabled={busy}><Save />{busy ? "Creation..." : "Creer le compte"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
