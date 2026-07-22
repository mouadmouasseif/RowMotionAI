"use client";
import { useState } from "react";import { Download } from "lucide-react";import { usePwaInstall } from "@/hooks/use-pwa-install";
export function InstallButton({compact=false}:{compact?:boolean}){const{canInstall,isInstalled,isPrompting,install}=usePwaInstall();const[message,setMessage]=useState("");if(isInstalled||!canInstall)return null;
const handleInstall=async()=>{const outcome=await install();setMessage(outcome==="accepted"?"Installation lancée.":outcome==="dismissed"?"Installation annulée.":"L’installation n’est pas disponible dans ce navigateur.");};
return <div className={compact?"install-action compact":"install-action"}><button className={compact?"install-button compact":"button primary"} disabled={isPrompting} onClick={()=>void handleInstall()}><Download/>{isPrompting?"Ouverture…":compact?"Installer":"Installer l’application"}</button>{message&&!compact&&<small role="status">{message}</small>}</div>}
