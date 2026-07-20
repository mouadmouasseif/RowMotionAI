"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { navigationItems } from "@/lib/navigation";
import { useAuth } from "@/providers/AuthProvider";

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const { profile, logout } = useAuth(); const pathname = usePathname(); const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false);
  if (!profile) return null;
  const name = `${profile.firstName} ${profile.lastName}`.trim() || profile.email; const initials = `${profile.firstName[0] ?? "R"}${profile.lastName[0] ?? "M"}`.toUpperCase();
  return <main className="dashboard-page">
    {mobileOpen && <button className="mobile-overlay" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}><Brand compact /><nav>{navigationItems.filter((item) => item.roles.includes(profile.role)).map(({ href, label, icon: Icon }) => <Link key={href} onClick={() => setMobileOpen(false)} className={pathname === href || (href !== "/tableau-de-bord" && pathname.startsWith(`${href}/`)) ? "current" : ""} href={href}><Icon />{label}</Link>)}</nav>{pathname !== "/parametres" && <InstallAppButton compact />}<button className="logout" onClick={async () => { await logout(); router.replace("/"); }}><LogOut />Se déconnecter</button></aside>
    <section className="dashboard-main"><header className="dash-header"><button className="dash-menu" aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X /> : <Menu />}</button><div><small>{subtitle ?? "RowMotion AI"}</small><h1>{title}</h1></div><div className="dash-profile"><Link className="icon-link" href="/notifications" aria-label="Notifications"><Bell /></Link><Link className="avatar-link" href="/profil">{initials}</Link><div><strong>{name}</strong><small>{profile.role}</small></div></div></header><div className="workspace-content">{children}</div></section>
  </main>;
}
