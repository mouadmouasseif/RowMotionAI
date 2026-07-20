"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> }
interface NavigatorWithStandalone extends Navigator { standalone?: boolean }
interface PwaContextValue { installed: boolean; installAvailable: boolean; isIOS: boolean; promptInstall: () => Promise<boolean> }
const PwaContext = createContext<PwaContextValue | null>(null);

export function isAppInstalled() { if (typeof window === "undefined") return false; return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as NavigatorWithStandalone).standalone === true; }

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null); const [installed, setInstalled] = useState(false); const [isIOS, setIsIOS] = useState(false);
  useEffect(() => { setInstalled(isAppInstalled()); setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent)); const beforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); }; const afterInstall = () => { setInstalled(true); setInstallPrompt(null); }; window.addEventListener("beforeinstallprompt", beforeInstall); window.addEventListener("appinstalled", afterInstall); return () => { window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", afterInstall); }; }, []);
  const promptInstall = useCallback(async () => { if (!installPrompt) return false; await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === "accepted") { setInstalled(true); setInstallPrompt(null); return true; } return false; }, [installPrompt]);
  const value = useMemo(() => ({ installed, installAvailable: Boolean(installPrompt) && !installed, isIOS, promptInstall }), [installed, installPrompt, isIOS, promptInstall]);
  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
export function usePwa() { const context = useContext(PwaContext); if (!context) throw new Error("usePwa doit être utilisé dans PwaProvider."); return context; }
