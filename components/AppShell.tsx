"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Radio, Upload, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { InstallButton } from "@/components/pwa/InstallButton";
import { navigationSections } from "@/lib/navigation";
import { useAuth } from "@/providers/AuthProvider";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  dashboardMode?: boolean;
  referenceMode?: boolean;
  headerActions?: React.ReactNode;
}

const roleLabels = {
  athlete: "Athlète",
  coach: "Entraîneur",
  club_admin: "Administrateur",
  superadmin: "Super administrateur",
} as const;

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

  const name = `${profile.firstName} ${profile.lastName}`.trim() || profile.email;
  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  // Every authenticated page shares this single menu and shell.
  const useReferenceLayout = Boolean(dashboardMode || referenceMode || true);

  return (
    <main className={`dashboard-page${useReferenceLayout ? " dashboard-reference" : ""}`}>
      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <Brand compact />
        {useReferenceLayout && (
          <Link className="sidebar-profile" href="/profil">
            <span className="sidebar-avatar">
              <ProfileAvatar
                photoUrl={profile.profilePhotoUrl}
                firstName={profile.firstName}
                lastName={profile.lastName}
              />
              <i />
            </span>
            <span>
              <strong>{name}</strong>
              <small>{roleLabels[profile.role]}</small>
            </span>
            <ChevronDown />
          </Link>
        )}
        <nav>
          {navigationSections.map((section) => {
            const items = section.items.filter((item) => item.roles.includes(profile.role));
            if (items.length === 0) return null;
            return (
              <section className="sidebar-section" key={section.label}>
                <h2>{section.label}</h2>
                {items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    onClick={() => setMobileOpen(false)}
                    className={
                      pathname === href ||
                      (href !== "/tableau-de-bord" && pathname.startsWith(`${href}/`))
                        ? "current"
                        : ""
                    }
                    href={href}
                  >
                    <Icon />
                    {label}
                  </Link>
                ))}
              </section>
            );
          })}
        </nav>
        {pathname !== "/parametres" && <InstallButton compact />}
        <button className="logout" onClick={() => void handleLogout()}>
          <LogOut />
          Se déconnecter
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dash-header">
          <button
            className="dash-menu"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
          <div className="dash-heading">
            {useReferenceLayout ? (
              <>
                <h1>{title}</h1>
                <small>{subtitle ?? "RowMotion AI"}</small>
              </>
            ) : (
              <>
                <small>{subtitle ?? "RowMotion AI"}</small>
                <h1>{title}</h1>
              </>
            )}
          </div>
          {headerActions ? (
            <div className="dashboard-header-actions">{headerActions}</div>
          ) : dashboardMode ? (
            <div className="dashboard-header-actions">
              <Link className="button primary" href="/analyses/nouvelle">
                <Upload />
                Importer une vidéo
              </Link>
              <Link className="button ghost" href="/analyses/live">
                <Radio />
                Analyse en direct
              </Link>
              <Link className="dashboard-bell" href="/notifications" aria-label="Notifications">
                <Bell />
                <span>3</span>
              </Link>
            </div>
          ) : (
            <div className="dash-profile">
              <Link className="icon-link" href="/notifications" aria-label="Notifications">
                <Bell />
              </Link>
              <Link className="avatar-link" href="/profil">
                <ProfileAvatar
                  photoUrl={profile.profilePhotoUrl}
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                />
              </Link>
              <div>
                <strong>{name}</strong>
                <small>{profile.role}</small>
              </div>
            </div>
          )}
        </header>
        <div className="workspace-content">{children}</div>
      </section>
    </main>
  );
}
