"use client";

import { Activity, Gauge, ShieldCheck, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import type { TrainingZoneConfig } from "@/types/rowing-domain";

const zoneConfigs: TrainingZoneConfig[] = [
  { zone: "UT2", minHeartRatePercent: 55, maxHeartRatePercent: 70, minPowerPercent: 45, maxPowerPercent: 60, description: "Endurance fondamentale et recuperation active." },
  { zone: "UT1", minHeartRatePercent: 70, maxHeartRatePercent: 80, minPowerPercent: 60, maxPowerPercent: 75, description: "Endurance active, volume durable." },
  { zone: "AT", minHeartRatePercent: 80, maxHeartRatePercent: 87, minPowerPercent: 75, maxPowerPercent: 88, description: "Seuil aerobie, controle de l'allure." },
  { zone: "TR", minHeartRatePercent: 87, maxHeartRatePercent: 92, minPowerPercent: 88, maxPowerPercent: 100, description: "Transition seuil, efforts soutenus." },
  { zone: "AN", minHeartRatePercent: 92, maxHeartRatePercent: 97, minPowerPercent: 100, maxPowerPercent: 115, description: "Anaerobie, repetitions intenses." },
  { zone: "SPRINT", minHeartRatePercent: 97, maxHeartRatePercent: 100, minPowerPercent: 115, maxPowerPercent: 150, description: "Depart, relance et puissance maximale." },
];

function range(min?: number, max?: number) {
  return `${min ?? "-"}-${max ?? "-"} %`;
}

function LimitedZonesView() {
  return (
    <section className="content-card training-zones-limited">
      <ShieldCheck />
      <h2>Seuils limites pour ce role</h2>
      <p>Les seuils personnalises necessitent une configuration par club ou coach et des donnees cardio ou puissance importees.</p>
      <p className="demo-warning">Le super-admin dispose de la version complete sans limite. Les admins federation standards et les directeurs techniques gardent une vue limitee.</p>
    </section>
  );
}

function SuperAdminZonesView() {
  return (
    <div className="training-zones-reference">
      <section className="training-zones-hero">
        <div>
          <span><ShieldCheck /> Super-admin</span>
          <h2>Seuils personnalises sans limite</h2>
          <p>Vue globale pour controler les seuils cardio, puissance et intensite sur tous les clubs, coachs et athletes.</p>
        </div>
        <article><Activity /><small>Cardio</small><strong>6 zones</strong></article>
        <article><Zap /><small>Puissance</small><strong>6 zones</strong></article>
        <article><Gauge /><small>Portee</small><strong>Tous</strong></article>
      </section>

      <section className="training-zones-table">
        <header>
          <span>Zone</span>
          <span>Cardio</span>
          <span>Puissance</span>
          <span>Usage</span>
        </header>
        {zoneConfigs.map((zone) => (
          <article key={zone.zone}>
            <strong>{zone.zone}</strong>
            <span>{range(zone.minHeartRatePercent, zone.maxHeartRatePercent)} FC max</span>
            <span>{range(zone.minPowerPercent, zone.maxPowerPercent)} FTP</span>
            <p>{zone.description}</p>
          </article>
        ))}
      </section>

      <section className="training-zones-policy">
        <article><strong>Super-admin</strong><span>Acces complet a toutes les zones, clubs, coachs et sources importees.</span></article>
        <article><strong>Admin federation standard</strong><span>Vue limitee : pas d&apos;acces aux angles sensibles ni aux seuils detailles hors scope autorise.</span></article>
        <article><strong>Directeur technique</strong><span>Vue technique de synthese uniquement, avec angles sensibles masques.</span></article>
      </section>
    </div>
  );
}

function TrainingZonesContent() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "SUPER_ADMIN";
  return (
    <AppShell title="Zones d'entrainement" subtitle={isSuperAdmin ? "Configuration globale super-admin" : "Module limite par role"}>
      {isSuperAdmin ? <SuperAdminZonesView /> : <LimitedZonesView />}
    </AppShell>
  );
}

export default function TrainingZonesPage() {
  return <ProtectedPage><TrainingZonesContent /></ProtectedPage>;
}
