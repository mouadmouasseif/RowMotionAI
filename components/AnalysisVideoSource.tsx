"use client";

import { useEffect, useState } from "react";
import { SynchronizedAnalysisProvider } from "@/components/analysis/SynchronizedAnalysisContext";
import { BiomechanicalVideoPlayer } from "@/components/video/BiomechanicalVideoPlayer";
import { getLocalAnalysisVideo } from "@/services/local-video-service";
import type { RowingAnalysis } from "@/types/analysis";

export function AnalysisVideoSource({ analysis }: { analysis: RowingAnalysis }) {
  const [source, setSource] = useState(analysis.videoUrl ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (analysis.videoStorageMode !== "local") {
      setSource(analysis.videoUrl ?? "");
      return;
    }

    let objectUrl = "";
    let active = true;
    void getLocalAnalysisVideo(analysis.id)
      .then((video) => {
        if (!active) {
          if (video?.url) URL.revokeObjectURL(video.url);
          return;
        }
        if (!video) throw new Error("Cette vidéo locale n’est plus disponible dans ce navigateur.");
        objectUrl = video.url;
        setSource(video.url);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Impossible de lire la vidéo locale.");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [analysis.id, analysis.videoStorageMode, analysis.videoUrl]);

  if (error) return <div className="error-card">{error}</div>;
  if (!source) return null;
  return <SynchronizedAnalysisProvider><BiomechanicalVideoPlayer src={source} /></SynchronizedAnalysisProvider>;
}
