"use client";
import { useContext } from "react";import { PwaInstallContext } from "@/components/pwa/PwaInstallProvider";
export function usePwaInstall(){const context=useContext(PwaInstallContext);if(!context)throw new Error("usePwaInstall must be used inside PwaInstallProvider");return context;}
