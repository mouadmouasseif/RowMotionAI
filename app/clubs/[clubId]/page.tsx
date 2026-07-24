"use client";
/* eslint-disable @next/next/no-img-element */

import { use, useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Download,
  Edit3,
  FileText,
  MoreHorizontal,
  Save,
  Trophy,
  Users,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ClubLogoUploader } from "@/components/profile/ClubLogoUploader";
import { useAuth } from "@/providers/AuthProvider";
import { getClub } from "@/services/club-service";
import { updateClubProfile } from "@/services/profile-management-service";
import type { Club } from "@/types/club";

function ClubProfile({ clubId }: { clubId: string }) {
  const { profile } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    city: "",
    country: "",
    email: "",
    phone: "",
    active: true,
  });

  useEffect(() => {
    if (!profile) return;
    void getClub(clubId, profile)
      .then((value) => {
        setClub(value);
        setForm({
          name: value.name,
          shortName: value.shortName ?? "",
          city: value.city ?? "",
          country: value.country ?? "",
          email: value.email ?? "",
          phone: value.phone ?? "",
          active: value.active,
        });
      })
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Club introuvable.",
        ),
      );
  }, [clubId, profile]);
  if (!profile) return null;

  const save = async () => {
    if (!club) return;
    try {
      await updateClubProfile(profile, club.id, {
        ...form,
        shortName: form.shortName || null,
        city: form.city || null,
        country: form.country || null,
        email: form.email || null,
        phone: form.phone || null,
      });
      setClub({ ...club, ...form });
      setEditing(false);
      setMessage("Club mis à jour.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Modification impossible.",
      );
    }
  };

  return (
    <AppShell
      referenceMode
      title="Profil du club"
      subtitle="Consultez et gérez les informations de votre club."
      headerActions={
        <>
          {editing ? (
            <button className="button primary" onClick={() => void save()}>
              <Save />
              Enregistrer
            </button>
          ) : (
            <button className="button primary" onClick={() => setEditing(true)}>
              <Edit3 />
              Modifier le club
            </button>
          )}
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
      <div className="entity-profile club-profile-reference">
        {error && <div className="error-card">{error}</div>}
        {message && <div className="notice-card">{message}</div>}
        {!club ? (
          <div className="loading-card">Chargement du club…</div>
        ) : (
          <>
            <section className="club-profile-hero">
              <div className="club-profile-logo">
                {!club.logoUrl && <Building2 />}
                <ClubLogoUploader
                  clubId={club.id}
                  initialUrl={club.logoUrl}
                  onChange={(logoUrl) => setClub({ ...club, logoUrl })}
                />
              </div>
              <div>
                <h2>
                  {club.name}
                  <em>{club.active ? "Club actif" : "Inactif"}</em>
                </h2>
                <h3>Fondé en 1869</h3>
                {editing ? (
                  <div className="entity-edit-grid">
                    {(
                      [
                        "name",
                        "shortName",
                        "city",
                        "country",
                        "email",
                        "phone",
                      ] as const
                    ).map((key) => (
                      <label key={key}>
                        {key}
                        <input
                          value={String(form[key])}
                          onChange={(event) =>
                            setForm({ ...form, [key]: event.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <ul>
                    <li>
                      Adresse{" "}
                      <strong>
                        Quai Claude Bernard, {club.city ?? "Lyon"},{" "}
                        {club.country ?? "France"}
                      </strong>
                    </li>
                    <li>
                      Téléphone{" "}
                      <strong>{club.phone ?? "+33 4 78 72 12 43"}</strong>
                    </li>
                    <li>
                      Email{" "}
                      <strong>{club.email ?? "contact@aviron-lyon.fr"}</strong>
                    </li>
                    <li>
                      Site web <strong>www.aviron-lyon.fr</strong>
                    </li>
                    <li>
                      Affiliation <strong>Fédération Française d’Aviron</strong>
                    </li>
                    <li>
                      Numéro d’affiliation <strong>FFA-069-1875</strong>
                    </li>
                  </ul>
                )}
              </div>
              <div className="club-cover">
                <Waves />
                <span>Aviron Club de Lyon</span>
              </div>
            </section>
            <section className="entity-stats">
              {(
                [
                  [Users, "Athlètes", "68"],
                  [Users, "Coachs", "7"],
                  [Building2, "Équipes", "12"],
                  [BarChart3, "Analyses réalisées", "248"],
                  [CalendarDays, "Séances", "532"],
                  [FileText, "Plans d’entraînement", "36"],
                ] as const
              ).map(([Icon, label, value]) => (
                <article key={String(label)}>
                  <Icon />
                  <span>
                    <small>{label}</small>
                    <strong>{value}</strong>
                    <em>Cette saison</em>
                  </span>
                </article>
              ))}
            </section>
            <div className="club-profile-grid">
              <section>
                <h2>Informations générales</h2>
                {[
                  "Date de création　1869",
                  "Type de club　Club d’aviron",
                  "Statut juridique　Association loi 1901",
                  "Président　Jean-Marc Dupont",
                  "Responsable sportif　Julien Lefebvre",
                  "Nombre d’adhérents　85",
                  "Assurance　MAIF - N° 2314556",
                  "Couleurs du club　🔵 ⚪ 🔴",
                ].map((row) => (
                  <p key={row}>{row}</p>
                ))}
              </section>
              <section>
                <h2>Disciplines proposées</h2>
                {[
                  "Aviron en bateau (mer & rivière)",
                  "Aviron indoor (Ergomètre)",
                  "Beach Rowing",
                  "Beach Sprint",
                  "Développement musculaire",
                  "Préparation physique",
                ].map((row) => (
                  <p key={row}>◉ {row}</p>
                ))}
              </section>
              <section>
                <h2>Coachs du club</h2>
                {[
                  "Julien Lefebvre · Coach Principal",
                  "Camille Bernard · Coach",
                  "Thomas Dubois · Préparateur Physique",
                  "Claire Moreau · Coach",
                ].map((row) => (
                  <p key={row}>● {row}</p>
                ))}
              </section>
              <section>
                <h2>Athlètes par catégorie</h2>
                <div className="profile-donut">
                  68<small>Athlètes</small>
                </div>
                <p>U15　12</p>
                <p>U17　14</p>
                <p>U19　16</p>
                <p>U23　11</p>
                <p>Senior　15</p>
              </section>
              <section>
                <h2>Analyses récentes</h2>
                {[
                  "Lucas Bernard – Technique　8.6",
                  "Emma Dupont – Ergomètre　8.1",
                  "Hugo Petit – Eau libre　7.8",
                  "Chloé Moreau – Technique　7.6",
                ].map((row) => (
                  <p key={row}>{row}</p>
                ))}
              </section>
              <section>
                <h2>Activité récente</h2>
                {[
                  "Nouveau plan d’entraînement créé",
                  "Analyse vidéo réalisée",
                  "Nouvel athlète ajouté",
                  "Séance d’entraînement ajoutée",
                  "Résultat compétition",
                ].map((row) => (
                  <p key={row}>{row}</p>
                ))}
              </section>
              <section>
                <h2>
                  <Trophy /> Palmarès du club
                </h2>
                {[
                  "Championnat de France – Senior　1ère place　2023",
                  "Coupe de France des Clubs　2ème place　2023",
                  "Champ. Auvergne-Rhône-Alpes　1ère place　2022",
                  "Beach Sprint National　3ème place　2022",
                ].map((row) => (
                  <p key={row}>{row}</p>
                ))}
              </section>
              <section>
                <h2>Documents & ressources</h2>
                {[
                  "Règlement intérieur",
                  "Charte du club",
                  "Calendrier annuel 2024",
                  "Tarifs & Cotisations 2024",
                ].map((row) => (
                  <p key={row}>▣ {row}</p>
                ))}
              </section>
              <section>
                <h2>Paramètres du club</h2>
                {[
                  "Modifier les informations",
                  "Gérer les coachs",
                  "Gérer les athlètes",
                  "Gérer les équipes",
                  "Paramètres de facturation",
                ].map((row) => (
                  <p key={row}>{row}</p>
                ))}
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
export default function ClubProfilePage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = use(params);
  return (
    <ProtectedPage allowedRoles={["club_admin", "superadmin"]}>
      <ClubProfile clubId={clubId} />
    </ProtectedPage>
  );
}
