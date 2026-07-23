"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  Download,
  Gauge,
  MoreHorizontal,
  Play,
  Radio,
  RotateCcw,
  Share2,
  Sparkles,
  Square,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AnalysisVideoSource } from "@/components/AnalysisVideoSource";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import {
  cancelAnalysis,
  retryAnalysis,
  subscribeToAnalysis,
  updateAnalysis,
} from "@/services/analysis-service";
import type { RowingAnalysis } from "@/types/analysis";

const phaseRows = [
  ["Prise d’eau", "8.5", "Excellent", "blue"],
  ["Impulsion", "9.2", "Excellent", "green"],
  ["Fin d’impulsion", "8.7", "Très bien", "yellow"],
  ["Retour", "7.8", "Bien", "purple"],
  ["Préparation", "8.3", "Très bien", "blue"],
];

function MiniGraph({ offset = 0 }: { offset?: number }) {
  const blue = [46,39,48,28,42,25,31,20,36,29,33,23,40,30,34,27,38,31,29,35];
  const green = [51,47,43,39,36,35,34,32,31,30,31,29,28,28,27,26,28,27,25,26];
  const path = (values: number[]) => values.map((value, index) => `${index ? "L" : "M"} ${index * 9} ${value + offset}`).join(" ");
  return <svg viewBox="0 0 175 65" preserveAspectRatio="none"><path d={path(blue)} /><path className="reference" d={path(green)} /></svg>;
}

