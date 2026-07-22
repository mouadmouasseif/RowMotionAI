"use client";
import { useEffect,useState } from "react";import { registerServiceWorker } from "@/lib/pwa/register-service-worker";
export function ServiceWorkerRegister(){const[waiting,setWaiting]=useState<ServiceWorker|null>(null);
useEffect(()=>{let disposed=false;let registration:ServiceWorkerRegistration|null=null;let installing:ServiceWorker|null=null;let refreshing=false;
const handleControllerChange=()=>{if(!refreshing){refreshing=true;window.location.reload();}};
const handleStateChange=()=>{if(!disposed&&installing?.state==="installed"&&navigator.serviceWorker.controller)setWaiting(installing);};
const handleUpdateFound=()=>{installing?.removeEventListener("statechange",handleStateChange);installing=registration?.installing??null;installing?.addEventListener("statechange",handleStateChange);};
const start=async()=>{registration=await registerServiceWorker();if(disposed||!registration)return;if(registration.waiting)setWaiting(registration.waiting);registration.addEventListener("updatefound",handleUpdateFound);navigator.serviceWorker.addEventListener("controllerchange",handleControllerChange);};
void start().catch(error=>console.error("[RowMotion] Service worker initialization failed:",error));
return()=>{disposed=true;installing?.removeEventListener("statechange",handleStateChange);registration?.removeEventListener("updatefound",handleUpdateFound);navigator.serviceWorker?.removeEventListener("controllerchange",handleControllerChange);};},[]);
if(!waiting)return null;return <div className="update-toast"><span>Une nouvelle version de RowMotion AI est disponible.</span><button onClick={()=>waiting.postMessage({type:"SKIP_WAITING"})}>Mettre à jour</button></div>}
