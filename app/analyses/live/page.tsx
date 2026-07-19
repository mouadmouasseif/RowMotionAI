"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, CircleStop, Play, SwitchCamera } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import { createAnalysis, updateAnalysis } from "@/services/analysis-service";
import { MediaPipeReadyEngine } from "@/services/pose-analysis/pose-analysis-engine";
import type { AnalysisEnvironment } from "@/types/analysis";

function LiveContent() {
  const { profile } = useAuth(); const router = useRouter(); const videoRef = useRef<HTMLVideoElement>(null); const streamRef = useRef<MediaStream | null>(null); const engineRef = useRef(new MediaPipeReadyEngine());
  const [camera, setCamera] = useState(false); const [running, setRunning] = useState(false); const [facing, setFacing] = useState<"user" | "environment">("environment"); const [environment, setEnvironment] = useState<AnalysisEnvironment>("ergometer"); const [seconds, setSeconds] = useState(0); const [analysisId, setAnalysisId] = useState(""); const [error, setError] = useState("");
  useEffect(() => { if (!running) return; const timer = setInterval(() => setSeconds((value) => value + 1), 1000); return () => clearInterval(timer); }, [running]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  if (!profile) return null;
  const startCamera = async () => { try { streamRef.current?.getTracks().forEach((track) => track.stop()); const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false }); streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); } setCamera(true); setError(""); } catch { setError("L’analyse en direct nécessite l’accès à la caméra."); } };
  const stopCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCamera(false); setRunning(false); };
  const startAnalysis = async () => { if (!videoRef.current || !camera) return; try { await engineRef.current.initialize(); await engineRef.current.start(videoRef.current); const name = `${profile.firstName} ${profile.lastName}`.trim() || profile.email; const id = await createAnalysis({ athleteId: profile.uid, athleteName: name, environment, sourceType: "live", profile }); await updateAnalysis(id, { status: "processing" }); setAnalysisId(id); setSeconds(0); setRunning(true); } catch (reason) { setError(reason instanceof Error ? reason.message : "Impossible de démarrer l’analyse."); } };
  const stopAnalysis = async () => { engineRef.current.stop(); setRunning(false); if (analysisId) { await updateAnalysis(analysisId, { durationSeconds: seconds, status: "processing" }); router.push(`/analyses/${analysisId}`); } };
  return <AppShell title="Analyse en direct" subtitle="Caméra et biomécanique"><div className="live-toolbar"><select value={environment} onChange={(e) => setEnvironment(e.target.value as AnalysisEnvironment)} disabled={running}><option value="ergometer">Ergomètre</option><option value="boat">Bateau</option></select><button className="button ghost" disabled={running} onClick={() => { setFacing((value) => value === "user" ? "environment" : "user"); if (camera) void startCamera(); }}><SwitchCamera />Changer de caméra</button></div><div className="live-stage"><video ref={videoRef} muted playsInline /><div className="camera-status"><span className={camera ? "online" : ""} />{camera ? "Caméra active" : "Caméra arrêtée"}</div>{running && <div className="live-timer">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div>}</div><p className="demo-warning">Architecture prête pour MediaPipe Pose. Aucune mesure biomécanique n’est simulée dans cette version.</p>{error && <div className="error-card">{error}</div>}<div className="page-actions">{!camera ? <button className="button primary" onClick={() => void startCamera()}><Camera />Démarrer la caméra</button> : <button className="button ghost" onClick={stopCamera}><CircleStop />Arrêter la caméra</button>}{camera && !running && <button className="button primary" onClick={() => void startAnalysis()}><Play />Démarrer l’analyse</button>}{running && <button className="button primary" onClick={() => void stopAnalysis()}><CircleStop />Terminer et enregistrer</button>}</div></AppShell>;
}
export default function LivePage() { return <ProtectedPage><LiveContent /></ProtectedPage>; }
