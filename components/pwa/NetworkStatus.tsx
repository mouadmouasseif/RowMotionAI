"use client";
import { useEffect, useState } from "react"; import { WifiOff } from "lucide-react";
export function NetworkStatus() { const [online, setOnline] = useState(true); useEffect(() => { const update = () => setOnline(navigator.onLine); update(); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []); return online ? null : <div className="network-status" role="status"><WifiOff />Hors connexion</div>; }
