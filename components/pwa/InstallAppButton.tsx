"use client";
import { Download } from "lucide-react";
import { usePwa } from "@/components/pwa/PwaProvider";
export function InstallAppButton({ compact = false }: { compact?: boolean }) { const { installAvailable, promptInstall } = usePwa(); if (!installAvailable) return null; return <button className={compact ? "install-button compact" : "button primary"} onClick={() => void promptInstall()}><Download />{compact ? "Installer" : "Installer l’application"}</button>; }
