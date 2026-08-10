"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dumbbell, ShipWheel, Upload, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { AthleteSelector } from "@/components/AthleteSelector";
import { useAuth } from "@/providers/AuthProvider";
import { createAnalysis, queueAnalysis, updateAnalysis } from "@/services/analysis-service";
import { saveLocalAnalysisVideo } from "@/services/local-video-service";
import { analyzeLocalVideo } from "@/services/local-pose-analysis-service";
import { inspectAnalysisVideo, isCloudVideoStorageEnabled, MAX_VIDEO_SIZE_MB, uploadAnalysisVideo } from "@/services/storage-service";
import type { AnalysisDistanceType, AnalysisEnvironment, AnalysisScope, AnalysisStep, AnalysisTimelines, JointAngleRange, MetricSample, MuscleUsage } from "@/types/analysis";
import type { UserProfile } from "@/types/user";

const analysisTypeOptions: { value: AnalysisDistanceType; label: string; meters?: number }[] = [
  { value: "free_technique", label: "Technique libre" },
  { value: "250m", label: "250 m", meters: 250 },
  { value: "500m", label: "500 m", meters: 500 },
  { value: "750m", label: "750 m", meters: 750 },
  { value: "1000m", label: "1000 m", meters: 1000 },
  { value: "1500m", label: "1500 m", meters: 1500 },
  { value: "2000m", label: "2000 m", meters: 2000 },
  { value: "5000m", label: "5000 m", meters: 5000 },
  { value: "6000m", label: "6000 m", meters: 6000 },
  { value: "custom", label: "Distance personnalisee" },
  { value: "ergometer_test", label: "Test ergometre" },
  { value: "training", label: "Entrainement" },
  { value: "competition", label: "Competition" },
];

const stepLabels: Record<AnalysisStep, string> = {
  validation: "Validation du fichier",
  upload: "Sauvegarde video",
  video_preparation: "Preparation video",
  video_preprocessing: "Optimisation pour analyse",
  athlete_detection: "Detection athlete",
  pose_detection: "Estimation de pose",
  stroke_detection: "Detection des coups",
  biomechanics: "Biomecanique",
  metrics_calculation: "Calcul des metriques",
  recommendations: "Recommandations",
  report_generation: "Generation du rapport",
  saving_results: "Enregistrement",
  completed: "Termine",
};

function buildRange(samples: MetricSample[]): JointAngleRange {
  const values = samples.map((sample) => sample.value).filter((value) => Number.isFinite(value));
  if (!values.length) return { min: null, max: null, amplitude: null, measurementSource: "camera", confidence: null };
  const min = Math.round(Math.min(...values) * 10) / 10;
  const max = Math.round(Math.max(...values) * 10) / 10;
  return { min, max, amplitude: Math.round((max - min) * 10) / 10, measurementSource: "camera", confidence: null };
}

function buildJointRanges(timelines: AnalysisTimelines) {
  return {
    knee: buildRange(timelines.kneeAngle),
    hip: buildRange(timelines.hipAngle),
    trunk: buildRange(timelines.backAngle),
    elbow: buildRange(timelines.elbowAngle ?? []),
    shoulder: buildRange(timelines.shoulderAngle ?? []),
    wrist: { min: null, max: null, amplitude: null, measurementSource: "camera", confidence: null },
  } satisfies Record<string, JointAngleRange>;
}

function buildMuscleEstimation(muscleUsage: MuscleUsage) {
  return {
    groups: {
      Dos: muscleUsage.back,
      Jambes: muscleUsage.legs,
      Bras: muscleUsage.arms,
      Gainage: muscleUsage.core,
      Epaules: muscleUsage.shoulders,
    },
    note: "Contribution musculaire estimee depuis les amplitudes articulaires, la posture et la regularite. Ce n'est pas une mesure EMG directe.",
    measurementSource: "estimated" as const,
    confidence: null,
  };
}

