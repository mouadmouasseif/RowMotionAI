"use client";
import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Gauge, MessageSquarePlus, Rewind, FastForward } from "lucide-react";
import { useSynchronizedAnalysis } from "@/components/analysis/SynchronizedAnalysisContext";

export interface VideoMarker { id: string; time: number; label: string }
export function BiomechanicalVideoPlayer({ src, markers = [], initialFps = 30, onAddAnnotation, onCompare }: { src: string; markers?: VideoMarker[]; initialFps?: number; onAddAnnotation?: (time: number) => void; onCompare?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null); const [fps, setFps] = useState(initialFps); const sync = useSynchronizedAnalysis();
  const duration = videoRef.current?.duration || 0; const frameDuration = 1 / fps;
  const currentLabel = useMemo(() => `${Math.floor(sync.currentTime / 60).toString().padStart(2, "0")}:${(sync.currentTime % 60).toFixed(2).padStart(5, "0")}`, [sync.currentTime]);
  const seek = (time: number) => { const next = Math.min(Math.max(time, 0), duration || Number.MAX_SAFE_INTEGER); if (videoRef.current) videoRef.current.currentTime = next; sync.seek(next, fps); };
  return <section className="biomechanical-player" aria-label="Lecteur vidéo biomécanique">
    <div className="biomechanical-video-wrap"><video ref={videoRef} src={src} controls playsInline onTimeUpdate={(event) => sync.seek(event.currentTarget.currentTime, fps)} onPlay={() => sync.setPlaying(true)} onPause={() => sync.setPlaying(false)} />{markers.map((marker) => <button key={marker.id} className="video-marker" title={marker.label} style={{ left: duration ? `${marker.time / duration * 100}%` : "0%" }} onClick={() => seek(marker.time)} />)}</div>
    <div className="video-frame-status"><strong>{currentLabel}</strong><span>Frame {sync.currentFrame}</span><label>FPS <input aria-label="Images par seconde" type="number" min={1} max={240} value={fps} onChange={(event) => setFps(Math.max(1, Number(event.target.value) || 30))} /></label></div>
    <div className="video-precision-controls">
      <button onClick={() => seek(sync.currentTime - 5)} aria-label="Reculer de 5 secondes"><Rewind /></button>
      <button onClick={() => seek(sync.currentTime - frameDuration)} aria-label="Image précédente"><ChevronLeft /></button>
      <button onClick={() => seek(sync.currentTime + frameDuration)} aria-label="Image suivante"><ChevronRight /></button>
      <button onClick={() => seek(sync.currentTime + 5)} aria-label="Avancer de 5 secondes"><FastForward /></button>
      <label><Gauge /> Vitesse <select defaultValue="1" onChange={(event) => { if (videoRef.current) videoRef.current.playbackRate = Number(event.target.value); }}><option value="0.25">0,25×</option><option value="0.5">0,5×</option><option value="1">1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label>
      <button onClick={() => onAddAnnotation?.(sync.currentTime)}><MessageSquarePlus /> Annoter</button><button onClick={onCompare}>Comparer avant/après</button>
    </div>
  </section>;
}
