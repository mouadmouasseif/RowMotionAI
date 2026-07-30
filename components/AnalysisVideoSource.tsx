"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle, VideoOff } from "lucide-react";
import { SynchronizedAnalysisProvider } from "@/components/analysis/SynchronizedAnalysisContext";
import { BiomechanicalVideoPlayer } from "@/components/video/BiomechanicalVideoPlayer";
import { getLocalAnalysisVideo } from "@/services/local-video-service";
import type { RowingAnalysis } from "@/types/analysis";

export function AnalysisVideoSource({ analysis }: { analysis: RowingAnalysis }) {
  const [source, setSource] = useState(analysis.videoUrl ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(analysis.videoStorageMode === "local");

  useEffect(() => {
    setError("");
    if (analysis.videoStorageMode !== "local") {
      setSource(analysis.videoUrl ?? "");
      setLoading(false);
      return;
    }

    let objectUrl = "";
    let active = true;
    setSource("");
    setLoading(true);
    void getLocalAnalysisVideo(analysis.id)
      .then((video) => {
        if (!active) {
          if (video?.url) URL.revokeObjectURL(video.url);
          return;
        }
        if (!video) throw new Error("Cette vidéo locale n’est plus disponible dans ce navigateur.");
        objectUrl = video.url;
        setSource(video.url);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Impossible de lire la vidéo locale.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [analysis.id, analysis.videoStorageMode, analysis.videoUrl]);

  if (loading) return <div className="video-source-state"><LoaderCircle className="video-source-spinner" /><strong>Chargement de la vidéo…</strong><span>Les résultats restent disponibles pendant la préparation du lecteur.</span></div>;
  if (error) return <div className="video-source-state video-source-unavailable"><AlertTriangle /><strong>Vidéo indisponible</strong><span>{error}</span></div>;
  if (!source) return <div className="video-source-state video-source-unavailable"><VideoOff /><strong>Aucune vidéo enregistrée</strong><span>Les mesures du rapport restent consultables ci-dessous.</span></div>;
  return <SynchronizedAnalysisProvider><BiomechanicalVideoPlayer src={source} /></SynchronizedAnalysisProvider>;
}
