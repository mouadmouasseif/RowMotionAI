"use client";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BeforeInstallPromptEvent, PwaInstallContextValue, PwaInstallOutcome } from "@/types/pwa";

export const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);
export function detectStandalone(targetWindow: Window = window): boolean {
  const standaloneMedia=targetWindow.matchMedia("(display-mode: standalone)").matches;
  const navigatorWithStandalone=targetWindow.navigator as Navigator & { standalone?:boolean };
  return standaloneMedia || navigatorWithStandalone.standalone === true;
}
export function detectIosSafari(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent) && /safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent);
}
export function PwaInstallProvider({children}:{children:React.ReactNode}){
  const [deferredPrompt,setDeferredPrompt]=useState<BeforeInstallPromptEvent|null>(null);
  const [isStandalone,setIsStandalone]=useState(false);const [isInstalled,setIsInstalled]=useState(false);
  const [isPrompting,setIsPrompting]=useState(false);const [installOutcome,setInstallOutcome]=useState<PwaInstallOutcome|null>(null);
  const [isIosSafari,setIsIosSafari]=useState(false);const promptingRef=useRef(false);
  useEffect(()=>{
    const standaloneMedia=window.matchMedia("(display-mode: standalone)");
    const updateStandalone=()=>{const value=detectStandalone();setIsStandalone(value);if(value)setIsInstalled(true);};
    const handleBeforeInstall=(event:Event)=>{event.preventDefault();setDeferredPrompt(event as BeforeInstallPromptEvent);setInstallOutcome(null);};
    const handleInstalled=()=>{setIsInstalled(true);setDeferredPrompt(null);setInstallOutcome("accepted");};
    updateStandalone();setIsIosSafari(detectIosSafari(window.navigator.userAgent));
    window.addEventListener("beforeinstallprompt",handleBeforeInstall);window.addEventListener("appinstalled",handleInstalled);standaloneMedia.addEventListener?.("change",updateStandalone);
    return()=>{window.removeEventListener("beforeinstallprompt",handleBeforeInstall);window.removeEventListener("appinstalled",handleInstalled);standaloneMedia.removeEventListener?.("change",updateStandalone);};
  },[]);
  const install=useCallback(async():Promise<PwaInstallOutcome>=>{
    if(!deferredPrompt||isInstalled||promptingRef.current){setInstallOutcome("unavailable");return "unavailable";}
    promptingRef.current=true;setIsPrompting(true);
    try{await deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;setInstallOutcome(choice.outcome);setDeferredPrompt(null);if(choice.outcome==="accepted")setIsInstalled(true);return choice.outcome;}
    catch(error){console.error("[RowMotion] PWA install prompt failed:",error);setInstallOutcome("unavailable");setDeferredPrompt(null);return "unavailable";}
    finally{promptingRef.current=false;setIsPrompting(false);}
  },[deferredPrompt,isInstalled]);
  const value=useMemo(()=>({canInstall:Boolean(deferredPrompt)&&!isInstalled,isInstalled,isStandalone,isPrompting,installOutcome,isIosSafari,install}),[deferredPrompt,isInstalled,isStandalone,isPrompting,installOutcome,isIosSafari,install]);
  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}
