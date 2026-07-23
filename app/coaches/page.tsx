"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Link2,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { listCoaches, setCoachActive } from "@/services/user-service";
import type { UserProfile } from "@/types/user";

function CoachesContent() {
  const { profile } = useAuth();
  const [coaches, setCoaches] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");
  const [error, setError] = useState("");
  const [busyUid, setBusyUid] = useState("");

  useEffect(() => {
    if (profile) {
      void listCoaches(profile)
        .then(setCoaches)
        .catch(() => setError("Impossible de charger les comptes entraîneurs."));
    }
  }, [profile]);

  const filtered = useMemo(
    () =>
      coaches.filter(
        (coach) =>
          `${coach.firstName} ${coach.lastName} ${coach.email}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (filter === "all" || (filter === "active" ? coach.active : !coach.active)),
      ),
    [coaches, filter, search],
  );

  if (!profile) return null;

  const changeStatus = async (coach: UserProfile, active: boolean) => {
    setBusyUid(coach.uid);
    setError("");
    try {
      await setCoachActive(profile, coach.uid, active);
      setCoaches((current) =>
        current.map((item) => (item.uid === coach.uid ? { ...item, active } : item)),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Modification impossible.");
    } finally {
      setBusyUid("");
    }
  };

  return (
    <AppShell title="Comptes entraîneurs" subtitle="Administration des accès">
      <div className="page-actions">
        <Link className="button ghost" href="/club/associations">
          <Link2 />
          Associer un athlète
        </Link>
        <Link className="button primary" href="/club/coachs/nouveau">
          <Plus />
          Inviter un coach
        </Link>
      </div>

      <div className="coach-summary">
        <article>
          <UserCog />
          <div><strong>{coaches.length}</strong><small>Total</small></div>
        </article>
        <article>
          <CheckCircle2 />
          <div>
            <strong>{coaches.filter((coach) => coach.active).length}</strong>
            <small>Actifs</small>
          </div>
        </article>
        <article>
          <ShieldCheck />
          <div>
            <strong>{coaches.filter((coach) => !coach.active).length}</strong>
            <small>En attente</small>
          </div>
        </article>
      </div>

      <div className="filter-bar coach-filters">
        <label>
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom ou e-mail"
          />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="pending">En attente</option>
        </select>
      </div>

      {error && <div className="error-card">{error}</div>}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <UserCog />
          <h2>Aucun entraîneur</h2>
          <p>Les comptes coach inscrits apparaîtront ici.</p>
        </div>
      ) : (
        <div className="coach-list">
          {filtered.map((coach) => (
            <article key={coach.uid}>
              <ProfileAvatar
                photoUrl={coach.profilePhotoUrl}
                firstName={coach.firstName}
                lastName={coach.lastName}
              />
              <div className="coach-identity">
                <Link href={`/coaches/${coach.uid}`}>
                  <strong>
                    {`${coach.firstName} ${coach.lastName}`.trim() || "Entraîneur"}
                  </strong>
                </Link>
                <span>{coach.email}</span>
                <small>
                  Club : {coach.clubId ?? "Non renseigné"} · Licence :{" "}
                  {coach.licenseNumber ?? "—"}
                </small>
              </div>
              <span className={`account-status ${coach.active ? "active" : "pending"}`}>
                {coach.active ? "Actif" : "En attente"}
              </span>
              {coach.active ? (
                <button
                  className="button danger-outline"
                  disabled={busyUid === coach.uid}
                  onClick={() => void changeStatus(coach, false)}
                >
                  <XCircle />
                  Désactiver
                </button>
              ) : (
                <button
                  className="button primary"
                  disabled={busyUid === coach.uid}
                  onClick={() => void changeStatus(coach, true)}
                >
                  <CheckCircle2 />
                  Valider
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function CoachesPage() {
  return (
    <ProtectedPage allowedRoles={["club_admin", "superadmin"]}>
      <CoachesContent />
    </ProtectedPage>
  );
}
