"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Download,
  Filter,
  MapPin,
  Medal,
  Plus,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import {
  deleteCompetition,
  listCompetitionResults,
  listCompetitions,
} from "@/services/competition-service";
import type { Competition, CompetitionResult } from "@/types/competition";

const statusLabels: Record<Competition["status"], string> = {
  planned: "Planifiée",
  open: "Inscriptions ouvertes",
  completed: "Terminée",
  cancelled: "Annulée",
};

function CompetitionsContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Competition[]>([]);
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [scope, setScope] = useState<"mine" | "all">("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [competitions, rows] = await Promise.all([
      listCompetitions(),
      listCompetitionResults(),
    ]);
    setItems(competitions);
    setResults(rows);
    setSelectedId((current) =>
      competitions.some((item) => item.id === current)
        ? current
        : competitions[0]?.id ?? "",
    );
  }, []);

  useEffect(() => {
    void load().catch(() => setError("Impossible de charger les compétitions."));
  }, [load]);

  const canManage = Boolean(
    profile && ["COACH", "CLUB_ADMIN", "SUPER_ADMIN"].includes(profile.role),
  );
  const visibleItems = useMemo(() => {
    if (!profile || scope === "all") return items;
    if (profile.role === "COACH") {
      return items.filter((item) => item.createdBy === profile.uid);
    }
    if (profile.role === "CLUB_ADMIN") {
      return items.filter((item) => item.clubId === profile.clubId);
    }
    return items.filter((item) => item.createdBy === profile.uid);
  }, [items, profile, scope]);

  useEffect(() => {
    if (!visibleItems.some((item) => item.id === selectedId)) {
      setSelectedId(visibleItems[0]?.id ?? "");
    }
  }, [selectedId, visibleItems]);

  if (!profile) return null;
  const selected = visibleItems.find((item) => item.id === selectedId) ?? null;
  const selectedResults = results.filter(
    (result) => result.competitionId === selected?.id,
  );
  const canDelete =
    selected &&
    (profile.role === "SUPER_ADMIN" ||
      (profile.role === "CLUB_ADMIN" && selected.clubId === profile.clubId) ||
      (profile.role === "COACH" && selected.createdBy === profile.uid));

  const remove = async () => {
    if (!selected || !canDelete) return;
    if (!window.confirm(`Supprimer définitivement la compétition « ${selected.name} » ?`)) {
      return;
    }
    try {
      setError("");
      setMessage("");
      await deleteCompetition(profile, selected.id);
      setItems((current) => current.filter((item) => item.id !== selected.id));
      setResults((current) =>
        current.filter((row) => row.competitionId !== selected.id),
      );
      setMessage("Compétition et résultats associés supprimés.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Suppression impossible.");
    }
  };

  return (
    <AppShell
      referenceMode
      title="Compétitions"
      subtitle="Toutes les compétitions, leurs participants et leurs résultats."
      headerActions={
        <>
          {canManage && (
            <Link className="button primary" href="/competitions/nouvelle">
              <Plus />
              Créer une compétition
            </Link>
          )}
          <button className="button ghost"><Download />Exporter</button>
          <button className="button ghost"><Filter />Filtres</button>
        </>
      }
    >
      <div className="competitions-reference">
        <nav className="directory-tabs">
          <button className={scope === "mine" ? "active" : ""} onClick={() => setScope("mine")}>
            Mes compétitions
          </button>
          <button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>
            Toutes les compétitions <i>{items.length}</i>
          </button>
          <Link href="/competitions/calendrier">Calendrier</Link>
        </nav>
        {error && <div className="error-card">{error}</div>}
        {message && <div className="notice-card">{message}</div>}
        {visibleItems.length === 0 ? (
          <div className="empty-state">
            <Trophy />
            <h2>Aucune compétition dans cette vue</h2>
            <p>Affichez toutes les compétitions ou créez-en une nouvelle.</p>
            {canManage && (
              <Link className="button primary" href="/competitions/nouvelle">
                Ajouter une compétition
              </Link>
            )}
          </div>
        ) : (
          <>
            <section className="competition-overview">
              <article className="competition-list-card">
                <h2>{scope === "all" ? "Toutes les compétitions" : "Mes compétitions"}</h2>
                {visibleItems.map((item) => (
                  <button
                    className={item.id === selected?.id ? "active" : ""}
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <time>
                      {new Date(`${item.startDate}T12:00:00`).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </time>
                    <span>
                      <strong>{item.name}</strong>
                      <small><MapPin />{item.location}</small>
                    </span>
                    <em className={item.status}>{statusLabels[item.status]}</em>
                  </button>
                ))}
              </article>
              <article className="competition-summary-card">
                <div className="reference-card-title">
                  <h2>{selected?.name}</h2>
                  <span className="competition-summary-actions">
                    <em>{selected ? statusLabels[selected.status] : ""}</em>
                    {canDelete && (
                      <button className="danger-button" onClick={() => void remove()}>
                        <Trash2 />
                        Supprimer
                      </button>
                    )}
                  </span>
                </div>
                <p>
                  <CalendarDays />
                  {selected?.startDate} — {selected?.endDate}
                  <MapPin />
                  {selected?.location}
                </p>
                <nav>
                  <button className="active">Classements</button>
                  <button>Épreuves</button>
                  <button>Participants</button>
                  <button>Fichiers et médias</button>
                </nav>
                <div className="competition-summary-stats">
                  <span><small>Épreuves</small><strong>{selected?.eventCount ?? 0}</strong></span>
                  <span>
                    <small>Médailles</small>
                    <strong>
                      {selectedResults.reduce(
                        (sum, row) => sum + row.gold + row.silver + row.bronze,
                        0,
                      )}
                    </strong>
                  </span>
                  <span>
                    <small>Participants</small>
                    <strong>{new Set(selectedResults.map((row) => row.athleteId)).size}</strong>
                  </span>
                  <span>
                    <small>Clubs</small>
                    <strong>
                      {new Set(selectedResults.map((row) => row.clubId).filter(Boolean)).size}
                    </strong>
                  </span>
                </div>
              </article>
            </section>
            <section className="competition-rankings">
              <article>
                <h2>Classement — {selected?.name}</h2>
                <CompetitionTable rows={selectedResults} />
              </article>
              <article>
                <h2>Classement général</h2>
                <CompetitionTable rows={results} />
              </article>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function CompetitionTable({ rows }: { rows: CompetitionResult[] }) {
  return (
    <div className="competition-table">
      <header>
        <span>Rang</span><span>Athlète</span><span>Catégorie</span><span>Points</span>
        <span><Medal /> Or</span><span>Argent</span><span>Bronze</span>
      </header>
      {rows.length ? (
        rows.slice(0, 10).map((row) => (
          <div key={row.id}>
            <strong>{row.rank}</strong>
            <span><Users />{row.athleteName}</span>
            <em>{row.category}</em><strong>{row.points}</strong>
            <span>{row.gold}</span><span>{row.silver}</span><span>{row.bronze}</span>
          </div>
        ))
      ) : (
        <p>Aucun résultat enregistré.</p>
      )}
    </div>
  );
}

export default function CompetitionsPage() {
  return (
    <ProtectedPage>
      <CompetitionsContent />
    </ProtectedPage>
  );
}

