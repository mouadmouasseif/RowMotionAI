"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { SynchronizedAnalysisState } from "@/types/rowing-domain";

const initialState: SynchronizedAnalysisState = { currentTime: 0, currentFrame: 0, selectedMetric: null, selectedEvent: null, isPlaying: false };
type SyncContext = SynchronizedAnalysisState & { seek: (time: number, fps: number) => void; setPlaying: (playing: boolean) => void; selectMetric: (metric: string | null) => void; selectEvent: (event: string | null) => void };
const Context = createContext<SyncContext | null>(null);
export function SynchronizedAnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState);
  const seek = useCallback((currentTime: number, fps: number) => setState((value) => ({ ...value, currentTime: Math.max(0, currentTime), currentFrame: Math.max(0, Math.round(currentTime * fps)) })), []);
  const setPlaying = useCallback((isPlaying: boolean) => setState((value) => ({ ...value, isPlaying })), []);
  const selectMetric = useCallback((selectedMetric: string | null) => setState((value) => ({ ...value, selectedMetric })), []);
  const selectEvent = useCallback((selectedEvent: string | null) => setState((value) => ({ ...value, selectedEvent })), []);
  const value = useMemo(() => ({ ...state, seek, setPlaying, selectMetric, selectEvent }), [state, seek, setPlaying, selectMetric, selectEvent]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useSynchronizedAnalysis() { const value = useContext(Context); if (!value) throw new Error("Le lecteur doit être placé dans SynchronizedAnalysisProvider."); return value; }

