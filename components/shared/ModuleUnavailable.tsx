import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
export function ModuleUnavailable({ title, description }: { title: string; description: string }) { return <ProtectedPage><AppShell title={title} subtitle="Module en préparation"><section className="content-card"><h2>Données réelles requises</h2><p>{description}</p><p className="demo-warning">Ce module ne produit aucune mesure simulée. Il sera activé après connexion de sa source de données et validation métier.</p><Link className="button ghost" href="/dashboard">Retour au tableau de bord</Link></section></AppShell></ProtectedPage>; }
