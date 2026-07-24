"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dumbbell, ShipWheel, Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { AthleteSelector } from "@/components/AthleteSelector";
import { useAuth } from "@/providers/AuthProvider";
import { createAnalysis, updateAnalysis } from "@/services/analysis-service";
import { saveLocalAnalysisVideo } from "@/services/local-video-service";
import { analyzeLocalVideo } from "@/services/local-pose-analysis-service";
import { inspectAnalysisVideo, MAX_VIDEO_SIZE_MB } from "@/services/storage-service";
import type { AnalysisEnvironment, AnalysisTrainingType } from "@/types/analysis";
import type { UserProfile } from "@/types/user";

function Content() {
  const { profile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [environment, setEnvironment] = useState<AnalysisEnvironment>(
    params.get("environment") === "ergometer" ? "ergometer" : "boat",
  );
  const [athlete, setAthlete] = useState<UserProfile | null>(null);
  const [trainingType, setTrainingType] = useState<AnalysisTrainingType>("technique");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  if (!profile) return null;

  const choose = async (selected: File) => {
    try {
      await inspectAnalysisVideo(selected);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(selected);
      });
      setFile(selected);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Fichier invalide.");
    }
  };

  const submit = async () => {
    if (!file || !athlete) {
      setError("Sélectionnez un athlète et une vidéo.");
      return;
    }

    setBusy(true);
    setError("");
    let createdAnalysisId = "";

    try {
      const metadata = await inspectAnalysisVideo(file);
      const id = await createAnalysis({
        athleteId: athlete.uid,
        athleteName: `${athlete.firstName} ${athlete.lastName}`.trim(),
        environment,
        trainingType,
        sourceType: "video",
        profile,
        fileName: file.name,
      });
      createdAnalysisId = id;

      const localPath = await saveLocalAnalysisVideo(id, file, setProgress);
      await updateAnalysis(id, {
        videoUrl: null,
        storagePath: localPath,
        videoStorageMode: "local",
        durationSeconds: metadata.duration,
        status: "processing",
        progress: {
          status: "processing",
          progress: 0,
          currentStep: "pose_detection",
          processedFrames: 0,
          totalFrames: 0,
        },
      });

      setProgress(0);
      const result = await analyzeLocalVideo(file, setProgress);
      await updateAnalysis(id, {
        status: "completed",
        metrics: result.metrics,
        technicalScore: result.technicalScore,
        errors: result.errors,
        recommendations: result.recommendations,
        cadenceTimeline: result.cadenceTimeline,
        metricsSource: "biomechanics_engine",
        progress: {
          status: "completed",
          progress: 100,
          currentStep: "completed",
          processedFrames: result.processedFrames,
          totalFrames: result.processedFrames,
        },
      });

      router.replace(`/analyses/${id}`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Import impossible.";
      if (createdAnalysisId) {
        void updateAnalysis(createdAnalysisId, {
          status: "failed",
          progress: {
            status: "failed",
            progress,
            currentStep: "pose_detection",
            processedFrames: 0,
            totalFrames: 0,
            errorMessage: message,
          },
        }).catch((updateError: unknown) =>
          console.error("[RowMotion] Unable to save local analysis failure:", updateError),
        );
      }
      setError(message);
      setBusy(false);
    }
  };

  return (
    <AppShell title="Nouvelle analyse" subtitle="Import vidéo biomécanique">
      <div className="notice-card">
        La vidéo restera stockée localement dans ce navigateur. Elle ne sera jamais envoyée vers Firebase.
      </div>
      <div className="step-card">
        <span className="step-number">1</span>
        <h2>Athlète analysé</h2>
        <AthleteSelector value={athlete} onChange={setAthlete} initialId={params.get("athleteId")} />
      </div>
      <div className="step-card">
        <span className="step-number">2</span>
        <h2>Discipline</h2>
        <div className="choice-grid">
          <button className={environment === "boat" ? "selected" : ""} onClick={() => setEnvironment("boat")}>
            <ShipWheel />Bateau
          </button>
          <button className={environment === "ergometer" ? "selected" : ""} onClick={() => setEnvironment("ergometer")}>
            <Dumbbell />Ergomètre
          </button>
          <button className={environment === "beach_sprint" ? "selected" : ""} onClick={() => setEnvironment("beach_sprint")}>
            <ShipWheel />Beach Sprint
          </button>
        </div>
      </div>
      <div className="step-card">
        <span className="step-number">3</span>
        <h2>Type d’entraînement</h2>
        <div className="choice-grid">
          {([
            ["technique", "Technique"],
            ["endurance", "Endurance"],
            ["power", "Puissance"],
            ["interval", "Intervalles"],
            ["recovery", "Récupération"],
            ["competition", "Compétition"],
          ] as const).map(([value, label]) => (
            <button key={value} className={trainingType === value ? "selected" : ""} onClick={() => setTrainingType(value)}>
              <Dumbbell />{label}
            </button>
          ))}
        </div>
      </div>
      <div className="step-card">
        <span className="step-number">4</span>
        <h2>Vidéo</h2>
        {file ? (
          <div className="video-preview">
            <video aria-label="Aperçu vidéo" controls src={preview} />
            <div>
              <strong>{file.name}</strong>
              <small>{(file.size / 1048576).toFixed(1)} Mo</small>
              <button
                disabled={busy}
                onClick={() => {
                  URL.revokeObjectURL(preview);
                  setFile(null);
                  setPreview("");
                }}
              >
                <X />Retirer
              </button>
            </div>
          </div>
        ) : (
          <label className="upload-zone">
            <Upload />
            <strong>Choisir une vidéo</strong>
            <small>MP4, MOV, WebM ou AVI · {MAX_VIDEO_SIZE_MB} Mo maximum</small>
            <input
              aria-label="Importer une vidéo"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) void choose(selected);
              }}
            />
          </label>
        )}
        {busy && (
          <div className="progress-track" aria-label="Progression de l’analyse">
            <span style={{ width: `${progress}%` }} />
            <small>{progress}% analysé</small>
          </div>
        )}
        {error && <div className="error-card">{error}</div>}
        <button className="button primary submit-analysis" disabled={busy || !file} onClick={() => void submit()}>
          {busy ? "Analyse en cours…" : "Analyser la vidéo localement"}
        </button>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <ProtectedPage>
      <Content />
    </ProtectedPage>
  );
}
