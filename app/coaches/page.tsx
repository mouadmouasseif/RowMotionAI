"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { ManagedUserDialog } from "@/components/admin/ManagedUserDialog";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { toDate } from "@/lib/user-profile";
import { useAuth } from "@/providers/AuthProvider";
import { deleteManagedUser } from "@/services/admin-management-service";
import { listClubs } from "@/services/club-service";
import { listAthletes, listCoaches } from "@/services/user-service";
import type { Club } from "@/types/club";
import type { UserProfile } from "@/types/user";

function formatDate(value: unknown) {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

function CoachesContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<UserProfile[]>([]);
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!profile) return;
    const [coaches, managedAthletes, availableClubs] = await Promise.all([
      listCoaches(profile),
      listAthletes(profile),
      profile.role === "superadmin" ? listClubs(profile) : Promise.resolve([]),
    ]);
    setItems(coaches);
    setAthletes(managedAthletes);
    setClubs(availableClubs);
  }, [profile]);

  useEffect(() => {
    void load().catch(() => setError("Impossible de charger les coachs."));
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter((coach) =>
        `${coach.firstName} ${coach.lastName} ${coach.email}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  );

  if (!profile) return null;

  const remove = async (coach: UserProfile) => {
    if (!window.confirm(`Supprimer définitivement ${coach.firstName} ${coach.lastName} ?`)) {
      return;
    }
    try {
      setError("");
      setMessage("");
      await deleteManagedUser(coach.uid);
      setItems((current) => current.filter((item) => item.uid !== coach.uid));
      setAthletes((current) =>
        current.map((athlete) =>
          athlete.coachId === coach.uid ? { ...athlete, coachId: null } : athlete,
        ),
      );
      setMessage("Coach supprimé et athlètes désaffectés.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Suppression impossible.");
    }
  };

  return (
    <AppShell
      referenceMode
      title="Coachs"
      subtitle="Gérez les coachs, leur club et leurs affectations."
      headerActions={
        <>
          <Link className="button primary" href="/club/coachs/nouveau"><Plus />Ajouter un coach</Link>
          <button className="button ghost"><Download />Importer</button>
          <button className="reference-more" aria-label="Plus d’actions"><MoreHorizontal /></button>
        </>
      }
    >
      <div className="directory-reference">
        <nav className="directory-tabs">
          <button className="active">Tous les coachs <i>{items.length}</i></button>
          <button>Par club <i>{new Set(items.map((item) => item.clubId).filter(Boolean)).size}</i></button>
          <button>En attente <i>{items.filter((item) => !item.active).length}</i></button>
          <button>Inactifs <i>{items.filter((item) => !item.active).length}</i></button>
        </nav>
        <div className="directory-layout coaches-layout">
          <main>
            <div className="directory-filters">
              <label>
                <Search />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un coach (nom, e-mail, club...)"
                />
              </label>
              <select><option>Tous les clubs</option></select>
              <select><option>Tous les statuts</option></select>
              <select><option>Toutes spécialités</option></select>
              <button><Filter />Filtres</button>
              <button className="reset-filter" onClick={() => setSearch("")}>Réinitialiser</button>
            </div>
            <section className="directory-table coaches-directory">
              <header>
                <span>Coach</span><span>Club</span><span>Spécialité</span><span>Athlètes</span>
                <span>E-mail</span><span>Téléphone</span><span>Statut</span>
                <span>Date d’inscription</span><span>Actions</span>
              </header>
              {error && <div className="error-card">{error}</div>}
              {message && <div className="notice-card">{message}</div>}
              {filtered.map((coach) => (
                <article key={coach.uid}>
                  <div className="directory-person">
                    <ProfileAvatar
                      photoUrl={coach.profilePhotoUrl}
                      firstName={coach.firstName}
                      lastName={coach.lastName}
                    />
                    <span>
                      <strong>{coach.firstName} {coach.lastName}</strong>
                      <small>{coach.specialty ?? "Coach"}</small>
                    </span>
                  </div>
                  <span>
                    {clubs.find((club) => club.id === coach.clubId)?.name ??
                      (coach.clubId ? coach.clubId : "Sans club")}
                  </span>
                  <em className="specialty specialty-0">{coach.specialty ?? "Non renseignée"}</em>
                  <span><Users /> {athletes.filter((athlete) => athlete.coachId === coach.uid).length}</span>
                  <span>{coach.email}</span>
                  <span>{coach.phone ?? "—"}</span>
                  <em className={`directory-status ${coach.active ? "" : "pending"}`}>
                    {coach.active ? "Actif" : "En attente"}
                  </em>
                  <span>{formatDate(coach.createdAt)}</span>
                  <span className="directory-actions">
                    <Link href={`/coaches/${coach.uid}`} aria-label={`Voir ${coach.firstName}`}><Eye /></Link>
                    {profile.role === "superadmin" ? (
                      <>
                        <button
                          aria-label={`Modifier ${coach.firstName}`}
                          onClick={() => setSelectedUser(coach)}
                        >
                          <Pencil />
                        </button>
                        <button
                          className="danger"
                          aria-label={`Supprimer ${coach.firstName}`}
                          onClick={() => void remove(coach)}
                        >
                          <Trash2 />
                        </button>
                      </>
                    ) : (
                      <Link href={`/coaches/${coach.uid}`} aria-label={`Modifier ${coach.firstName}`}><Pencil /></Link>
                    )}
                  </span>
                </article>
              ))}
              {filtered.length === 0 && !error && (
                <div className="empty-state"><UserCog /><h2>Aucun coach</h2></div>
              )}
              <footer>
                <label>Affichage <select><option>10</option></select> par page</label>
                <nav><button>‹</button><button className="active">1</button><button>›</button></nav>
                <span>1-{Math.min(filtered.length, 10)} sur {filtered.length} coachs</span>
              </footer>
            </section>
          </main>
          <aside className="directory-sidebar">
            <section>
              <h2>Aperçu des coachs</h2>
              {[
                ["Total des coachs", items.length, "blue"],
                ["Actifs", items.filter((item) => item.active).length, "green"],
                ["En attente", items.filter((item) => !item.active).length, "yellow"],
              ].map(([label, value, color]) => (
                <div key={label}>
                  <i className={String(color)}><UserCog /></i>
                  <strong>{value}</strong><span>{label}</span>
                </div>
              ))}
            </section>
          </aside>
        </div>
        {selectedUser && (
          <ManagedUserDialog
            user={selectedUser}
            clubs={clubs}
            coaches={items}
            onClose={() => setSelectedUser(null)}
            onSaved={load}
          />
        )}
      </div>
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
