"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Clock3,
  Download,
  Eye,
  FileVideo,
  Filter,
  Gauge,
  MoreHorizontal,
  Radio,
  Search,
  Star,
  Timer,
  Trash2,
  Upload,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { toDate } from "@/lib/user-profile";
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses, removeAnalysis } from "@/services/analysis-service";
import type { RowingAnalysis } from "@/types/analysis";

type AnalysisTab = "all" | RowingAnalysis["environment"] | "video" | "favorites";

const environmentMeta: Record<RowingAnalysis["environment"], { label: string; description: string; water: boolean }> = {
  ergometer: { label: "Ergometre", description: "Travail d'endurance + technique", water: false },
  boat: { label: "Sur l'eau", description: "Travail technique + departs", water: true },
  double_scull: { label: "Bateau double", description: "Technique individuelle + synchronisation", water: true },
  beach_sprint: { label: "Aviron Beach", description: "Depart, embarquement, sprint et retour plage", water: true },
};

function formatAnalysisDate(value: unknown) {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "Date non disponible";
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "Non disponible";
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

function average(values: Array<number | null | undefined>) {
  const available = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return available.length ? available.reduce((sum, value) => sum + value, 0) / available.length : null;
}

function scoreLabel(score: number | null) {
  if (score == null) return "Non disponible";
  if (score >= 8.5) return "Excellent";
  if (score >= 8) return "Tres bien";
  if (score >= 7.5) return "Bien";
  return "Correct";
}

function formatScore(value: number | null) {
  return value == null ? "—" : value.toFixed(1);
}

function AnalysesContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<RowingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<AnalysisTab>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    void listAnalyses(profile)
      .then(setItems)
      .catch(() => setError("Impossible de charger les analyses."))
      .finally(() => setLoading(false));
  }, [profile]);

  const rows = useMemo(
    () =>
      items.map((item, index) => ({
        id: item.id,
        title: item.fileName || item.athleteName || `Analyse ${index + 1}`,
        environment: item.environment,
        duration: formatDuration(item.durationSeconds),
        distance: item.distance ? `${item.distance} m` : item.metrics?.strokeLength ? `${item.metrics.strokeLength.toFixed(2)} m/coup` : "Non disponible",
        pace: "Non disponible",
        cadence: item.metrics?.strokeRate ?? null,
        power: item.metrics?.estimatedPower ?? null,
        score: item.technicalScore == null ? null : item.technicalScore / 10,
        date: formatAnalysisDate(item.createdAt),
        ago: item.status === "completed" ? "Terminee" : item.status,
        item,
      })),
    [items],
  );

  const filtered = rows.filter((row) => {
    const matchesSearch = row.title.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      tab === "all" ||
      (tab === "ergometer" && row.environment === "ergometer") ||
      (tab === "boat" && row.environment === "boat") ||
      (tab === "double_scull" && row.environment === "double_scull") ||
      (tab === "beach_sprint" && row.environment === "beach_sprint") ||
      (tab === "video" && Boolean(row.item)) ||
      (tab === "favorites" && favorites.has(row.id));
    return matchesSearch && matchesTab;
  });

  const totalDuration = items.reduce((sum, item) => sum + (item.durationSeconds ?? 0), 0);
  const averageScore = average(items.map((item) => item.technicalScore));
  const averagePower = average(items.map((item) => item.metrics?.estimatedPower));

  if (!profile) return null;

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppShell
      referenceMode
      title="Analyses"
      subtitle="Consultez toutes vos analyses video et suivez vos performances dans le temps."
      headerActions={
        <>
          <Link className="button primary" href="/analyses/nouvelle"><Upload />Importer une video</Link>
          <Link className="button ghost" href="/analyses/live"><Radio />Analyse en direct</Link>
          <button className="reference-more" aria-label="Plus d'options"><MoreHorizontal /></button>
        </>
      }
    >
      <div className="analyses-reference">
        <div className="analysis-toolbar">
          <div className="analysis-tabs">
            {[
              ["all", "Toutes", rows.length],
              ["ergometer", "Ergometre", rows.filter((row) => row.environment === "ergometer").length],
              ["boat", "Sur l'eau", rows.filter((row) => row.environment === "boat").length],
              ["double_scull", "Bateau double", rows.filter((row) => row.environment === "double_scull").length],
              ["beach_sprint", "Aviron Beach", rows.filter((row) => row.environment === "beach_sprint").length],
              ["video", "Videos importees", items.length],
              ["favorites", "Favoris", favorites.size],
            ].map(([value, label, count]) => (
              <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value as AnalysisTab)}>
                {label}<span>{count}</span>
              </button>
            ))}
          </div>
          <label className="analysis-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une analyse..." /></label>
          <button className="analysis-filter"><Filter />Filtres</button>
          <select aria-label="Trier les analyses"><option>Plus recent</option><option>Meilleur score</option><option>Plus ancien</option></select>
        </div>

        {loading ? <div className="loading-card">Chargement des analyses...</div> : error ? <div className="error-card">{error}</div> : (
          <div className="analyses-layout">
            <section className="analysis-table">
              <header><span>Apercu</span><span>Seance</span><span>Type</span><span>Metriques cles</span><span>Score</span><span>Date</span><span>Actions</span></header>
              {filtered.length === 0 ? (
                <div className="empty-state"><FileVideo /><h2>Aucune analyse trouvee</h2><p>Importez une video ou ajustez la recherche.</p></div>
              ) : filtered.slice(0, 7).map((row) => (
                <article key={row.id}>
                  <button className={`favorite-button ${favorites.has(row.id) ? "selected" : ""}`} onClick={() => toggleFavorite(row.id)} aria-label="Ajouter aux favoris"><Star /></button>
                  <div className={`analysis-preview ${row.environment}`}>
                    {row.item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.item.thumbnailUrl} alt="" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/rowing-phases/neon-catch.png" alt="" />
                    )}
                    <time>{row.duration}</time>
                  </div>
                  <div className="analysis-session"><strong>{row.title}</strong><small><Clock3 />{environmentMeta[row.environment].label} - {row.duration} - {row.distance}</small><p>{environmentMeta[row.environment].description}</p></div>
                  <span className={`environment-pill ${row.environment}`}>{environmentMeta[row.environment].water ? <Waves /> : <FileVideo />}{environmentMeta[row.environment].label}</span>
                  <div className="analysis-key-metrics">
                    <span><Timer /><strong>{row.pace}</strong><small>Allure moyenne</small></span>
                    <span><Gauge /><strong>{row.cadence == null ? "Non disponible" : row.cadence.toFixed(1)}<i>{row.cadence == null ? "" : "spm"}</i></strong><small>Cadence moyenne</small></span>
                    <span><TrendingIcon /><strong>{row.power == null ? "Non disponible" : row.power.toFixed(0)}<i>{row.power == null ? "" : "w"}</i></strong><small>Puissance moyenne</small></span>
                  </div>
                  <div className={`table-score ${row.score != null && row.score < 8 ? "medium" : ""}`}><strong>{formatScore(row.score)}<i>{row.score == null ? "" : "/10"}</i></strong><small>{scoreLabel(row.score)}</small></div>
                  <div className="analysis-date"><strong>{row.date}</strong><small>{row.ago}</small></div>
                  <div className="analysis-actions">
                    <Link href={`/analyses/${row.id}`} aria-label="Voir"><Eye /></Link>
                    <Link href={`/analyses/${row.id}`} aria-label="Graphiques"><BarChart3 /></Link>
                    {(profile.role === "SUPER_ADMIN" || profile.uid === row.item.createdBy) ? (
                      <button aria-label="Supprimer" onClick={async () => {
                        if (!confirm("Supprimer cette analyse ?")) return;
                        try {
                          await removeAnalysis(row.id, profile);
                          setItems((current) => current.filter((analysis) => analysis.id !== row.id));
                        } catch (reason) {
                          setError(reason instanceof Error ? reason.message : "Suppression impossible.");
                        }
                      }}><Trash2 /></button>
                    ) : <button aria-label="Plus"><MoreHorizontal /></button>}
                  </div>
                </article>
              ))}
              <footer><span>Affichage 1 a {Math.min(filtered.length, 7)} sur {rows.length} analyses</span><nav><button disabled>‹</button><button className="active">1</button><button disabled>›</button></nav><label>Afficher <select><option>7 par page</option></select></label></footer>
            </section>

            <aside className="analysis-sidebar">
              <section>
                <h2>Resume</h2>
                <div><FileVideo /><span><strong>{rows.length}</strong><small>Analyses</small></span></div>
                <div><Clock3 /><span><strong>{totalDuration ? formatDuration(totalDuration) : "Non disponible"}</strong><small>Temps total analyse</small></span></div>
                <div><Waves /><span><strong>Non disponible</strong><small>Distance totale</small></span></div>
                <div><Gauge /><span><small>Score moyen</small><strong className="green-score">{averageScore == null ? "Non disponible" : (averageScore / 10).toFixed(1)}<small>{averageScore == null ? "" : "/10"}</small></strong></span></div>
                <div><TrendingIcon /><span><small>Puissance moyenne</small><strong>{averagePower == null ? "Non disponible" : `${averagePower.toFixed(0)} w`}</strong></span></div>
              </section>
              <section className="quick-filters"><div className="aside-title"><h2>Filtres rapides</h2><button>Reinitialiser</button></div><label>Periode<select><option>Tout le temps</option></select></label><label>Type d&apos;analyse<select><option>Tous les types</option></select></label><label>Score minimum<div className="score-filter">{[1,2,3,4,5].map((value) => <button key={value}><Star /></button>)}</div></label><label>Seance<select><option>Toutes les seances</option></select></label><button className="button primary">Appliquer les filtres</button></section>
              <section className="export-card"><h2>Exportation</h2><p>Exportez vos donnees d&apos;analyses pour un suivi personnalise.</p><button><Download />Exporter CSV</button></section>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TrendingIcon() {
  return <BarChart3 />;
}

export default function AnalysesPage() {
  return <ProtectedPage><AnalysesContent /></ProtectedPage>;
}
