"use client";

import { ShieldCheck, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

function NewUserContent() {
  return (
    <AppShell title="Nouvel utilisateur" subtitle="Creation securisee par le Superadmin">
      <div className="notice-card">
        <ShieldCheck />
        <div>
          <strong>Creation Auth a brancher cote serveur</strong>
          <p>Ce formulaire prepare le profil RowMotion AI. La creation du compte Firebase Authentication doit passer par Admin SDK ou une Cloud Function pour ne pas deconnecter le Superadmin.</p>
        </div>
      </div>
      <form className="content-card form-card">
        <h2><UserPlus /> Profil utilisateur</h2>
        <div className="form-grid">
          <label className="plain-field">Role<select name="role" defaultValue="TECHNICAL_DIRECTOR"><option value="ATHLETE">Athlete</option><option value="COACH">Coach</option><option value="TECHNICAL_DIRECTOR">Directeur Technique</option><option value="CLUB_ADMIN">Admin Club</option><option value="JURY">Jury</option><option value="SUPER_ADMIN">Superadmin</option></select></label>
          <label className="plain-field">Statut<select name="active" defaultValue="true"><option value="true">Actif</option><option value="false">Inactif</option></select></label>
          <label className="plain-field">Prenom<input name="firstName" required /></label>
          <label className="plain-field">Nom<input name="lastName" required /></label>
          <label className="plain-field">Email<input name="email" type="email" required /></label>
          <label className="plain-field">Telephone optionnel<input name="phone" /></label>
          <label className="plain-field">Club principal<input name="clubId" /></label>
          <label className="plain-field">Scope<select name="scopeType" defaultValue="CLUB"><option value="CLUB">Club</option><option value="MULTI_CLUB">Multi-club</option><option value="FEDERATION">Federation</option></select></label>
          <label className="plain-field">Clubs supervises<input name="clubIds" placeholder="club-1, club-2" /></label>
        </div>
        <button className="button primary" type="button" disabled><UserPlus />Creation serveur a connecter</button>
      </form>
    </AppShell>
  );
}

export default function NewUserPage() {
  return <RoleGuard allowedRoles={["SUPER_ADMIN"]}><NewUserContent /></RoleGuard>;
}
