"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  Flame,
  MoreHorizontal,
  Plus,
  Search,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";

const plans = [
  ["Plan Endurance & Technique", "Travail d’endurance fondamentale et perfectionnement technique.", "Actuel", "12 semaines · 4 séances / semaine · Intermédiaire"],
  ["Plan Puissance & Force", "Augmentez votre puissance et votre force maximale.", "Prochain", "8 semaines · 4 séances / semaine · Avancé"],
  ["Plan Pré-compétition", "Préparez-vous pour vos compétitions avec intensité.", "", "6 semaines · 5 séances / semaine · Avancé"],
  ["Plan Récupération Active", "Récupération et maintien de la condition physique.", "", "4 semaines · 3 séances / semaine · Débutant"],
  ["Plan Débutant - Base", "Acquérez les bases de l’aviron et construisez votre endurance.", "", "10 semaines · 3 séances / semaine · Débutant"],
] as const;

function PlansContent() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarDays = [
    ...Array.from({ length: firstDayOffset }, () => ""),
    ...Array.from({ length: daysInMonth }, (_, index) => String(index + 1)),
  ];
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 12 * 7);
  const formattedEndDate = endDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const monthLabel = today.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const weeklyStats = [
    [Waves, "0 / 4", "Séances cette semaine"],
    [Clock3, "0h 00m", "Temps total"],
    [Waves, "0 km", "Distance totale"],
    [Flame, "0 kcal", "Calories brûlées"],
  ] as const;

  return (
    <AppShell
      referenceMode
      title="Plans d’entraînement"
      subtitle="Les compteurs ont été réinitialisés. Commencez un nouveau cycle à partir d’aujourd’hui."
      headerActions={
        <>
          <button className="button primary"><Plus />Nouveau plan</button>
          <button className="button ghost"><BookOpen />Bibliothèque</button>
          <button className="reference-more" aria-label="Plus d’actions"><MoreHorizontal /></button>
        </>
      }
    >
      <div className="plans-reference">
        <nav className="directory-tabs">
          <button className="active">Mes plans</button>
          <button>Plans recommandés</button>
          <button>Plans club</button>
        </nav>
        <div className="plans-layout">
          <main>
            <section className="current-plan">
              <div className="plan-image"><Waves /></div>
              <div>
                <em>Actuel</em>
                <h2>Plan Endurance & Technique</h2>
                <p>Développez votre endurance de base tout en améliorant votre technique de rame.</p>
                <span><CalendarDays />12 semaines · 4 séances / semaine · Intermédiaire</span>
                <label>
                  Progression globale <strong>0%</strong>
                  <i><b style={{ width: "0%" }} /></i>
                </label>
                <footer>
                  Fin du plan : {formattedEndDate}
                  <button>Voir détails</button>
                </footer>
              </div>
            </section>
            <div className="plans-title">
              <h2>Tous mes plans</h2>
              <label><Search /><input placeholder="Rechercher un plan..." /></label>
              <select><option>Tous les statuts</option></select>
            </div>
            <section className="plans-list">
              {plans.map(([title, description, status, meta], index) => (
                <article key={title}>
                  <div className={`plan-thumb plan-${index}`}><Waves /></div>
                  <div>
                    <span>{status && <em>{status}</em>}<strong>{title}</strong></span>
                    <p>{description}</p>
                    <small><CalendarDays />{meta}</small>
                  </div>
                  <label>
                    <strong>0%</strong><small>Progression</small>
                    <i><b style={{ width: "0%" }} /></i>
                  </label>
                  <button aria-label={`Actions pour ${title}`}><MoreHorizontal /></button>
                </article>
              ))}
            </section>
            <Link className="archived-plans" href="#">Voir les plans archivés</Link>
          </main>
          <aside>
            <section className="plan-objectives">
              <h2>Objectifs du plan</h2>
              <ul>
                <li>Améliorer l’endurance aérobie</li>
                <li>Stabiliser la technique</li>
                <li>Augmenter la cadence moyenne</li>
                <li>Renforcer le gainage</li>
              </ul>
              <h3>Zones principales</h3>
              <div><span>UT2</span><span>UT1</span><span>AT</span></div>
            </section>
            <section>
              <h2>Aperçu hebdomadaire</h2>
              <div className="weekly-stats">
                {weeklyStats.map(([Icon, value, label]) => (
                  <span key={label}><Icon /><strong>{value}</strong><small>{label}</small></span>
                ))}
              </div>
            </section>
            <section className="calendar-card">
              <h2>Calendrier des séances</h2>
              <strong className="calendar-month-label">{monthLabel}</strong>
              <div className="calendar-grid">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                  <span className="calendar-weekday" key={day}>{day}</span>
                ))}
                {calendarDays.map((day, index) => (
                  <span
                    className={day === String(today.getDate()) ? "selected" : ""}
                    key={`${day || "empty"}-${index}`}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </section>
            <section className="recent-sessions">
              <h2>Séances récentes</h2>
              <div className="training-empty-state">
                <Waves />
                <strong>Aucune séance enregistrée</strong>
                <small>Les compteurs repartent de zéro à partir du {today.toLocaleDateString("fr-FR")}.</small>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default function PlansPage() {
  return (
    <ProtectedPage>
      <PlansContent />
    </ProtectedPage>
  );
}
