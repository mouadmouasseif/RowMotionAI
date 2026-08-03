"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  Filter,
  Grid2X2,
  List,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { ManagedUserDialog } from "@/components/admin/ManagedUserDialog";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { displayAge } from "@/lib/user-profile";
import { useAuth } from "@/providers/AuthProvider";
import { deleteManagedUser } from "@/services/admin-management-service";
import { listClubs } from "@/services/club-service";
import { listAthletes, listCoaches } from "@/services/user-service";
import type { Club } from "@/types/club";
import type { UserProfile } from "@/types/user";

function AthletesContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<UserProfile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [coaches, setCoaches] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!profile) return;
    const [athletes, availableClubs, availableCoaches] = await Promise.all([
      listAthletes(profile),
      profile.role === "SUPER_ADMIN" ? listClubs(profile) : Promise.resolve([]),
      profile.role === "SUPER_ADMIN" ? listCoaches(profile) : Promise.resolve([]),
    ]);
    setItems(athletes);
    setClubs(availableClubs);
    setCoaches(availableCoaches);
  }, [profile]);

  useEffect(() => {
    void load().catch(() => setError("Impossible de charger les athlètes."));
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.firstName} ${item.lastName} ${item.licenseNumber ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  );

  if (!profile) return null;

  const remove = async (athlete: UserProfile) => {
    if (
      !window.confirm(
        `Supprimer définitivement ${athlete.firstName} ${athlete.lastName} ?`,
      )
    ) {
      return;
    }
    try {
      setError("");
      setMessage("");
      await deleteManagedUser(athlete.uid);
      setItems((current) => current.filter((item) => item.uid !== athlete.uid));
      setMessage("Athlète supprimé.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Suppression impossible.");
    }
  };

  return (
    <AppShell
      referenceMode
      title="Athlètes"
      subtitle="Gérez les profils, les clubs et les affectations de coach."
      headerActions={
        <>
          <Link className="button primary" href="/inscription">
            <UserPlus />
            Ajouter un athlète
          </Link>
          <button className="button ghost">
            <Download />
            Importer
          </button>
          <button className="reference-more" aria-label="Plus d’actions">
            <MoreHorizontal />
          </button>
        </>
      }
    >
      <div className="directory-reference">
        <nav className="directory-tabs">
          <button className="active">Liste des athlètes</button>
          <button>Groupes</button>
          <button>Évaluations</button>
          <button>Licences</button>
          <button>Statistiques</button>
        </nav>
        <div className="directory-layout">
          <main>
            <div className="directory-filters">
              <label>
                <Search />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un athlète..."
                />
              </label>
              <select><option>Tous les groupes</option></select>
              <select><option>Toutes catégories</option></select>
              <select><option>Tous les statuts</option></select>
              <button><Filter />Plus de filtres</button>
            </div>
            <section className="directory-table athletes-directory">
              <div className="directory-table-tools">
                <strong>{filtered.length} athlète{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</strong>
                <span>
                  <button aria-label="Vue en grille"><Grid2X2 /></button>
                  <button aria-label="Vue en liste"><List /></button>
                  <button><Download />Exporter</button>
                </span>
              </div>
              <header>
                <span>✓</span><span>Athlète</span><span>Groupe</span><span>Catégorie</span>
                <span>Âge</span><span>Poids</span><span>Taille</span><span>N° Licence</span>
                <span>Statut</span><span>Actions</span>
              </header>
              {error && <div className="error-card">{error}</div>}
              {message && <div className="notice-card">{message}</div>}
              {filtered.map((athlete, index) => (
                <article key={athlete.uid}>
                  <input type="checkbox" aria-label={`Sélectionner ${athlete.firstName}`} />
                  <div className="directory-person">
                    <ProfileAvatar
                      photoUrl={athlete.profilePhotoUrl}
                      firstName={athlete.firstName}
                      lastName={athlete.lastName}
                    />
                    <span>
                      <strong>
                        {athlete.firstName} {athlete.lastName}
                        {athlete.uid === profile.uid && <i>Vous</i>}
                      </strong>
                      <small>
                        {clubs.find((club) => club.id === athlete.clubId)?.name ??
                          (athlete.clubId ? athlete.clubId : "Sans club")}
                      </small>
                    </span>
                  </div>
                  <em className={`group-tag group-${index % 4}`}>
                    Groupe {["Élite", "Performance", "Développement", "Débutant"][index % 4]}
                  </em>
                  <span>
                    {athlete.officialCategory ?? athlete.calculatedCategory ?? "Non définie"}
                    <i className="category-tag">
                      {(athlete.officialCategory ?? "—").slice(0, 3)}
                    </i>
                  </span>
                  <span>{displayAge(athlete) ?? "—"}</span>
                  <span>{athlete.weight ? `${athlete.weight} kg` : "—"}</span>
                  <span>
                    {athlete.height ? `${(athlete.height / 100).toFixed(2)} m` : "—"}
                  </span>
                  <span>{athlete.licenseNumber ?? "—"}</span>
                  <em
                    className={`directory-status ${
                      athlete.sportStatus === "injured"
                        ? "pending"
                        : athlete.active
                          ? ""
                          : "inactive"
                    }`}
                  >
                    {athlete.sportStatus === "injured"
                      ? "Blessé"
                      : athlete.active
                        ? "Actif"
                        : "Inactif"}
                  </em>
                  <span className="directory-actions">
                    <Link href={`/athletes/${athlete.uid}`} aria-label={`Voir ${athlete.firstName}`}>
                      <Eye />
                    </Link>
                    {profile.role === "SUPER_ADMIN" ? (
                      <>
                        <button
                          aria-label={`Modifier ${athlete.firstName}`}
                          onClick={() => setSelectedUser(athlete)}
                        >
                          <Pencil />
                        </button>
                        <button
                          className="danger"
                          aria-label={`Supprimer ${athlete.firstName}`}
                          onClick={() => void remove(athlete)}
                        >
                          <Trash2 />
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/athletes/${athlete.uid}`}
                        aria-label={`Modifier ${athlete.firstName}`}
                      >
                        <Pencil />
                      </Link>
                    )}
                  </span>
                </article>
              ))}
              {filtered.length === 0 && !error && (
                <div className="empty-state">
                  <Users />
                  <h2>Aucun athlète</h2>
                  <p>Ajoutez ou associez votre premier athlète.</p>
                </div>
              )}
              <footer>
                <label>Afficher <select><option>10</option></select> par page</label>
                <nav><button>‹</button><button className="active">1</button><button>›</button></nav>
                <span>1-{Math.min(filtered.length, 10)} sur {filtered.length} athlètes</span>
              </footer>
            </section>
          </main>
          <aside className="directory-sidebar">
            <section>
              <h2>Statistiques</h2>
              {[
                ["Total", items.length, "blue"],
                ["Athlètes actifs", items.filter((item) => item.active).length, "green"],
                ["Blessés", items.filter((item) => item.sportStatus === "injured").length, "yellow"],
                ["Inactifs", items.filter((item) => !item.active).length, "gray"],
              ].map(([label, value, color]) => (
                <div key={label}>
                  <i className={String(color)}><Users /></i>
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
            coaches={coaches}
            onClose={() => setSelectedUser(null)}
            onSaved={load}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function AthletesPage() {
  return (
    <ProtectedPage allowedRoles={["COACH", "CLUB_ADMIN", "SUPER_ADMIN"]}>
      <AthletesContent />
    </ProtectedPage>
  );
}

