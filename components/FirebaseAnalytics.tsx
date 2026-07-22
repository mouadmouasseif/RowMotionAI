"use client";

import { useEffect } from "react";
import { getFirebaseAnalytics } from "@/lib/firebase";
import { CONSENT_KEY } from "@/components/CookieConsent";

export function FirebaseAnalytics() {
  useEffect(() => { const initialize=()=>{if(localStorage.getItem(CONSENT_KEY)==="accepted")void getFirebaseAnalytics().catch(error=>console.error("[RowMotion] Analytics initialization failed:",error));};initialize();window.addEventListener("rowmotion-consent-change",initialize);return()=>window.removeEventListener("rowmotion-consent-change",initialize); }, []);
  return null;
}
