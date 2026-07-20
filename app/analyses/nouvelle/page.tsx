"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Dumbbell, ShipWheel, Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { AthleteSelector } from "@/components/AthleteSelector";
import { useAuth } from "@/providers/AuthProvider";
import { createAnalysis, updateAnalysis } from "@/services/analysis-service";
import { saveLocalAnalysisVideo } from "@/services/local-video-service";
import { isCloudVideoStorageEnabled, uploadAnalysisVideo, validateAnalysisVideo } from "@/services/storage-service";
import type { AnalysisEnvironment } from "@/types/analysis";
import type { UserProfile } from "@/types/user";

function NewAnalysisContent() {
  const { profile } = useAuth(); const router = useRouter(); const params = useSearchParams();
  const requested = params.get("environment"); const [environment, setEnvironment] = useState<AnalysisEnvironment>(requested === "ergometer" ? "ergometer" : "boat");
  const [athlete, setAthlete] = useState<UserProfile | null>(null); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(""); const [progress, setProgress] = useState(0); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  if (!profile) return null;
  const submit = async () => {
    if (!file || !athlete) { setError("Sélectionnez un athlète et une vidéo."); return; }
    setBusy(true); setError("");
    try {
      const id = await createAnalysis({ athleteId: athlete.uid, athleteName: `${athlete.firstName} ${athlete.lastName}`.trim(), environment, sourceType: "video", profile, fileName: file.name });
      if (isCloudVideoStorageEnabled) {
        const uploaded = await uploadAnalysisVideo(id, file, setProgress);
        await updateAnalysis(id, { videoUrl: uploaded.url, storagePath: uploaded.path, videoStorageMode: "firebase", status: "processing" });
      } else {
        const localPath = await saveLocalAnalysisVideo(id, file, setProgress);
        await updateAnalysis(id, { videoUrl: null, storagePath: localPath, videoStorageMode: "local", status: "processing" });
      }
      router.replace(`/analyses/${id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Impossible d’importer cette vidéo."); setBusy(false); }
  };
  return <AppShell title="Nouvelle analyse" subtitle="Assistant d’import vidéo">
    {!isCloudVideoStorageEnabled && <div className="local-mode-banner"><strong>Mode vidéo local</strong><span>La vidéo reste uniquement dans ce navigateur et n’est pas envoyée sur Firebase Storage.</span></div>}
    <div className="step-card"><span className="step-number">1</span><h2>Athlète analysé</h2><AthleteSelector value={athlete} onChange={setAthlete} initialId={params.get("athleteId")} />{athlete && <p className="selection-confirm"><CheckCircle2 />Athlète sélectionné : {athlete.firstName} {athlete.lastName}</p>}</div>
    <div className="step-card"><span className="step-number">2</span><h2>Environnement</h2><div className="choice-grid"><button className={environment === "boat" ? "selected" : ""} onClick={() => setEnvironment("boat")}><ShipWheel /><strong>Analyse en bateau</strong><small>Posture, rythme, trajectoire, stabilité et symétrie.</small></button><button className={environment === "ergometer" ? "selected" : ""} onClick={() => setEnvironment("ergometer")}><Dumbbell /><strong>Ergomètre</strong><small>Angles, séquence jambes-tronc-bras, cadence et puissance.</small></button></div></div>
    <div className="step-card"><span className="step-number">3</span><h2>Vidéo</h2>{file ? <div className="video-preview"><video controls src={preview} /><div><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(1)} Mo</small><button disabled={busy} onClick={() => { URL.revokeObjectURL(preview); setFile(null); setPreview(""); }}><X />Retirer</button></div></div> : <label className="upload-zone"><Upload /><strong>Choisir une vidéo</strong><small>MP4, MOV ou WebM · 250 Mo maximum</small><input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(event) => { const selected = event.target.files?.[0]; if (!selected) return; try { validateAnalysisVideo(selected); setFile(selected); setPreview(URL.createObjectURL(selected)); setError(""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Fichier invalide."); } }} /></label>}{busy && <div className="progress-track"><span style={{ width: `${progress}%` }} /><small>{progress}% enregistré</small></div>}{error && <div className="error-card">{error}</div>}<button className="button primary submit-analysis" disabled={busy || !file} onClick={() => void submit()}>{busy ? "Enregistrement en cours…" : "Enregistrer et lancer l’analyse"}</button></div>
  </AppShell>;
}
export default function NewAnalysisPage() { return <ProtectedPage><NewAnalysisContent /></ProtectedPage>; }
