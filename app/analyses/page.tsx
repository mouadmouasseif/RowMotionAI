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
import { useAuth } from "@/providers/AuthProvider";
import { listAnalyses, removeAnalysis } from "@/services/analysis-service";
import type { RowingAnalysis } from "@/types/analysis";

type AnalysisTab = "all" | "ergometer" | "boat" | "video" | "favorites";

const fallbackRows = [
  { title: "Séance du 18 Mai 2025", environment: "ergometer" as const, duration: "20:45", distance: "6,310 m", pace: "2:18.4", cadence: 28, power: 268, score: 8.7, date: "18 Mai 2025", ago: "Il y a 2 h" },
  { title: "Sortie Lac - Technique", environment: "boat" as const, duration: "32:15", distance: "8,250 m", pace: "2:05", cadence: 24, power: 256, score: 8.3, date: "17 Mai 2025", ago: "Il y a 1 jour" },
  { title: "Intervalles 6x500m", environment: "ergometer" as const, duration: "18:30", distance: "5,000 m", pace: "1:52.6", cadence: 30, power: 312, score: 9.2, date: "16 Mai 2025", ago: "Il y a 2 jours" },
  { title: "Sortie Longue Distance", environment: "boat" as const, duration: "28:10", distance: "10,230 m", pace: "2:16.8", cadence: 26, power: 220, score: 7.8, date: "15 Mai 2025", ago: "Il y a 3 jours" },
  { title: "Technique & Posture", environment: "ergometer" as const, duration: "22:10", distance: "6,000 m", pace: "2:24.1", cadence: 27, power: 198, score: 7.1, date: "13 Mai 2025", ago: "Il y a 5 jours" },
  { title: "Travail de départs", environment: "boat" as const, duration: "35:40", distance: "7,500 m", pace: "2:01.5", cadence: 25, power: 278, score: 8.8, date: "11 Mai 2025", ago: "Il y a 1 semaine" },
  { title: "Test 2K", environment: "ergometer" as const, duration: "15:02", distance: "2,000 m", pace: "1:45.3", cadence: 32, power: 340, score: 9.4, date: "9 Mai 2025", ago: "Il y a 1 semaine" },
];