function Content() {
  const { profile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const requestedEnvironment = params.get("environment");
  const [environment, setEnvironment] = useState<AnalysisEnvironment>(
    requestedEnvironment === "ergometer" || requestedEnvironment === "double_scull" || requestedEnvironment === "beach_sprint"
      ? requestedEnvironment
      : "boat",
  );
  const [athlete, setAthlete] = useState<UserProfile | null>(null);
  const [analysisScope, setAnalysisScope] = useState<AnalysisScope>("complete");
  const [analysisType, setAnalysisType] = useState<AnalysisDistanceType>("free_technique");
  const [customDistance, setCustomDistance] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>("validation");
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
      const optionDistance = analysisTypeOptions.find((item) => item.value === analysisType)?.meters;
      const selectedDistance = optionDistance ?? (analysisType === "custom" ? Number(customDistance) : null);
      const id = await createAnalysis({
        athleteId: athlete.uid,
        athleteName: `${athlete.firstName} ${athlete.lastName}`.trim(),
        environment,
        trainingType: "technique",
        analysisScope,
        analysisType,
        distance: Number.isFinite(selectedDistance) && selectedDistance ? selectedDistance : null,
        sourceType: "video",
        profile,
        fileName: file.name,
      });
      createdAnalysisId = id;

      setCurrentStep("upload");
      const storedVideo = isCloudVideoStorageEnabled
        ? await uploadAnalysisVideo(id, file, setProgress)
        : { path: await saveLocalAnalysisVideo(id, file, setProgress), url: null };
      await updateAnalysis(id, {
        videoUrl: storedVideo.url,
        storagePath: storedVideo.path,
        videoStorageMode: isCloudVideoStorageEnabled ? "firebase" : "local",
        durationSeconds: metadata.duration,
        status: "preparing",
        progress: {
          status: "preparing",
          progress: 100,
          currentStep: "video_preparation",
          processedFrames: 0,
          totalFrames: 0,
        },
      });

      if (isCloudVideoStorageEnabled) {
        await queueAnalysis(id);
        router.replace(`/analyses/${id}`);
        return;
      }

      setProgress(0);
      setCurrentStep("pose_detection");
      await updateAnalysis(id, {
        status: "analyzing",
        progress: {
          status: "analyzing",
          progress: 0,
          currentStep: "pose_detection",
          processedFrames: 0,
          totalFrames: 0,
        },
      });
      const result = await analyzeLocalVideo(file, setProgress, { environment });
      setCurrentStep("saving_results");
      await updateAnalysis(id, {
        status: "completed",
        metrics: result.metrics,
        technicalScore: result.technicalScore,
        errors: result.errors,
        recommendations: result.recommendations,
        cadenceTimeline: result.cadenceTimeline,
        cycles: result.cycles,
        phases: result.phases,
        timelines: result.timelines,
        muscleUsage: result.muscleUsage,
        biomechanics: { jointRanges: buildJointRanges(result.timelines) },
        muscleEstimation: buildMuscleEstimation(result.muscleUsage),
        crewAnalysis: environment === "double_scull" ? result.crewAnalysis ?? null : null,
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
      {isCloudVideoStorageEnabled && (
        <div className="notice-card">
          La video sera envoyee vers Firebase Storage avec un upload resumable pour permettre le traitement serveur.
        </div>
      )}
      <div className="notice-card" hidden={isCloudVideoStorageEnabled}>
        La vidéo restera stockée localement dans ce navigateur. Elle ne sera jamais envoyée vers Firebase.
      </div>
      <div className="analysis-all-in-one-note">
        <strong>Une seule vidéo, une analyse complète</strong>
        <span>RowMotion analyse automatiquement les phases du coup, les angles, la technique, la cadence, la symétrie, les performances disponibles et la comparaison avec votre historique.</span>
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
          <button className={environment === "double_scull" ? "selected" : ""} onClick={() => setEnvironment("double_scull")}>
            <ShipWheel />Bateau double
          </button>
          <button className={environment === "beach_sprint" ? "selected" : ""} onClick={() => setEnvironment("beach_sprint")}>
            <ShipWheel />Aviron Beach / Beach Sprint
          </button>
        </div>
      </div>
      <div className="step-card">
        <span className="step-number">3</span>
        <h2>Niveau de détail</h2>
        <div className="analysis-scope-grid">
          <button className={analysisScope === "general" ? "selected" : ""} onClick={() => setAnalysisScope("general")}>
            <Dumbbell /><span><strong>Analyse générale</strong><small>Score, métriques clés, recommandations et cadence</small></span>
          </button>
          <button className={analysisScope === "complete" ? "selected" : ""} onClick={() => setAnalysisScope("complete")}>
            <ShipWheel /><span><strong>Analyse complète</strong><small>Tous les calculs, phases, angles, comparaisons et graphiques</small></span>
          </button>
        </div>
      </div>
      <div className="step-card">
        <span className="step-number">4</span>
        <h2>Type analyse</h2>
        <div className="analysis-type-grid">
          {analysisTypeOptions.map((option) => (
            <button key={option.value} className={analysisType === option.value ? "selected" : ""} onClick={() => setAnalysisType(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
        {analysisType === "custom" && (
          <label className="custom-distance-field">
            Distance personnalisee en metres
            <input
              min={1}
              inputMode="numeric"
              type="number"
              placeholder="3500"
              value={customDistance}
              onChange={(event) => setCustomDistance(event.target.value)}
            />
          </label>
        )}
      </div>
      <div className="step-card">
        <span className="step-number">5</span>
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
            <small>MP4, MOV, M4V, WebM ou AVI · jusqu&apos;à {(MAX_VIDEO_SIZE_MB / 1024).toFixed(0)} Go</small>
            <input
              aria-label="Importer une vidéo"
              type="file"
              accept="video/*,.mp4,.mov,.m4v,.webm,.avi"
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
            <small>{stepLabels[currentStep]} · {progress}%</small>
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
