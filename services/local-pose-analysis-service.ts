import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { AnalysisEnvironment, AnalysisMetrics, AnalysisTimelines, CadenceSample, CrewAnalysisResult, MuscleUsage, StrokeCycle, StrokePhase } from "@/types/analysis";

export interface LocalPoseAnalysisResult {
  metrics: AnalysisMetrics;
  technicalScore: number;
  processedFrames: number;
  errors: string[];
  recommendations: string[];
  cadenceTimeline: CadenceSample[];
  cycles: StrokeCycle[];
  phases: Record<string, StrokePhase>;
  timelines: AnalysisTimelines;
  muscleUsage: MuscleUsage;
  crewAnalysis?: CrewAnalysisResult;
}

let visionPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;

async function createLandmarker(numPoses = 1) {
  if (!visionPromise) {
    visionPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    ).catch((error) => {
      visionPromise = null;
      throw error;
    });
  }
  const vision = await visionPromise;
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task", delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

function angle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const denominator = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (!denominator) return null;
  const cosine = Math.min(1, Math.max(-1, (ab.x * cb.x + ab.y * cb.y) / denominator));
  return Math.acos(cosine) * 180 / Math.PI;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function rounded(value: number | null) {
  return value === null ? null : Math.round(value * 10) / 10;
}

function range(values: number[]) {
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

function percent(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): NormalizedLandmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, visibility: Math.min(a.visibility ?? 0, b.visibility ?? 0) };
}

function waitForMedia(video: HTMLVideoElement, event: "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(event, done);
      video.removeEventListener("error", failed);
    };
    const done = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("La vidéo locale est illisible.")); };
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error("La lecture de la vidéo a expiré.")); }, 15_000);
    video.addEventListener(event, done, { once: true });
    video.addEventListener("error", failed, { once: true });
  });
}

async function seek(video: HTMLVideoElement, time: number) {
  if (Math.abs(video.currentTime - time) < 0.001) return;
  const ready = waitForMedia(video, "seeked");
  video.currentTime = time;
  await ready;
}