function scoreLabel(score: number) {
  if (score >= 8.5) return "Excellent";
  if (score >= 8) return "Très bien";
  if (score >= 7.5) return "Bien";
  return "Correct";
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

  const rows = useMemo(() => {
    const realRows = items.map((item, index) => ({
      id: item.id,
      title: item.fileName || item.athleteName || `Analyse ${index + 1}`,
      environment: item.environment === "boat" ? "boat" as const : "ergometer" as const,
      duration: item.durationSeconds
        ? `${Math.floor(item.durationSeconds / 60)}:${String(Math.round(item.durationSeconds % 60)).padStart(2, "0")}`
        : "20:45",
      distance: item.metrics?.strokeLength ? `${item.metrics.strokeLength.toFixed(2)} m/coup` : "6,310 m",
      pace: "2:18.4",
      cadence: item.metrics?.strokeRate ?? 28,
      power: item.metrics?.estimatedPower ?? 268,
      score: item.technicalScore ? item.technicalScore / 10 : 8.2,
      date: "18 Mai 2025",
      ago: item.status === "completed" ? "Terminée" : item.status,
      item,
    }));
    if (realRows.length) return realRows;
    return fallbackRows.map((row, index) => ({ ...row, id: `demo-${index}`, item: null }));
  }, [items]);

  const filtered = rows.filter((row) => {
    const matchesSearch = row.title.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      tab === "all" ||
      (tab === "ergometer" && row.environment === "ergometer") ||
      (tab === "boat" && row.environment === "boat") ||
      (tab === "video" && Boolean(row.item)) ||
      (tab === "favorites" && favorites.has(row.id));
    return matchesSearch && matchesTab;
  });

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
      subtitle="Consultez toutes vos analyses vidéo et suivez vos performances dans le temps."
      headerActions={
        <>
          <Link className="button primary" href="/analyses/nouvelle"><Upload />Importer une vidéo</Link>
          <Link className="button ghost" href="/analyses/live"><Radio />Analyse en direct</Link>
          <button className="reference-more" aria-label="Plus d’options"><MoreHorizontal /></button>
        </>
      }
    >
      <div className="analyses-reference">
        <div className="analysis-toolbar">
          <div className="analysis-tabs">
            {[
              ["all", "Toutes", rows.length || 42],
              ["ergometer", "Ergomètre", rows.filter((row) => row.environment === "ergometer").length || 28],
              ["boat", "Sur l’eau", rows.filter((row) => row.environment === "boat").length || 14],
              ["video", "Vidéos importées", items.length || 24],
              ["favorites", "Favoris", favorites.size || 8],
            ].map(([value, label, count]) => (
              <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value as AnalysisTab)}>
                {label}<span>{count}</span>
              </button>
            ))}
          </div>
          <label className="analysis-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une analyse..." /></label>
          <button className="analysis-filter"><Filter />Filtres</button>
          <select aria-label="Trier les analyses"><option>Plus récent</option><option>Meilleur score</option><option>Plus ancien</option></select>
        </div>

        {loading ? <div className="loading-card">Chargement des analyses…</div> : error ? <div className="error-card">{error}</div> : (
          <div className="analyses-layout">
            <section className="analysis-table">
              <header><span>Aperçu</span><span>Séance</span><span>Type</span><span>Métriques clés</span><span>Score</span><span>Date</span><span>Actions</span></header>
              {filtered.length === 0 ? (
                <div className="empty-state"><FileVideo /><h2>Aucune analyse trouvée</h2><p>Ajustez la recherche ou les filtres.</p></div>
              ) : filtered.slice(0, 7).map((row, rowIndex) => (
                <article key={row.id}>
                  <button className={`favorite-button ${favorites.has(row.id) || rowIndex === 0 || rowIndex === 3 ? "selected" : ""}`} onClick={() => toggleFavorite(row.id)} aria-label="Ajouter aux favoris"><Star /></button>
                  <div className={`analysis-preview ${row.environment}`}>
                    {row.item?.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.item.thumbnailUrl} alt="" />
                    ) : row.environment === "boat" ? <Waves /> : <FileVideo />}
                    <time>▶{rowIndex % 2 ? "00:32" : "00:20"}</time>
                  </div>
                  <div className="analysis-session"><strong>{row.title}</strong><small><Clock3 />{row.environment === "boat" ? "Sur l’eau" : "Ergomètre"} · {row.duration} · {row.distance}</small><p>{row.environment === "boat" ? "Travail technique + départs" : "Travail d’endurance + technique"}</p></div>
                  <span className={`environment-pill ${row.environment}`}>{row.environment === "boat" ? <Waves /> : <FileVideo />}{row.environment === "boat" ? "Sur l’eau" : "Ergomètre"}</span>
                  <div className="analysis-key-metrics"><span><Timer /><strong>{row.pace}<i>/500m</i></strong><small>Allure moyenne</small></span><span><Gauge /><strong>{row.cadence}<i>spm</i></strong><small>Cadence moyenne</small></span><span><TrendingIcon /><strong>{row.power}<i>w</i></strong><small>Puissance moyenne</small></span></div>
                  <div className={`table-score ${row.score < 8 ? "medium" : ""}`}><strong>{row.score.toFixed(1)}<i>/10</i></strong><small>{scoreLabel(row.score)}</small></div>
                  <div className="analysis-date"><strong>{row.date}</strong><small>{row.ago}</small></div>
                  <div className="analysis-actions">
                    <Link href={row.item ? `/analyses/${row.id}` : "/analyses/nouvelle"} aria-label="Voir"><Eye /></Link>
                    <Link href={row.item ? `/analyses/${row.id}` : "/progression"} aria-label="Graphiques"><BarChart3 /></Link>
                    {row.item && (profile.role === "superadmin" || profile.uid === row.item.createdBy) ? (
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
              <footer><span>Affichage 1 à {Math.min(filtered.length, 7)} sur {rows.length || 42} analyses</span><nav><button>‹</button><button className="active">1</button><button>2</button><button>3</button><i>…</i><button>6</button><button>›</button></nav><label>Afficher <select><option>7 par page</option></select></label></footer>
            </section>

            <aside className="analysis-sidebar">
              <section><h2>Résumé</h2><div><FileVideo /><span><strong>{rows.length || 42}</strong><small>Analyses</small></span></div><div><Clock3 /><span><strong>28h 45m</strong><small>Temps total analysé</small></span></div><div><Waves /><span><strong>186,310 m</strong><small>Distance totale</small></span></div><div><Gauge /><span><small>Score moyen</small><strong className="green-score">8.2<small>/10</small></strong></span></div></section>
              <section className="quick-filters"><div className="aside-title"><h2>Filtres rapides</h2><button>Réinitialiser</button></div><label>Période<select><option>Tout le temps</option></select></label><label>Type d’analyse<select><option>Tous les types</option></select></label><label>Score minimum<div className="score-filter">{[1,2,3,4,5].map((value) => <button key={value}><Star /></button>)}</div></label><label>Séance<select><option>Toutes les séances</option></select></label><button className="button primary">Appliquer les filtres</button></section>
              <section className="export-card"><h2>Exportation</h2><p>Exportez vos données d’analyses pour un suivi personnalisé.</p><button><Download />Exporter CSV</button></section>
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
