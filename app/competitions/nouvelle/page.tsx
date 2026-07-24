"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import { createCompetition } from "@/services/competition-service";
import {
  uploadCompetitionLogo,
  validateProfileImage,
} from "@/services/profile-media-service";
import type { Competition } from "@/types/competition";
import type { ProfileCategory, ProfileDiscipline } from "@/types/user";

const categories: ProfileCategory[] = ["U15", "U19", "U21", "U23", "SENIOR"];
const disciplines: ProfileDiscipline[] = ["ERGOMETER", "SKIFF", "BEACH_ROWING"];

function NewCompetitionContent() {
  const { profile } = useAuth();
  const router = useRouter();
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  if (!profile) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || submitLockRef.current) return;
    const data = new FormData(event.currentTarget);
    try {
      submitLockRef.current = true;
      setIsSubmitting(true);
      setError("");
      const id = await createCompetition(profile, {
        name: String(data.get("name")),
        location: String(data.get("location")),
        startDate: String(data.get("startDate")),
        endDate: String(data.get("endDate")),
        status: "planned",
        clubId: String(data.get("clubId") || "") || null,
        notes: String(data.get("notes") || "") || null,
        type: String(data.get("type")) as Competition["type"],
        organizer: String(data.get("organizer") || "") || null,
        country: String(data.get("country") || "") || null,
        website: String(data.get("website") || "") || null,
        gender: String(data.get("gender")) as Competition["gender"],
        level: String(data.get("level")) as Competition["level"],
        eventCount: Number(data.get("eventCount") || 0),
        registrationDeadline:
          String(data.get("registrationDeadline") || "") || null,
        onlineRegistration: data.get("onlineRegistration") === "on",
        published: data.get("published") === "on",
        contact: String(data.get("contact") || "") || null,
        categories: data.getAll("categories") as ProfileCategory[],
        disciplines: data.getAll("disciplines") as ProfileDiscipline[],
      });
      if (logo) await uploadCompetitionLogo(id, logo);
      router.push("/competitions");
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
      title="Ajouter une compétition"
      subtitle="Créez une compétition et enregistrez tous ses paramètres dans Firebase."
    >
      <form className="competition-create-layout" onSubmit={submit}>
        <main>
          <section>
            <h2>1. Informations générales</h2>
            <div className="competition-form-grid">
              <label>
                Nom
                <input name="name" required />
              </label>
              <label>
                Lieu
                <input name="location" required />
              </label>
              <label>
                Type
                <select name="type">
                  <option value="championship">Championnat</option>
                  <option value="international_regatta">
                    Régate internationale
                  </option>
                  <option value="cup">Coupe</option>
                  <option value="national_regatta">Régate nationale</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <label>
                Date de début
                <input name="startDate" type="date" required />
              </label>
              <label>
                Organisateur
                <input name="organizer" />
              </label>
              <label>
                Date de fin
                <input name="endDate" type="date" required />
              </label>
              <label>
                Pays
                <input name="country" />
              </label>
              <label>
                Site web
                <input name="website" type="url" />
              </label>
            </div>
            <label className="competition-logo-upload">
              <Upload />
              {logo ? logo.name : "Téléverser le logo de la compétition"}
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    try {
                      validateProfileImage(file);
                      setLogo(file);
                    } catch (reason) {
                      setError(
                        reason instanceof Error
                          ? reason.message
                          : "Logo invalide.",
                      );
                    }
                  }
                }}
              />
            </label>
          </section>
          <section>
            <h2>2. Catégories & disciplines</h2>
            <fieldset>
              <legend>Catégories d’âge</legend>
              {categories.map((value) => (
                <label key={value}>
                  <input name="categories" type="checkbox" value={value} />
                  {value}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Disciplines</legend>
              {disciplines.map((value) => (
                <label key={value}>
                  <input name="disciplines" type="checkbox" value={value} />
                  {value}
                </label>
              ))}
            </fieldset>
            <div className="competition-form-grid">
              <label>
                Genre
                <select name="gender">
                  <option value="all">Tous</option>
                  <option value="male">Hommes</option>
                  <option value="female">Femmes</option>
                  <option value="mixed">Mixte</option>
                </select>
              </label>
              <label>
                Niveau
                <select name="level">
                  <option value="international">International</option>
                  <option value="national">National</option>
                  <option value="regional">Régional</option>
                  <option value="local">Local</option>
                </select>
              </label>
            </div>
          </section>
          <section>
            <h2>3. Règles & publication</h2>
            <div className="competition-form-grid">
              <label>
                Nombre d’épreuves
                <input name="eventCount" type="number" min="0" />
              </label>
              <label>
                Date limite d’inscription
                <input name="registrationDeadline" type="date" />
              </label>
              <label>
                Contact
                <input name="contact" />
              </label>
              <label>
                Club ID
                <input name="clubId" />
              </label>
            </div>
            <label>
              <input name="published" type="checkbox" /> Publier la compétition
            </label>
            <label>
              <input name="onlineRegistration" type="checkbox" /> Autoriser les
              inscriptions en ligne
            </label>
            <label>
              Notes
              <textarea name="notes" />
            </label>
          </section>
        </main>
        <aside>
          <h2>Résumé de la compétition</h2>
          <p>Toutes les informations seront enregistrées dans Firestore.</p>
          {error && <div className="error-card">{error}</div>}
          <button className="button primary" disabled={isSubmitting}>
            <Save />
            {isSubmitting ? "Enregistrement…" : "Enregistrer la compétition"}
          </button>
        </aside>
      </form>
    </AppShell>
  );
}
export default function NewCompetitionPage() {
  return (
    <ProtectedPage allowedRoles={["coach", "club_admin", "superadmin"]}>
      <NewCompetitionContent />
    </ProtectedPage>
  );
}
