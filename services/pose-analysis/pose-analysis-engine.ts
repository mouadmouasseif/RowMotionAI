import type { AnalysisMetrics } from "@/types/analysis";
export type MetricsListener = (metrics: Partial<AnalysisMetrics>) => void;
export interface PoseAnalysisEngine { initialize(): Promise<void>; start(videoElement: HTMLVideoElement): Promise<void>; stop(): void; getCurrentMetrics(): Partial<AnalysisMetrics>; subscribe(callback: MetricsListener): () => void; }

export class MediaPipeReadyEngine implements PoseAnalysisEngine {
  private listeners = new Set<MetricsListener>(); private metrics: Partial<AnalysisMetrics> = {};
  async initialize() { /* Point d’intégration MediaPipe Pose : aucun score n’est simulé. */ }
  async start(videoElement: HTMLVideoElement) { if (!videoElement.srcObject) throw new Error("Le flux caméra n’est pas actif."); }
  stop() { this.metrics = {}; }
  getCurrentMetrics() { return this.metrics; }
  subscribe(callback: MetricsListener) { this.listeners.add(callback); return () => this.listeners.delete(callback); }
}
