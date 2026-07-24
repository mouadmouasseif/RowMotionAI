"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Download,
  Eye,
  Filter,
  ImagePlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import { createClub, listClubs } from "@/services/club-service";
import {
  uploadClubLogo,
  validateProfileImage,
} from "@/services/profile-media-service";
import type { Club } from "@/types/club";

function ClubsContent() {
  const { profile } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const load = useCallback(async () => {
    if (profile) setClubs(await listClubs(profile));
  }, [profile]);
  useEffect(() => {
    void load().catch(() => setError("Impossible de charger les clubs."));
  }, [load]);
  if (!profile) return null;
  const filtered = clubs.filter((club) =>
    `${club.name} ${club.city ?? ""} ${club.country ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    const form = new FormData(event.currentTarget);
    try {
      submitLockRef.current = true;
      setIsSubmitting(true);
      setError("");
      const id = await createClub(profile, {
        name: String(form.get("name") ?? ""),
        shortName: String(form.get("shortName") ?? "") || null,
        city: String(form.get("city") ?? "") || null,
        country: String(form.get("country") ?? "") || null,
        email: String(form.get("email") ?? "") || null,
        phone: String(form.get("phone") ?? "") || null,
        active: true,
      });
      if (logoFile) await uploadClubLogo(id, logoFile);
      await load();
      setLogoFile(null);
      setShowForm(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Création impossible.",
      );
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      referenceMode
      title="Clubs"
      subtitle="Gérez tous les clubs enregistrés sur la plateforme."
      headerActions={
        <>
          <button
            className="button primary"
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus />
            Ajouter un club
          </button>
          <button className="button ghost">
            <Download />
            Exporter
          </button>
          <button className="reference-more">
            <MoreHorizontal />
          </button>
        </>
      }
    >
      <div className="directory-reference clubs-reference">
        <section className="club-stats">
          {[
            ["Total des clubs", clubs.length, "blue"],
            [
              "Clubs actifs",
              clubs.filter((club) => club.active).length,
              "green",
            ],
            [
              "En attente",
              clubs.filter((club) => !club.active).length,
              "yellow",
            ],
            ["Suspendus", 0, "red"],
          ].map(([label, value, color]) => (
            <article key={label}>
              <i className={String(color)}>
                <Building2 />
              </i>
              <span>
                <strong>{value}</strong>
                <small>{label}</small>
              </span>
            </article>
          ))}
        </section>
        {showForm && (
          <form className="club-create-reference" onSubmit={submit}>
            <h2>Nouveau club</h2>
            <div className="club-logo-upload">
              <label>
                <ImagePlus />
                {logoFile ? logoFile.name : "Téléverser le logo"}
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      validateProfileImage(file);
                      setLogoFile(file);
                      setError("");
                    } catch (reason) {
                      setError(
                        reason instanceof Error
                          ? reason.message
                          : "Logo invalide.",
                      );
                    }
                  }}
                />
              </label>
              <small>JPG, PNG ou WebP · 5 Mo maximum</small>
            </div>
            <div className="club-create-fields">
              {[
                ["name", "Nom du club"],
                ["shortName", "Nom court"],
                ["city", "Ville"],
                ["country", "Pays"],
                ["email", "E-mail"],
                ["phone", "Téléphone"],
              ].map(([name, placeholder]) => (
                <input
                  key={name}
                  name={name}
                  placeholder={placeholder}
                  required={name === "name"}
                />
              ))}
            </div>
            <button className="button primary" disabled={isSubmitting}>
              {isSubmitting ? "Création…" : "Créer le club"}
            </button>
          </form>
        )}
        {error && <div className="error-card">{error}</div>}
        <div className="directory-layout clubs-layout">
          <main>
            <div className="directory-filters">
              <label>
                <Search />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un club..."
                />
              </label>
              <select>
                <option>Tous les statuts</option>
              </select>
              <select>
                <option>Toutes les villes</option>
              </select>
              <select>
                <option>Tous les pays</option>
              </select>
              <button>
                <Filter />
                Filtres
              </button>
            </div>
            <section className="directory-table clubs-directory">
              <header>
                <span>Club</span>
                <span>Ville</span>
                <span>Pays</span>
                <span>Contact</span>
                <span>Membres</span>
                <span>Statut</span>
                <span>Création</span>
                <span>Actions</span>
              </header>
              {filtered.map((club) => (
                <article key={club.id}>
                  <div className="club-identity">
                    <span>
                      {club.logoUrl ? (
                        <Image
                          src={club.logoUrl}
                          alt=""
                          width={45}
                          height={45}
                        />
                      ) : (
                        <Building2 />
                      )}
                    </span>
                    <p>
                      <strong>{club.name}</strong>
                      <small>{club.shortName ?? club.id}</small>
                    </p>
                  </div>
                  <span>{club.city ?? "—"}</span>
                  <span>{club.country ?? "—"}</span>
                  <span>{club.email ?? club.phone ?? "—"}</span>
                  <span>
                    <Users /> —
                  </span>
                  <em
                    className={`directory-status ${club.active ? "" : "pending"}`}
                  >
                    {club.active ? "Actif" : "En attente"}
                  </em>
                  <span>—</span>
                  <span className="directory-actions">
                    <Link href={`/clubs/${club.id}`}>
                      <Eye />
                    </Link>
                    <Link href={`/clubs/${club.id}`}>
                      <Pencil />
                    </Link>
                  </span>
                </article>
              ))}
              {filtered.length === 0 && (
                <div className="empty-state">
                  <Building2 />
                  <h2>Aucun club enregistré</h2>
                </div>
              )}
            </section>
          </main>
          <aside className="directory-sidebar">
            <section>
              <h2>Aperçu des clubs</h2>
              <div className="mini-directory-donut" />
              <ul>
                <li>
                  Actifs{" "}
                  <strong>{clubs.filter((club) => club.active).length}</strong>
                </li>
                <li>
                  En attente{" "}
                  <strong>{clubs.filter((club) => !club.active).length}</strong>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
export default function ClubsPage() {
  return (
    <ProtectedPage allowedRoles={["superadmin"]}>
      <ClubsContent />
    </ProtectedPage>
  );
}
