"use client";
import { Building2 } from "lucide-react"; import { AppShell } from "@/components/AppShell"; import { ProtectedPage } from "@/components/ProtectedPage";
function ClubsContent() { return <AppShell title="Clubs" subtitle="Administration globale"><div className="empty-state"><Building2 /><h2>Gestion des clubs</h2><p>La route est sécurisée et prête pour la collection clubs. Aucun club de démonstration n’est affiché.</p></div></AppShell>; }
export default function ClubsPage() { return <ProtectedPage allowedRoles={["superadmin"]}><ClubsContent /></ProtectedPage>; }