export async function analyzeLocalVideo(
  file: File,
  onProgress: (progress: number) => void,
  options: { environment?: AnalysisEnvironment } = {},
): Promise<LocalPoseAnalysisResult> {
  if (typeof window === "undefined") throw new Error("L’analyse locale nécessite un navigateur.");
  const isDouble = options.environment === "double_scull";
  const landmarker = await createLandmarker(isDouble ? 2 : 1);
  const source = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = source;

  const knees: number[] = [];
  const hips: number[] = [];
  const elbows: number[] = [];
  const shoulders: number[] = [];
  const backs: number[] = [];
  const symmetries: number[] = [];
  const kneeTimeline: Array<{ time: number; value: number }> = [];
  const hipTimeline: Array<{ time: number; value: number }> = [];
  const backTimeline: Array<{ time: number; value: number }> = [];
  const symmetryTimeline: Array<{ time: number; value: number }> = [];
  const movementSpeedTimeline: Array<{ time: number; value: number }> = [];
  let previousHipCenter: NormalizedLandmark | null = null;
  let previousPoseTime: number | null = null;
  let detectedFrames = 0;
  const secondKnees: number[] = [];
  const secondHips: number[] = [];
  const secondBacks: number[] = [];
  const secondKneeTimeline: Array<{ time: number; value: number }> = [];
  let secondDetectedFrames = 0;

  try {
    await waitForMedia(video, "loadedmetadata");
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("La durée de la vidéo est invalide.");
    const sampleRate = 10;
    const totalFrames = Math.min(900, Math.max(1, Math.floor(duration * sampleRate)));
    const step = duration / totalFrames;

    for (let index = 0; index < totalFrames; index += 1) {
      const time = Math.min(duration - 0.001, index * step);
      await seek(video, Math.max(0, time));
      const result = landmarker.detectForVideo(video, time * 1000);
      const points = result.landmarks[0];
      if (points?.length >= 29) {
        detectedFrames += 1;
        const leftKnee = angle(points[23], points[25], points[27]);
        const rightKnee = angle(points[24], points[26], points[28]);
        const leftHip = angle(points[11], points[23], points[25]);
        const rightHip = angle(points[12], points[24], points[26]);
        const leftElbow = angle(points[11], points[13], points[15]);
        const rightElbow = angle(points[12], points[14], points[16]);
        const leftShoulder = angle(points[13], points[11], points[23]);
        const rightShoulder = angle(points[14], points[12], points[24]);
        const shoulderMid = midpoint(points[11], points[12]);
        const hipMid = midpoint(points[23], points[24]);
        if (previousHipCenter && previousPoseTime !== null && time > previousPoseTime) {
          const displacement = Math.hypot(hipMid.x - previousHipCenter.x, hipMid.y - previousHipCenter.y);
          movementSpeedTimeline.push({ time, value: displacement / (time - previousPoseTime) * 100 });
        }
        previousHipCenter = hipMid;
        previousPoseTime = time;
        const back = Math.abs(Math.atan2(shoulderMid.x - hipMid.x, hipMid.y - shoulderMid.y) * 180 / Math.PI);
        const knee = average([leftKnee, rightKnee].filter((value): value is number => value !== null));
        const hip = average([leftHip, rightHip].filter((value): value is number => value !== null));
        const elbow = average([leftElbow, rightElbow].filter((value): value is number => value !== null));
        const shoulder = average([leftShoulder, rightShoulder].filter((value): value is number => value !== null));
        if (knee !== null) { knees.push(knee); kneeTimeline.push({ time, value: knee }); }
        if (hip !== null) { hips.push(hip); hipTimeline.push({ time, value: hip }); }
        if (elbow !== null) elbows.push(elbow);
        if (shoulder !== null) shoulders.push(shoulder);
        backs.push(back);
        backTimeline.push({ time, value: back });
        if (leftKnee !== null && rightKnee !== null) {
          const symmetry = Math.max(0, 100 - Math.abs(leftKnee - rightKnee) * 2);
          symmetries.push(symmetry);
          symmetryTimeline.push({ time, value: symmetry });
        }
      }
      const secondPoints = result.landmarks[1];
      if (isDouble && secondPoints?.length >= 29) {
        secondDetectedFrames += 1;
        const leftKnee = angle(secondPoints[23], secondPoints[25], secondPoints[27]);
        const rightKnee = angle(secondPoints[24], secondPoints[26], secondPoints[28]);
        const leftHip = angle(secondPoints[11], secondPoints[23], secondPoints[25]);
        const rightHip = angle(secondPoints[12], secondPoints[24], secondPoints[26]);
        const knee = average([leftKnee, rightKnee].filter((value): value is number => value !== null));
        const hip = average([leftHip, rightHip].filter((value): value is number => value !== null));
        const shoulderMid = midpoint(secondPoints[11], secondPoints[12]);
        const hipMid = midpoint(secondPoints[23], secondPoints[24]);
        const back = Math.abs(Math.atan2(shoulderMid.x - hipMid.x, hipMid.y - shoulderMid.y) * 180 / Math.PI);
        if (knee !== null) { secondKnees.push(knee); secondKneeTimeline.push({ time, value: knee }); }
        if (hip !== null) secondHips.push(hip);
        secondBacks.push(back);
      }
      onProgress(Math.round((index + 1) / totalFrames * 100));
      if (index % 8 === 0) await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }

    if (detectedFrames < Math.max(3, totalFrames * 0.15)) {
      throw new Error("Aucun rameur n’a été détecté clairement. Utilisez une vidéo stable montrant le corps entier de profil.");
    }

    let catches = 0;
    let belowThreshold = false;
    const catchTimes: number[] = [];
    for (const sample of kneeTimeline) {
      if (sample.value < 95 && !belowThreshold) {
        catches += 1;
        catchTimes.push(sample.time);
        belowThreshold = true;
      }
      if (sample.value > 125) belowThreshold = false;
    }
    const strokeRate = duration >= 5 ? catches / duration * 60 : null;
    const cadenceTimeline: CadenceSample[] = catchTimes.slice(1).map((time, index) => ({
      time: Math.round(time * 100) / 100,
      value: Math.round(60 / Math.max(time - catchTimes[index], 0.25) * 10) / 10,
    })).filter((sample) => sample.value >= 8 && sample.value <= 60);
    if (cadenceTimeline.length < 2 && strokeRate !== null) {
      cadenceTimeline.splice(0, cadenceTimeline.length,
        { time: 0, value: rounded(strokeRate) ?? strokeRate },
        { time: Math.round(duration * 100) / 100, value: rounded(strokeRate) ?? strokeRate },
      );
    }
    const symmetryScore = average(symmetries);
    const confidence = detectedFrames / totalFrames;
    const technicalScore = Math.round(Math.max(0, Math.min(100, (symmetryScore ?? 60) * 0.65 + confidence * 35)));
    const cycles: StrokeCycle[] = catchTimes.slice(0, -1).map((startTime, index) => {
      const endTime = catchTimes[index + 1];
      const cycleDuration = Math.max(endTime - startTime, 0.01);
      const driveTime = cycleDuration * 0.36;
      const phaseConfidence = Math.max(0.45, Math.min(0.95, confidence));
      const phases: StrokePhase[] = [
        { name: "Prise d’eau", startTime, endTime: startTime + cycleDuration * 0.08, confidence: phaseConfidence },
        { name: "Propulsion", startTime: startTime + cycleDuration * 0.08, endTime: startTime + driveTime, confidence: phaseConfidence },
        { name: "Dégagé", startTime: startTime + driveTime, endTime: startTime + cycleDuration * 0.48, confidence: phaseConfidence },
        { name: "Retour", startTime: startTime + cycleDuration * 0.48, endTime, confidence: phaseConfidence },
      ];
      const cycleKnees = kneeTimeline.filter((sample) => sample.time >= startTime && sample.time <= endTime).map((sample) => sample.value);
      const amplitude = cycleKnees.length ? Math.max(...cycleKnees) - Math.min(...cycleKnees) : 0;
      const cycleRegularity = Math.max(0, Math.min(100, 100 - Math.abs(cycleDuration - (60 / Math.max(strokeRate ?? 28, 1))) * 35));
      return {
        index,
        startTime: rounded(startTime) ?? startTime,
        endTime: rounded(endTime) ?? endTime,
        duration: rounded(cycleDuration) ?? cycleDuration,
        driveTime: rounded(driveTime) ?? driveTime,
        recoveryTime: rounded(cycleDuration - driveTime) ?? cycleDuration - driveTime,
        driveRecoveryRatio: rounded(driveTime / Math.max(cycleDuration - driveTime, 0.01)) ?? 0,
        strokeRate: rounded(60 / cycleDuration) ?? 0,
        phases,
        metrics: {
          regularity: rounded(cycleRegularity),
          sequenceScore: rounded(Math.min(100, amplitude)),
          symmetry: rounded(symmetryScore),
          technicalScore,
        },
        errors: [],
        confidence: phaseConfidence,
      };
    });
    const metrics: AnalysisMetrics = {
      backAngle: rounded(average(backs)),
      kneeAngle: rounded(average(knees)),
      hipAngle: rounded(average(hips)),
      elbowAngle: rounded(average(elbows)),
      shoulderAngle: rounded(average(shoulders)),
      strokeRate: rounded(strokeRate),
      strokeLength: null,
      estimatedPower: null,
      symmetryScore: rounded(symmetryScore),
      rhythmScore: strokeRate === null ? null : Math.round(Math.max(0, Math.min(100, 100 - Math.abs(strokeRate - 28) * 3))),
      sequenceScore: technicalScore,
    };
    const errors: string[] = [];
    const recommendations: string[] = [];
    if ((metrics.symmetryScore ?? 100) < 80) {
      errors.push("Asymétrie notable entre les jambes.");
      recommendations.push("Travaillez une poussée simultanée et équilibrée des deux jambes.");
    }
    if ((metrics.backAngle ?? 0) > 35) {
      errors.push("Inclinaison moyenne du dos élevée.");
      recommendations.push("Stabilisez le tronc et contrôlez l’ouverture du dos pendant la propulsion.");
    }
    if ((metrics.strokeRate ?? 28) > 36) recommendations.push("Réduisez légèrement la cadence pour préserver la qualité technique.");
    if (!errors.length) recommendations.push("La posture détectée est régulière. Continuez à privilégier la fluidité du cycle.");
    const representativePhases = cycles[0]?.phases ?? [];
    const halfSecondSpeed = Array.from(
      movementSpeedTimeline.reduce((buckets, sample) => {
        const bucket = Math.floor(sample.time / 0.5) * 0.5;
        const values = buckets.get(bucket) ?? [];
        values.push(sample.value);
        buckets.set(bucket, values);
        return buckets;
      }, new Map<number, number[]>()),
      ([time, values]) => ({ time: Math.round(time * 10) / 10, value: rounded(average(values)) ?? 0 }),
    ).sort((a, b) => a.time - b.time);
    const timelines: AnalysisTimelines = {
      cadence: cadenceTimeline,
      movementSpeed: halfSecondSpeed,
      kneeAngle: kneeTimeline.map((sample) => ({ time: rounded(sample.time) ?? sample.time, value: rounded(sample.value) ?? sample.value })),
      hipAngle: hipTimeline.map((sample) => ({ time: rounded(sample.time) ?? sample.time, value: rounded(sample.value) ?? sample.value })),
      backAngle: backTimeline.map((sample) => ({ time: rounded(sample.time) ?? sample.time, value: rounded(sample.value) ?? sample.value })),
      symmetry: symmetryTimeline.map((sample) => ({ time: rounded(sample.time) ?? sample.time, value: rounded(sample.value) ?? sample.value })),
    };
    const muscleUsage: MuscleUsage = {
      back: percent(100 - Math.abs((metrics.backAngle ?? 25) - 22) * 1.35),
      legs: percent(45 + range(knees) * 0.35 + range(hips) * 0.2),
      arms: percent(35 + range(elbows) * 0.38 + range(shoulders) * 0.12),
      core: percent((metrics.symmetryScore ?? 60) * 0.58 + (metrics.rhythmScore ?? 60) * 0.42),
      shoulders: percent(35 + range(shoulders) * 0.55 + range(elbows) * 0.08),
    };
    let crewAnalysis: CrewAnalysisResult | undefined;
    if (isDouble) {
      const secondCatchTimes: number[] = [];
      let secondBelowThreshold = false;
      for (const sample of secondKneeTimeline) {
        if (sample.value < 95 && !secondBelowThreshold) { secondCatchTimes.push(sample.time); secondBelowThreshold = true; }
        if (sample.value > 125) secondBelowThreshold = false;
      }
      const pairedCount = Math.min(catchTimes.length, secondCatchTimes.length);
      const offsets = Array.from({ length: pairedCount }, (_, index) => Math.abs(catchTimes[index] - secondCatchTimes[index]));
      const averageOffset = average(offsets);
      const secondConfidence = secondDetectedFrames / totalFrames;
      const secondStrokeRate = duration >= 5 ? secondCatchTimes.length / duration * 60 : null;
      const secondScore = Math.round(Math.max(0, Math.min(100, secondConfidence * 55 + (average(secondKnees) ? 35 : 0) + (pairedCount ? 10 : 0))));
      crewAnalysis = {
        rowers: [
          { position: 1, detectedFrames, confidence, technicalScore, metrics: { backAngle: metrics.backAngle, kneeAngle: metrics.kneeAngle, hipAngle: metrics.hipAngle, strokeRate: metrics.strokeRate, symmetryScore: metrics.symmetryScore } },
          { position: 2, detectedFrames: secondDetectedFrames, confidence: rounded(secondConfidence) ?? 0, technicalScore: secondDetectedFrames ? secondScore : null, metrics: { backAngle: rounded(average(secondBacks)), kneeAngle: rounded(average(secondKnees)), hipAngle: rounded(average(secondHips)), strokeRate: rounded(secondStrokeRate), symmetryScore: null } },
        ],
        synchronizationScore: averageOffset === null ? null : percent(100 - averageOffset * 100),
        timingOffsetSeconds: rounded(averageOffset),
        simultaneousDriveScore: averageOffset === null ? null : percent(100 - averageOffset * 120),
      };
    }
    return {
      metrics,
      technicalScore,
      processedFrames: totalFrames,
      errors,
      recommendations,
      cadenceTimeline,
      cycles,
      phases: Object.fromEntries(representativePhases.map((phase) => [phase.name, phase])),
      timelines,
      muscleUsage,
      crewAnalysis,
    };
  } finally {
    landmarker.close();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(source);
  }
}
