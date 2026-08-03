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
  SlidersHorizontal,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";

const plans = [
  ["Plan annuel Aviron - 48 semaines", "Preparation annuelle performance avec volume, RMG, PPG, ergometre, mental et tests trimestriels.", "Nouveau", "48 semaines · 8 a 10 seances / semaine · Performance"],
  ["Plan Endurance & Technique", "Travail d’endurance fondamentale et perfectionnement technique.", "Actuel", "12 semaines · 4 séances / semaine · Intermédiaire"],
  ["Plan Puissance & Force", "Augmentez votre puissance et votre force maximale.", "Prochain", "8 semaines · 4 séances / semaine · Avancé"],
  ["Plan Pré-compétition", "Préparez-vous pour vos compétitions avec intensité.", "", "6 semaines · 5 séances / semaine · Avancé"],
  ["Plan Récupération Active", "Récupération et maintien de la condition physique.", "", "4 semaines · 3 séances / semaine · Débutant"],
  ["Plan Débutant - Base", "Acquérez les bases de l’aviron et construisez votre endurance.", "", "10 semaines · 3 séances / semaine · Débutant"],
] as const;

const annualPlan = {
  name: "Plan annuel Aviron - 48 semaines",
  type: "Preparation annuelle / Performance",
  duration: "48 semaines",
  rhythm: "8 a 10 seances / semaine · 1h30 a 2h par seance",
  totals: [
    ["Kilometrage", 1420, 5880, "km"],
    ["RMG", 18, 85, "h"],
    ["PPG", 9, 42, "h"],
    ["Ergometre", 26, 100, "h"],
    ["Seances", 118, 432, ""],
  ] satisfies AnnualTotal[],
  trimesters: [
    { label: "Trimestre 1", duration: "16 semaines", km: 1900, rmg: 25, ppg: 12, erg: 30, goals: ["Base aerobie", "Technique de rame", "Renforcement general", "Mobilite", "Coordination", "Debut puissance"] },
    { label: "Trimestre 2", duration: "16 semaines", km: 2380, rmg: 30, ppg: 14, erg: 50, goals: ["Developpement specifique", "Puissance", "Vitesse", "Seuil", "500 m / 1000 m / 2000 m", "Departs", "Relances", "Finish"] },
    { label: "Trimestre 3", duration: "16 semaines", km: 1600, rmg: 30, ppg: 12, erg: 30, goals: ["Competition", "Intensite specifique", "Simulation de course", "Affutage", "Finish", "Gestion tactique", "Reduction du volume"] },
  ],
};

const sessionCategories = [
  "Endurance fondamentale", "Endurance intensive", "Seuil", "VO2 Max", "Sprint", "Force", "Puissance", "Technique", "Ergometre",
  "Depart", "Finish", "Relance", "Virage / Tour", "Simulation de course", "Recuperation", "PPG", "RMG", "Mobilite", "Preparation mentale",
];

const sessionFields = ["nom", "objectif", "duree", "distance", "intensite", "cadence cible", "frequence cardiaque cible", "zone energetique", "recuperation", "series", "repetitions", "commentaires coach"];
type AnnualTotal = [label: string, done: number, target: number, unit: string];

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
            <section className="annual-rowing-plan">
              <header>
                <div>
                  <em>{annualPlan.type}</em>
                  <h2>{annualPlan.name}</h2>
                  <p>{annualPlan.duration} · {annualPlan.rhythm}</p>
                </div>
                <button className="button ghost"><SlidersHorizontal />Personnaliser</button>
              </header>
              <div className="annual-workout-structure">
                <article>
                  <strong>Structure principale</strong>
                  <span>8 a 10 fois / semaine</span>
                  <p>10 min echauffement a sec · 100 min aviron · 10 min etirements</p>
                </article>
                <article>
                  <strong>3 seances mixtes / semaine</strong>
                  <span>Travail a sec + bateau</span>
                  <p>5 min echauffement · 45 min circuit a sec · 70 min aviron · 10 min etirements</p>
                </article>
              </div>
              <div className="annual-progress-grid">
                {annualPlan.totals.map(([label, done, target, unit]) => {
                  const percent = Math.round((done / target) * 100);
                  return (
                    <article key={label}>
                      <span>{label}<strong>{done} / {target} {unit}</strong></span>
                      <i><b style={{ width: `${percent}%` }} /></i>
                      <small>{percent}% · charge annuelle</small>
                    </article>
                  );
                })}
              </div>
              <div className="trimester-grid">
                {annualPlan.trimesters.map((trimester) => (
                  <article key={trimester.label}>
                    <header><strong>{trimester.label}</strong><small>{trimester.duration}</small></header>
                    <div className="trimester-volume">
                      <span>{trimester.km} km</span><span>{trimester.rmg}h RMG</span><span>{trimester.ppg}h PPG</span><span>{trimester.erg}h ergo</span>
                    </div>
                    <p>{trimester.goals.join(" · ")}</p>
                    <footer>Fin de trimestre : test evaluation · visite medicale · rapport de progression · comparaison trimestre precedent</footer>
                  </article>
                ))}
              </div>
              <div className="session-taxonomy">
                <h3>Types de seances disponibles</h3>
                <div>{sessionCategories.map((item) => <span key={item}>{item}</span>)}</div>
                <p>Chaque seance peut contenir : {sessionFields.join(", ")}.</p>
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

