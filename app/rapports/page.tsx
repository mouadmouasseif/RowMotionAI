"use client";
import Link from "next/link"; import { Download, FileBarChart } from "lucide-react"; import { AppShell } from "@/components/AppShell"; import { ProtectedPage } from "@/components/ProtectedPage";
function ReportsContent() { return <AppShell title="Rapports" subtitle="Exports techniques"><div className="empty-state"><FileBarChart /><h2>Centre de rapports</h2><p>Sélectionnez une analyse terminée pour préparer son rapport. L’export PDF automatique sera activé avec le moteur d’analyse serveur.</p><Link className="button primary" href="/analyses"><Download />Choisir une analyse</Link></div></AppShell>; }
export default function ReportsPage() { return <ProtectedPage><ReportsContent /></ProtectedPage>; }
