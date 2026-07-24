"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Download, Filter, MapPin, Medal, Plus, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import { listCompetitionResults, listCompetitions } from "@/services/competition-service";
import type { Competition, CompetitionResult } from "@/types/competition";

const statusLabels = { planned: "À venir", open: "Inscriptions ouvertes", completed: "Terminée", cancelled: "Annulée" };

function CompetitionsContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Competition[]>([]);
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    void Promise.all([listCompetitions(), listCompetitionResults()])
      .then(([competitions, rows]) => {
        setItems(competitions);
        setResults(rows);
        setSelectedId(competitions[0]?.id ?? "");
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Chargement impossible."));
  }, [profile]);
  if (!profile) return null;
  const canManage = ["coach", "club_admin", "superadmin"].includes(profile.role);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const selectedResults = results.filter((result) => result.competitionId === selected?.id);

  return <AppShell referenceMode title="Compétitions" subtitle="Calendrier, participants et résultats enregistrés dans Firebase." headerActions={<>{canManage && <Link className="button primary" href="/competitions/nouvelle"><Plus />Créer une compétition</Link>}<button className="button ghost"><Download />Exporter</button><button className="button ghost"><Filter />Filtres</button></>}>
    <div className="competitions-reference">
      <nav className="directory-tabs"><button className="active">Mes compétitions</button><button>Toutes les compétitions</button><Link href="/competitions/calendrier">Calendrier</Link></nav>
      {error && <div className="error-card">{error}</div>}
      {items.length === 0 ? <div className="empty-state"><Trophy /><h2>Aucune compétition</h2><p>Créez la première compétition du club.</p>{canManage && <Link className="button primary" href="/competitions/nouvelle">Ajouter une compétition</Link>}</div> : <>
        <section className="competition-overview"><article className="competition-list-card"><h2>Mes compétitions</h2>{items.map((item) => <button className={item.id === selected?.id ? "active" : ""} key={item.id} onClick={() => setSelectedId(item.id)}><time>{new Date(item.startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</time><span><strong>{item.name}</strong><small><MapPin />{item.location}</small></span><em className={item.status}>{statusLabels[item.status]}</em></button>)}</article>
          <article className="competition-summary-card"><div className="reference-card-title"><h2>{selected?.name}</h2><em>{selected ? statusLabels[selected.status] : ""}</em></div><p><CalendarDays />{selected?.startDate} — {selected?.endDate}　<MapPin />{selected?.location}</p><nav><button className="active">Classements</button><button>Épreuves</button><button>Participants</button><button>Fichiers & médias</button></nav><div className="competition-summary-stats"><span><small>Épreuves</small><strong>{selected?.eventCount ?? 0}</strong></span><span><small>Médailles</small><strong>{selectedResults.reduce((sum, row) => sum + row.gold + row.silver + row.bronze, 0)}</strong></span><span><small>Participants</small><strong>{new Set(selectedResults.map((row) => row.athleteId)).size}</strong></span><span><small>Clubs</small><strong>{new Set(selectedResults.map((row) => row.clubId).filter(Boolean)).size}</strong></span></div></article>
        </section>
        <section className="competition-rankings"><article><h2>Classement — {selected?.name}</h2><CompetitionTable rows={selectedResults} /></article><article><h2>Classement général</h2><CompetitionTable rows={results} /></article></section>
      </>}
    </div>
  </AppShell>;
}

function CompetitionTable({ rows }: { rows: CompetitionResult[] }) {
  return <div className="competition-table"><header><span>Rang</span><span>Athlète</span><span>Catégorie</span><span>Points</span><span><Medal /> Or</span><span>Argent</span><span>Bronze</span></header>{rows.length ? rows.slice(0, 10).map((row) => <div key={row.id}><strong>{row.rank}</strong><span><Users />{row.athleteName}</span><em>{row.category}</em><strong>{row.points}</strong><span>{row.gold}</span><span>{row.silver}</span><span>{row.bronze}</span></div>) : <p>Aucun résultat enregistré.</p>}</div>;
}
export default function CompetitionsPage() { return <ProtectedPage><CompetitionsContent /></ProtectedPage>; }
