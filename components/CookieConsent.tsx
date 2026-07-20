"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export const CONSENT_KEY="rowmotion-cookie-consent";
export function CookieConsent(){const [visible,setVisible]=useState(false);useEffect(()=>setVisible(!localStorage.getItem(CONSENT_KEY)),[]);if(!visible)return null;const choose=(value:"accepted"|"refused")=>{localStorage.setItem(CONSENT_KEY,value);window.dispatchEvent(new Event("rowmotion-consent-change"));setVisible(false);};return <aside className="cookie-banner" aria-label="Choix des cookies"><div><strong>Votre confidentialité</strong><p>Les cookies essentiels assurent la connexion et la PWA. La mesure d’audience ne démarre qu’avec votre accord.</p><Link href="/cookies">En savoir plus</Link></div><button className="button ghost" onClick={()=>choose("refused")}>Refuser</button><button className="button primary" onClick={()=>choose("accepted")}>Accepter</button></aside>;}
