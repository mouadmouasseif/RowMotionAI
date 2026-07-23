"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, Clock3, Flame, MoreHorizontal, Plus, Search, Waves } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";

const plans = [
  ["Plan Endurance & Technique", "Travail d’endurance fondamentale et perfectionnement technique.", "Actuel", "68%", "12 semaines · 4 séances / semaine · Intermédiaire"],
  ["Plan Puissance & Force", "Augmentez votre puissance et votre force maximale.", "Prochain", "0%", "8 semaines · 4 séances / semaine · Avancé"],
  ["Plan Pré-compétition", "Préparez-vous pour vos compétitions avec intensité.", "", "42%", "6 semaines · 5 séances / semaine · Avancé"],
  ["Plan Récupération Active", "Récupération et maintien de la condition physique.", "Terminé", "100%", "4 semaines · 3 séances / semaine · Débutant"],
  ["Plan Débutant - Base", "Acquérez les bases de l’aviron et construisez votre endurance.", "", "25%", "10 semaines · 3 séances / semaine · Débutant"],
] as const;

const weeklyStats = [
  [Waves, "4 / 4", "Séances cette semaine"],
  [Clock3, "6h 45m", "Temps total"],
  [Waves, "98,2 km", "Distance totale"],
  [Flame, "2,560 kcal", "Calories brûlées"],
] as const;

function PlansContent() {
  return <AppShell referenceMode title="Plans d’entraînement" subtitle="Créez, suivez et adaptez vos plans pour atteindre vos objectifs." headerActions={<><button className="button primary"><Plus />Nouveau plan</button><button className="button ghost"><BookOpen />Bibliothèque</button><button className="reference-more"><MoreHorizontal /></button></>}>
    <div className="plans-reference">
      <nav className="directory-tabs"><button className="active">Mes plans</button><button>Plans recommandés</button><button>Plans club</button></nav>
      <div className="plans-layout">
        <main>
          <section className="current-plan"><div className="plan-image"><Waves /></div><div><em>Actuel</em><h2>Plan Endurance & Technique</h2><p>Développez votre endurance de base tout en améliorant votre technique de rame.</p><span><CalendarDays />12 semaines · 4 séances / semaine · Intermédiaire</span><label>Progression globale <strong>68%</strong><i><b /></i></label><footer>Fin du plan : 15 Juin 2025 <button>Voir détails</button></footer></div></section>
          <div className="plans-title"><h2>Tous mes plans</h2><label><Search /><input placeholder="Rechercher un plan..." /></label><select><option>Tous les statuts</option></select></div>
          <section className="plans-list">{plans.map(([title, description, status, progress, meta], index) => <article key={title}><div className={`plan-thumb plan-${index}`}><Waves /></div><div><span>{status && <em className={status === "Terminé" ? "done" : ""}>{status}</em>}<strong>{title}</strong></span><p>{description}</p><small><CalendarDays />{meta}</small></div><label><strong>{progress}</strong><small>Progression</small><i><b style={{ width: progress }} /></i></label><button><MoreHorizontal /></button></article>)}</section>
          <Link className="archived-plans" href="#">Voir les plans archivés (3)⌄</Link>
        </main>
        <aside>
          <section className="plan-objectives"><h2>Objectifs du plan</h2><ul><li>Améliorer l’endurance aérobie</li><li>Stabiliser la technique</li><li>Augmenter la cadence moyenne</li><li>Renforcer le gainage</li></ul><h3>Zones principales</h3><div><span>UT2</span><span>UT1</span><span>AT</span></div></section>
          <section><h2>Aperçu hebdomadaire</h2><div className="weekly-stats">{weeklyStats.map(([Icon, value, label]) => <span key={label}><Icon /><strong>{value}</strong><small>{label}</small></span>)}</div></section>
          <section className="calendar-card"><h2>Calendrier des séances</h2><strong>Mai 2025</strong><div className="calendar-grid">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim", ...Array.from({ length: 31 }, (_, index) => String(index + 1))].map((day, index) => <span className={day === "18" ? "selected" : index > 6 && index % 4 === 0 ? "trained" : ""} key={`${day}-${index}`}>{day}</span>)}</div></section>
          <section className="recent-sessions"><h2>Séances récentes</h2>{[["Ergomètre - Endurance", "8.7"], ["Sortie Lac - Technique", "8.3"], ["Interval Training 6x500m", "7.2"]].map(([name, score]) => <article key={name}><Waves /><p><strong>{name}</strong><small>18 Mai 2025 · 1h 20m · 15,2 km</small></p><em>{score}<small>/10</small></em></article>)}<a>Voir toutes les séances →</a></section>
        </aside>
      </div>
    </div>
  </AppShell>;
}

export default function PlansPage() {
  return <ProtectedPage><PlansContent /></ProtectedPage>;
}
