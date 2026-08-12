"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { createManagedUser } from "@/services/admin-management-service";
import type { UserRole } from "@/types/user";

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

function NewUserContent() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("ATHLETE");
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
      router.push("/super-admin/users");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Creation impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Nouvel utilisateur" subtitle="Creation securisee par le Super admin">
      <div className="notice-card">
        <ShieldCheck />
        <div>
          <strong>Roles verifies dans Firebase</strong>
          <p>Le profil est cree avec une valeur de role officielle: ATHLETE, COACH, JURY, CLUB_ADMIN, TECHNICAL_DIRECTOR, FEDERATION_PRESIDENT ou SUPER_ADMIN.</p>
        </div>
      </div>
      <form className="content-card form-card" onSubmit={submit}>
        <h2><UserPlus /> Profil utilisateur</h2>
        <div className="form-grid">
          <label className="plain-field">Role<select name="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>{roleOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          <label className="plain-field">Statut<select name="active" defaultValue="true"><option value="true">Actif</option><option value="false">Inactif</option></select></label>
          <label className="plain-field">Prenom<input name="firstName" required /></label>
          <label className="plain-field">Nom<input name="lastName" required /></label>
          <label className="plain-field">Email<input name="email" type="email" required /></label>
          <label className="plain-field">Mot de passe temporaire<input name="password" type="password" minLength={6} required /></label>
          <label className="plain-field">Telephone optionnel<input name="phone" /></label>
          <label className="plain-field">Club principal<input name="clubId" placeholder="Identifiant club" /></label>
          {role === "ATHLETE" && <label className="plain-field">Coach affecte<input name="coachId" placeholder="UID du coach" /></label>}
          {(role === "ATHLETE" || role === "COACH" || role === "JURY") && <label className="plain-field">Numero de licence<input name="licenseNumber" /></label>}
          <label className="plain-field">Date de naissance<input name="birthDate" type="date" /></label>
          {role === "ATHLETE" && <label className="plain-field">Annee de debut<input name="trainingStartYear" min="1900" max="2100" type="number" /></label>}
          {(role === "COACH" || role === "TECHNICAL_DIRECTOR") && <label className="plain-field">Specialite<input name="specialty" /></label>}
          {role === "TECHNICAL_DIRECTOR" && (
            <>
              <label className="plain-field">Scope<select name="scopeType" defaultValue="CLUB"><option value="CLUB">Club</option><option value="MULTI_CLUB">Multi-club</option><option value="FEDERATION">Federation</option></select></label>
              <label className="plain-field">Clubs supervises<input name="clubIds" placeholder="club-1, club-2" /></label>
            </>
          )}
        </div>
        {error && <div className="error-card">{error}</div>}
        <button className="button primary" disabled={busy}><UserPlus />{busy ? "Creation..." : "Creer le compte"}</button>
      </form>
    </AppShell>
  );
}

export default function NewUserPage() {
  return <RoleGuard allowedRoles={["SUPER_ADMIN"]}><NewUserContent /></RoleGuard>;
}
