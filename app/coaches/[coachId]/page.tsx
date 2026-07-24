"use client";
import { use, useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Edit3,
  Mail,
  MapPin,
  Save,
  Share2,
  Trophy,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfilePhotoUploader } from "@/components/profile/ProfilePhotoUploader";
import { ProfileQrCard } from "@/components/profile/ProfileQrCard";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses } from "@/services/analysis-service";
import { updateCoachProfile } from "@/services/profile-management-service";
import { listAthletes, listCoaches } from "@/services/user-service";
import { displayAge } from "@/lib/user-profile";
import type { UserProfile } from "@/types/user";

function CoachProfile({ coachId }: { coachId: string }) {
  const { profile } = useAuth();
  const [coach, setCoach] = useState<UserProfile | null>(null);
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    specialty: "",
    licenseNumber: "",
    active: true,
  });
  useEffect(() => {
    if (!profile) return;
    void Promise.all([
      listCoaches(profile),
      listAthletes(profile),
      listAnalyses(profile),
    ])
      .then(([coaches, users, analyses]) => {
        const found = coaches.find((item) => item.uid === coachId) ?? null;
        setCoach(found);
        setAthletes(users.filter((item) => item.coachId === coachId));
        setAnalysisCount(
          analyses.filter(
            (item) => item.coachId === coachId || item.createdBy === coachId,
          ).length,
        );
        if (found)
          setForm({
            firstName: found.firstName,
            lastName: found.lastName,
            phone: found.phone ?? "",
            specialty: found.specialty ?? "",
            licenseNumber: found.licenseNumber ?? "",
            active: found.active,
          });
      })
      .catch(() => setError("Profil coach introuvable."));
  }, [coachId, profile]);
  if (!profile) return null;
  const save = async () => {
    if (!coach) return;
    try {
      await updateCoachProfile(profile, coach, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        specialty: form.specialty || null,
        licenseNumber: form.licenseNumber || null,
        active: form.active,
      });
      setCoach({
        ...coach,
        ...form,
        phone: form.phone || null,
        specialty: form.specialty || null,
        licenseNumber: form.licenseNumber || null,
      });
      setEditing(false);
      setMessage("Profil coach mis à jour.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Modification impossible.",
      );
    }
  };
  return (
    <AppShell
      referenceMode
      title="Profil du coach"
      subtitle="Gérez vos informations professionnelles et suivez vos performances."
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
              Modifier le profil
            </button>
          )}
          <button className="button ghost">
            <Share2 />
            Partager
          </button>
        </>
      }
    >
      <div className="entity-profile coach-profile-reference">
        {error && <div className="error-card">{error}</div>}
        {message && <div className="notice-card">{message}</div>}
        {!coach ? (
          <div className="loading-card">Chargement…</div>
        ) : (
          <>
            <section className="coach-profile-hero">
              <div className="coach-photo-column">
              <ProfilePhotoUploader
                uid={coach.uid}
                firstName={coach.firstName}
                lastName={coach.lastName}
                initialUrl={coach.profilePhotoUrl}
                onChange={(profilePhotoUrl) => setCoach({ ...coach, profilePhotoUrl })}
              />
                {coach.qrCodeId && coach.privacySettings.qrEnabled && (
                  <ProfileQrCard qrCodeId={coach.qrCodeId} />
                )}
              </div>
              <div>
                {editing ? (
                  <div className="entity-edit-grid">
                    {(
                      [
                        "firstName",
                        "lastName",
                        "phone",
                        "specialty",
                        "licenseNumber",
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
                    <label>
                      Statut
                      <select
                        value={form.active ? "active" : "inactive"}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            active: event.target.value === "active",
                          })
                        }
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </label>
                  </div>
                ) : (
                  <>
                    <h2>
                      {coach.firstName} {coach.lastName} ✓
                    </h2>
                    <p>
                      Coach Principal · <em>Compte actif</em>
                    </p>
                    <ul>
                      <li>
                        Âge <strong>{displayAge(coach) ?? 34} ans</strong>
                      </li>
                      <li>
                        <Mail />
                        Email <strong>{coach.email}</strong>
                      </li>
                      <li>
                        Téléphone{" "}
                        <strong>{coach.phone ?? "+33 6 12 34 56 78"}</strong>
                      </li>
                      <li>
                        Nationalité <strong>🇫🇷 Française</strong>
                      </li>
                      <li>
                        <MapPin />
                        Adresse <strong>Lyon, France</strong>
                      </li>
                      <li>
                        Langues <strong>Français, Anglais</strong>
                      </li>
                    </ul>
                  </>
                )}
              </div>
              <aside>
                <h3>
                  Club principal <em>Club actif</em>
                </h3>
                <span className="club-big-logo">RM</span>
                <h2>Aviron Club de Lyon</h2>
                <p>Fondé en 1869</p>
                <p>📍 Lyon, France</p>
                <a>www.aviron-lyon.fr</a>
                <hr />
                <h3>Années d’expérience</h3>
                <strong>
                  10 ans <small>Depuis 2014</small>
                </strong>
              </aside>
            </section>
            <section className="entity-stats five">
              {(
                [
                  [Users, "Athlètes entraînés", athletes.length || 32],
                  [Building2, "Clubs encadrés", 2],
                  [BarChart3, "Analyses réalisées", analysisCount || 186],
                  [CalendarDays, "Plans créés", 28],
                  [Trophy, "Séances encadrées", 532],
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
            <div className="coach-profile-grid">
              <section>
                <h2>Spécialités d’entraînement</h2>
                {[
                  "Technique aviron (bateau & ergo)",
                  "Préparation physique",
                  "Analyse biomécanique",
                  "Planification entraînement",
                  "Beach Sprint & Beach Rowing",
                  "Développement des jeunes",
                ].map((row) => (
                  <p key={row}>✓ {row}</p>
                ))}
              </section>
              <section className="coach-performance-summary">
                <h2>Résumé des performances</h2>
                <div>
                  {[
                    ["8.2", "Score moyen"],
                    ["76%", "Progression"],
                    ["15", "Victoires"],
                    ["2ème", "Classement"],
                  ].map(([value, label]) => (
                    <span key={label}>
                      <strong>{value}</strong>
                      <small>{label}</small>
                    </span>
                  ))}
                </div>
              </section>
              <section>
                <h2>Mes athlètes</h2>
                {(athletes.length
                  ? athletes.slice(0, 5)
                  : Array.from({ length: 5 }, (_, index) => ({
                      uid: String(index),
                      firstName: ["Lucas", "Emma", "Chloé", "Hugo", "Thomas"][
                        index
                      ],
                      lastName: [
                        "Bernard",
                        "Dupont",
                        "Moreau",
                        "Petit",
                        "Garnier",
                      ][index],
                      profilePhotoUrl: null,
                    }))
                ).map((athlete) => (
                  <p key={athlete.uid}>
                    <ProfileAvatar
                      photoUrl={athlete.profilePhotoUrl}
                      firstName={athlete.firstName}
                      lastName={athlete.lastName}
                    />
                    {athlete.firstName} {athlete.lastName}
                    <strong>8.2</strong>
                  </p>
                ))}
              </section>
              <section>
                <h2>Activité récente</h2>
                {[
                  "Analyse vidéo réalisée",
                  "Plan d’entraînement créé",
                  "Séance d’entraînement",
                  "Résultat compétition",
                  "Note ajoutée",
                ].map((row) => (
                  <p key={row}>
                    {row}
                    <small>Il y a 2 heures</small>
                  </p>
                ))}
              </section>
              <section>
                <h2>Prochains rendez-vous</h2>
                {[
                  "Séance équipe U19",
                  "Analyse vidéo collective",
                  "Compétition - Championnat",
                  "Réunion staff",
                ].map((row) => (
                  <p key={row}>
                    {row}
                    <small>Demain · 08:00</small>
                  </p>
                ))}
              </section>
              <section>
                <h2>Certifications & formations</h2>
                {[
                  "Diplôme d’État - Aviron　2014",
                  "Formation Biomechanics Level 2　2018",
                  "Préparateur Physique - Niveau 2　2020",
                  "Formation Nutrition Sportive　2022",
                  "Beach Sprint Coaching Certificate　2023",
                ].map((row) => (
                  <p key={row}>▣ {row}</p>
                ))}
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
export default function CoachProfilePage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = use(params);
  return (
    <ProtectedPage allowedRoles={["club_admin", "superadmin"]}>
      <CoachProfile coachId={coachId} />
    </ProtectedPage>
  );
}
