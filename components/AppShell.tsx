"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, FileBarChart, LogOut, Menu, Radio, Upload, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { InstallButton } from "@/components/pwa/InstallButton";
import { navigationByRole } from "@/config/role-navigation";
import { useAuth } from "@/providers/AuthProvider";
import type { UserRole } from "@/types/user";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  dashboardMode?: boolean;
  referenceMode?: boolean;
  headerActions?: React.ReactNode;
}

const roleLabels: Record<UserRole, string> = {
  ATHLETE: "ATHLETE",
  COACH: "COACH",
  CLUB_ADMIN: "Admin Club",
  TECHNICAL_DIRECTOR: "Directeur Technique",
  SUPER_ADMIN: "SUPER_ADMIN",
  JURY: "Jury",
};

function defaultActionForRole(role: UserRole) {
  if (role === "TECHNICAL_DIRECTOR") return { href: "/rapports", label: "Rapport technique", icon: FileBarChart };
  if (role === "CLUB_ADMIN") return { href: "/rapports", label: "Exporter rapport", icon: FileBarChart };
  if (role === "SUPER_ADMIN") return { href: "/rapports", label: "Rapport global", icon: FileBarChart };
  if (role === "JURY") return { href: "/jury/dashboard", label: "Acceder au live", icon: Radio };
  return { href: "/analyses/nouvelle", label: "Importer une video", icon: Upload };
}

export function AppShell({
  children,
  title,
  subtitle,
  dashboardMode = false,
  referenceMode = false,
  headerActions,
}: AppShellProps) {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!profile) return null;

  const name = `${profile.firstName} ${profile.lastName}`.trim() || profile.displayName || profile.email;
  const navigationSections = navigationByRole[profile.role];
  const primaryAction = defaultActionForRole(profile.role);
  const PrimaryIcon = primaryAction.icon;
  const useReferenceLayout = Boolean(dashboardMode || referenceMode || true);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <main className={`dashboard-page${useReferenceLayout ? " dashboard-reference" : ""}${profile.role === "ATHLETE" ? " athlete-dashboard-shell" : ""}`}>
      {mobileOpen && <button className="mobile-overlay" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <Brand compact />
        <Link className="sidebar-profile" href="/profil">
          <span className="sidebar-avatar">
            <ProfileAvatar photoUrl={profile.profilePhotoUrl} firstName={profile.firstName} lastName={profile.lastName} />
            <i />
          </span>
          <span>
            <strong>{name}</strong>
            <small>{roleLabels[profile.role]}</small>
          </span>
          <ChevronDown />
        </Link>
        <nav>
          {navigationSections.map((section) => (
            <section className="sidebar-section" key={section.label}>
              <h2>{section.label}</h2>
              {section.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={`${section.label}-${label}-${href}`}
                  onClick={() => setMobileOpen(false)}
                  className={pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "current" : ""}
                  href={href}
                >
                  <Icon />
                  {label}
                </Link>
              ))}
            </section>
          ))}
        </nav>
        {pathname !== "/parametres" && <InstallButton compact />}
        <button className="logout" onClick={() => void handleLogout()}>
          <LogOut />
          Se deconnecter
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dash-header">
          <button className="dash-menu" aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMobileOpen((value) => !value)}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
          <div className="dash-heading">
            <h1>{title}</h1>
            <small>{subtitle ?? "RowMotion AI"}</small>
          </div>
          {headerActions ? (
            <div className="dashboard-header-actions">{headerActions}</div>
          ) : dashboardMode ? (
            <div className="dashboard-header-actions">
              <Link className="button primary" href={primaryAction.href}>
                <PrimaryIcon />
                {primaryAction.label}
              </Link>
              {(profile.role === "ATHLETE" || profile.role === "COACH") && (
                <Link className="button ghost" href="/analyses/live">
                  <Radio />
                  Analyse en direct
                </Link>
              )}
              <Link className="dashboard-bell" href="/notifications" aria-label="Notifications">
                <Bell />
              </Link>
            </div>
          ) : (
            <div className="dash-profile">
              <Link className="icon-link" href="/notifications" aria-label="Notifications"><Bell /></Link>
              <Link className="avatar-link" href="/profil">
                <ProfileAvatar photoUrl={profile.profilePhotoUrl} firstName={profile.firstName} lastName={profile.lastName} />
              </Link>
              <div>
                <strong>{name}</strong>
                <small>{roleLabels[profile.role]}</small>
              </div>
            </div>
          )}
        </header>
        <div className="workspace-content">{children}</div>
      </section>
    </main>
  );
}