function Detail({ id }: { id: string }) {
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<RowingAnalysis | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState("Vue d’ensemble");

  useEffect(() => {
    if (!profile) return;
    return subscribeToAnalysis(
      id,
      profile,
      (value) => {
        setAnalysis(value);
        setNote((current) => current || value.coachComment || "");
        setError("");
      },
      (reason) => setError(reason.message),
    );
  }, [id, profile]);

  if (!profile) return null;

  const score = analysis?.technicalScore ? analysis.technicalScore / 10 : 8.7;
  const cadence = analysis?.metrics?.strokeRate ?? 28;
  const power = analysis?.metrics?.estimatedPower ?? 268;
  const distance = "6,310";
  const subtitle = analysis
    ? `${analysis.fileName || "Séance du 18 Mai 2025"} · ${analysis.environment === "boat" ? "Sur l’eau" : "Ergomètre Concept2"} · 20:45 · 6,310 m`
    : "Chargement de la séance…";

  return (
    <AppShell
      referenceMode
      title="Analyse détaillée"
      subtitle={subtitle}
      headerActions={
        <>
          <button className="button ghost"><Download />Exporter le rapport</button>
          <button className="button ghost"><Share2 />Partager</button>
          <button className="reference-more" aria-label="Plus d’options"><MoreHorizontal /></button>
        </>
      }
    >
      <div className="analysis-detail-reference">
        <Link className="detail-back" href="/analyses"><ArrowLeft />Retour aux analyses</Link>
        {error ? <div className="error-card">{error}</div> : !analysis ? (
          <div className="loading-card">Chargement…</div>
        ) : (
          <>
            <nav className="detail-tabs">
              {["Vue d’ensemble", "Technique", "Courbes & données", "Comparaison", "Rapport"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
            </nav>

            {analysis.status !== "completed" && (
              <div className="detail-processing">
                <Gauge /><span><strong>Analyse {analysis.status}</strong><small>{analysis.progress?.progress ?? 0}% · {analysis.progress?.processedFrames ?? 0}/{analysis.progress?.totalFrames ?? 0} images</small></span>
                {["queued", "processing"].includes(analysis.status) && <button onClick={() => void cancelAnalysis(id)}><Square />Annuler</button>}
                {["failed", "cancelled"].includes(analysis.status) && <button onClick={() => void retryAnalysis(id)}><RotateCcw />Relancer</button>}
              </div>
            )}

            <section className="detail-top-grid">
              <article className="detail-video-card">
                <select aria-label="Angle de vue"><option>Angle du côté droit</option></select>
                <div className="detail-video-stage">
                  <AnalysisVideoSource analysis={analysis} />
                  {!analysis.videoUrl && analysis.videoStorageMode !== "local" && <div className="detail-video-placeholder"><Waves /><Play /></div>}
                  <div className="pose-overlay">
                    <span className="pose-trunk">Tronc<strong>14°</strong></span>
                    <span className="pose-arms">Bras<strong>92°</strong></span>
                    <span className="pose-legs">Jambes<strong>108°</strong></span>
                  </div>
                </div>
              </article>

              <article className="detail-phases">
                <h2>Phases du coup d’aviron</h2>
                <div className="phase-timeline">
                  {phaseRows.map(([name,, , color], index) => <div key={name}><i className={color}>{index + 1}</i><strong>{name}</strong><small>00:{String(index * 3).padStart(2, "0")}</small></div>)}
                </div>
                <hr />
                <h3>Instants clés</h3>
                {[
                  ["Prise d’eau", "Bonne position des épaules", "00:00"],
                  ["Fin d’impulsion", "Angle du dos correct", "00:04"],
                  ["Retour", "Jambes rentrées trop tôt", "00:07"],
                ].map(([name, detail, time]) => <div className="key-moment" key={name}><span><Waves /></span><p><strong>{name}</strong><small>{detail}</small></p><time>{time}</time><button><Play /></button></div>)}
                <Link href="#courbes">Afficher toutes les images clés <ChevronRight /></Link>
              </article>

              <aside className="detail-summary-column">
                <section className="global-score"><h2>Score technique global</h2><div><span className="large-score"><strong>{score.toFixed(1)}</strong><small>/10</small><em>Excellent</em></span><p>vs dernière analyse<strong>↑ +0.6</strong></p></div><p>Excellente séance ! Votre technique est solide avec quelques points d’amélioration pour gagner encore en efficacité.</p></section>
                <section className="key-metrics-card"><h2>Métriques clés</h2><div>{[["Cadence moyenne", cadence, "spm", "↑ 2 spm"],["Puissance moyenne", power, "w", "↑ 18 w"],["Distance", distance, "m", "↑ 310 m"],["Allure moyenne", "2:18.4", "/500m", "↓ 1.6 s"],["Temps total", "20:45", "", "↑ 45 s"],["Score régularité", "8.2", "/10", "↑ 0.5"]].map(([label,value,unit,trend]) => <span key={label}><small>{label}</small><strong>{value}<i>{unit}</i></strong><em className={String(trend).startsWith("↓") ? "down" : ""}>{trend}</em></span>)}</div></section>
              </aside>
            </section>

            <section className="detail-middle-grid">
              <article className="phase-evaluation"><h2>Évaluation technique par phase</h2>{phaseRows.map(([name,value,label,color], index) => <button className={index === 1 ? "active" : ""} key={name}><i className={color}>{index + 1}</i><span>{name}</span><strong>{value}<small>/10</small></strong><em>● {label}</em><b>⌄</b></button>)}</article>
              <article className="phase-detail"><div className="reference-card-title"><h2>Détails de la phase : Impulsion</h2><Link href="#">Détails biomécaniques <ChevronRight /></Link></div><div className="phase-detail-content">
                <section><h3>Angles moyens</h3>{[["Dos","14°","Idéal: 10°-20°"],["Bras","92°","Idéal: 85°-100°"],["Jambes","108°","Idéal: 100°-120°"]].map(([name,value,ideal]) => <div key={name}><span><strong>{name}</strong><small>{ideal}</small></span><b>{value}</b><Check /></div>)}</section>
                <section><h3>Force appliquée</h3>{[["Jambes",68],["Dos",22],["Bras",10]].map(([name,value]) => <div className="force-row" key={name}><span>{name}<strong>{value}%</strong></span><i><b style={{width:`${value}%`}} /></i></div>)}</section>
                <section className="body-position"><h3>Position du corps</h3><Radio /><ul><li>Dos droit <Check /></li><li>Épaules basses <Check /></li><li>Gainage actif <Check /></li><li>Trajectoire optimale <Check /></li></ul></section>
              </div></article>
              <aside className="recommendations-card"><div className="reference-card-title"><h2>Recommandations</h2><button>Priorité⌄</button></div>{[
                ["Améliorer le timing de retour","Rentrez les jambes plus tard et gardez le dos incliné jusqu’à la fin.","Élevée","high"],
                ["Gainage du tronc","Travaillez le gainage pour une meilleure stabilité du tronc.","Moyenne","medium"],
                ["Régularité de cadence","Votre cadence varie légèrement, essayez de rester plus constant.","Faible","low"],
              ].map(([title,text,priority,level]) => <div key={title}><Sparkles /><p><strong>{title}</strong><small>{text}</small><Link href="#">Voir l’exercice associé <ChevronRight /></Link></p><em className={level}>{priority}</em></div>)}<Link className="all-recommendations" href="#">Voir toutes les recommandations <ChevronRight /></Link></aside>
            </section>

            <section className="curves-card" id="courbes">
              <div className="reference-card-title"><h2>Courbes & données</h2><select><option>Toutes les phases</option></select></div>
              <div className="curve-grid">{[["Puissance (W)",power,"w"],["Cadence (spm)",cadence,"spm"],["Allure (/500m)","2:18.4","moyenne"],["Fréquence cardiaque (bpm)",146,"bpm"]].map(([name,value,unit],index) => <article key={name}><header><span>{name}</span><strong>{value}<small>{unit}</small></strong></header><MiniGraph offset={index * 2} /><footer><span>0:00</span><span>5:00</span><span>10:00</span><span>15:00</span><span>20:00</span></footer></article>)}</div>
              <footer className="curve-totals">{[["Nombre de coups","592"],["Longueur de coup","1.45 m"],["Force peak","612 N"],["Work per stroke","245 J"],["Calories","420 kcal"]].map(([name,value]) => <span key={name}><BarChart3 /><small>{name}</small><strong>{value}</strong></span>)}</footer>
            </section>

            {["coach", "club_admin", "superadmin"].includes(profile.role) && <section className="coach-note-reference"><h2>Note coach</h2><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ajoutez votre commentaire technique…" /><button className="button primary" onClick={() => void updateAnalysis(id, { coachComment: note })}>Enregistrer</button></section>}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function Page({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = use(params);
  return <ProtectedPage><Detail id={analysisId} /></ProtectedPage>;
}
