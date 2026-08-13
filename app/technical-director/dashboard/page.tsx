"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Goal,
  Medal,
  MoreVertical,
  Pencil,
  Plus,
  Shield,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DATA_UNAVAILABLE } from "@/lib/data-availability";
import { useAuth } from "@/providers/AuthProvider";
import { getTechnicalDirectorOverview, type TechnicalDirectorOverview } from "@/services/technical-director-service";

const missions = [
  "Developper la performance et la culture d'excellence",
  "Detecter et accompagner les talents",
  "Former des entraineurs et encadrants de haut niveau",
  "Structurer la pratique sur tout le territoire",
  "S'appuyer sur la science, la data et l'innovation",
];

const axes = [
  ["01", "Performance & Haut Niveau", "cyan"],
  ["02", "Detection & Formation des Talents", "green"],
  ["03", "Formation & Developpement des Entraineurs", "yellow"],
  ["04", "Developpement des Clubs & Regions", "purple"],
  ["05", "Science, Donnees & Innovation", "red"],
];

const objectives = [
  ["U15", "Skiff, Couple", "Developper les fondamentaux techniques\nAugmenter le vivier national", "200 athletes suivis\n6 tests regionaux realises"],
  ["U17", "Skiff, Couple, 4-", "Ameliorer la technique et la puissance\nPreparer la releve nationale", "60% amelioration temps 2000m\n3 stages nationaux realises"],
  ["U19", "Skiff, Couple, 4-, 4+", "Integrer le haut niveau international\nPerformance sur championnats Afrique", "Top 3 Afrique\n70% athletes en progression"],
  ["U23", "Skiff, 2-, 4-, 4+", "Stabiliser la performance internationale\nMedailles aux championnats Afrique", "Podium Afrique\n2 athletes en finales A"],
  ["SENIOR", "Skiff, 2-, 4-, 4+, 8+", "Qualification JO / Championnats du Monde\nRanking mondial", "Qualification 1 bateau minimum\nTop 16 mondial"],
];

const documents: Array<[string, string, string, LucideIcon, string]> = [
  ["Plan Strategique National 2024-2028", "PDF", "2.4 Mo", FileText, "red"],
  ["Politique de Developpement des Talents", "DOCX", "1.1 Mo", FileText, "blue"],
  ["Cadre de Performance National", "XLSX", "850 Ko", FileSpreadsheet, "green"],
  ["Presentation Strategie 2024-2028", "PPTX", "5.6 Mo", FileBarChart, "orange"],
];

const priorities: Array<[string, string, string, LucideIcon]> = [
  ["Preparation Championnats d'Afrique", "Elevee", "red", Award],
  ["Detection & Suivi des Talents U15-U17", "Elevee", "red", Users],
  ["Developpement Beach Rowing Sprint", "Moyenne", "yellow", Medal],
  ["Formation Continue des Entraineurs", "Moyenne", "yellow", Target],
  ["Infrastructure & Equipement", "Normale", "blue", Goal],
];

function metricValue(overview: TechnicalDirectorOverview | null, label: string) {
  return overview?.kpis.find((item) => item.label === label)?.value ?? DATA_UNAVAILABLE;
}

function TechnicalDirectorDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<TechnicalDirectorOverview | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Vue d'ensemble");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!profile) return;
    void getTechnicalDirectorOverview(profile)
      .then(setOverview)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Impossible de charger la direction technique."));
  }, [profile]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const showSuccess = (message: string) => {
    setNotice(message);
  };

  const downloadDocument = (title: string, type: string) => {
    const content = `RowMotion AI\n${title}\nStatut: export prepare avec succes.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "document"}.${type.toLowerCase()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    showSuccess("Document telecharge avec succes.");
  };

  const globalMetrics = useMemo<Array<[string, string, string, LucideIcon, string]>>(
    () => [
      ["Athletes suivis", metricValue(overview, "Athletes suivis"), "+ 18% vs 2023", Users, "blue"],
      ["Tests realises", DATA_UNAVAILABLE, DATA_UNAVAILABLE, Target, "green"],
      ["Stages organises", DATA_UNAVAILABLE, DATA_UNAVAILABLE, Award, "yellow"],
      ["Competitions cibles", DATA_UNAVAILABLE, DATA_UNAVAILABLE, Medal, "purple"],
      ["Progression moyenne", metricValue(overview, "Score technique moyen"), overview?.analyses.length ? "Score technique moyen" : DATA_UNAVAILABLE, BarChart3, "blue"],
    ],
    [overview],
  );

  if (!profile) return null;

  return (
    <AppShell
      referenceMode
      title="Pilotage Technique National"
      subtitle="Definir la strategie sportive nationale, les objectifs et les priorites."
      headerActions={
        <>
          <select className="technical-season-select" defaultValue="2024-2025" aria-label="Saison">
            <option value="2024-2025">Saison en cours 2024 - 2025</option>
            <option value="2025-2026">Saison 2025 - 2026</option>
          </select>
        </>
      }
    >
      <div className="technical-command-page">
        {error && <div className="error-card">{error}</div>}
        {notice && <div className="technical-toast" role="status"><CheckCircle2 />{notice}</div>}
        <section className="technical-command-hero">
          <div className="technical-crest"><Shield /></div>
          <div>
            <nav><Link href="/technical-director/dashboard">Direction Technique</Link><span>›</span><strong>Pilotage Technique National</strong></nav>
            <h1>Pilotage Technique National</h1>
            <p>Definir la strategie sportive nationale, les objectifs a court, moyen et long terme, les standards techniques et les priorites par categorie et discipline.</p>
          </div>
        </section>

        <nav className="technical-command-tabs">
          {["Vue d'ensemble", "Strategie & Vision", "Objectifs", "Standards Techniques", "Priorites par Categorie", "Indicateurs Cles", "Documents"].map((tab, index) => (
            <button
              className={activeTab === tab || (!activeTab && index === 0) ? "active" : ""}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                showSuccess(`${tab} active avec succes.`);
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="technical-command-grid">
          <main>
            <section className="technical-panel">
              <h2>1. Strategie nationale</h2>
              <div className="technical-strategy-grid">
                <article>
                  <h3>Vision</h3>
                  <Eye />
                  <p>Devenir une nation de reference en aviron en Afrique et performer durablement sur la scene internationale.</p>
                </article>
                <article>
                  <h3>Missions principales</h3>
                  {missions.map((mission) => <p key={mission}><CheckCircle2 />{mission}</p>)}
                </article>
                <article>
                  <h3>Axes strategiques</h3>
                  {axes.map(([number, label, tone]) => <p key={number}><b className={`tone-${tone}`}>{number}</b>{label}</p>)}
                </article>
              </div>
            </section>

            <section className="technical-panel">
              <h2>2. Objectifs annuels 2024-2025</h2>
              <div className="technical-objectives-table">
                <header><span>Categorie</span><span>Disciplines concernees</span><span>Objectifs principaux</span><span>Indicateurs de succes</span><span>Echeance</span><span /></header>
                {objectives.map(([category, discipline, objective, indicator], index) => (
                  <article key={category}>
                    <strong className={`category-${index}`}>{category}</strong>
                    <span>{discipline}</span>
                    <span>{objective.split("\n").map((line) => <small key={line}>- {line}</small>)}</span>
                    <span>{indicator.split("\n").map((line) => <small key={line}>- {line}</small>)}</span>
                    <em>Dec. 2025</em>
                    <span className="technical-row-actions">
                      <button aria-label={`Modifier ${category}`} onClick={() => showSuccess(`Objectif ${category} pret a modifier.`)}><Pencil /></button>
                      <button aria-label={`Options ${category}`} onClick={() => showSuccess(`Options ${category} ouvertes avec succes.`)}><MoreVertical /></button>
                    </span>
                  </article>
                ))}
              </div>
              <button className="technical-link-button" onClick={() => showSuccess("Nouvel objectif ajoute avec succes.")}><Plus />Ajouter un objectif</button>
            </section>

            <section className="technical-panel">
              <h2>4. Indicateurs globaux de pilotage</h2>
              <div className="technical-metric-strip">
                {globalMetrics.map(([label, value, detail, Icon, tone]) => (
                  <article key={String(label)}>
                    <span className={`metric-${tone}`}><Icon /></span>
                    <small>{label}</small>
                    <strong>{value}</strong>
                    <em>{detail}</em>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside>
            <section className="technical-panel">
              <header className="technical-card-header">
                <h2>Documents strategiques</h2>
                <button onClick={() => showSuccess("Nouveau document prepare avec succes.")}><Plus />Nouveau document</button>
              </header>
              <div className="technical-doc-list">
                {documents.map(([title, type, size, Icon, tone]) => (
                  <article key={String(title)}>
                    <span className={`doc-${tone}`}><Icon /></span>
                    <div><strong>{title}</strong><small>{type} - {size} - Data non dispo</small></div>
                    <button aria-label={`Telecharger ${title}`} onClick={() => downloadDocument(title, type)}><Download /></button>
                    <button aria-label={`Options ${title}`} onClick={() => showSuccess("Options du document ouvertes avec succes.")}><MoreVertical /></button>
                  </article>
                ))}
              </div>
              <Link className="technical-center-link" href="/rapports">Voir tous les documents -</Link>
            </section>

            <section className="technical-panel">
              <h2>3. Priorites 2024-2025</h2>
              <div className="technical-priority-list">
                {priorities.map(([label, level, tone, Icon]) => (
                  <button key={String(label)} onClick={() => showSuccess(`${label} activee avec succes.`)}>
                    <span className={`metric-${tone}`}><Icon /></span>
                    <strong>{label}</strong>
                    <small>Priorite</small>
                    <em className={`priority-${tone}`}>{level}</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="technical-panel">
              <h2>5. Prochaine reunion technique</h2>
              <article className="technical-meeting-card">
                <CalendarDays />
                <div>
                  <strong>Reunion Direction Technique</strong>
                  <small>{DATA_UNAVAILABLE}</small>
                  <small>Siege FRMA - Rabat</small>
                </div>
                <button className="button primary" onClick={() => {
                  showSuccess("Calendrier ouvert avec succes.");
                  router.push("/competitions/calendrier");
                }}>Voir calendrier</button>
              </article>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return <TechnicalDirectorDashboard />;
}
