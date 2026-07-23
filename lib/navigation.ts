import { Bell, Building2, FileBarChart, FileVideo, LayoutDashboard, Settings, TrendingUp, Trophy, UserCog, UserRound, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/user";

export interface NavigationItem { label: string; href: string; icon: LucideIcon; roles: UserRole[] }
const all: UserRole[] = ["athlete", "coach", "club_admin", "superadmin"];

export const navigationItems: NavigationItem[] = [
  { label: "Tableau de bord", href: "/tableau-de-bord", icon: LayoutDashboard, roles: all },
  { label: "Analyses vidéo", href: "/analyses", icon: FileVideo, roles: all },
  { label: "Athlètes", href: "/athletes", icon: Users, roles: ["coach", "club_admin", "superadmin"] },
  { label: "Ma progression", href: "/progression", icon: TrendingUp, roles: all },
  { label: "Compétitions", href: "/competitions", icon: Trophy, roles: all },
  { label: "Mon coach", href: "/mon-coach", icon: UserCog, roles: ["athlete"] },
  { label: "Mon club", href: "/mon-club", icon: Building2, roles: ["athlete", "coach", "club_admin"] },
  { label: "Rapports", href: "/rapports", icon: FileBarChart, roles: all },
  { label: "Clubs", href: "/clubs", icon: Building2, roles: ["superadmin"] },
  { label: "Entraîneurs", href: "/coaches", icon: UserCog, roles: ["club_admin", "superadmin"] },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: all },
  { label: "Profil", href: "/profil", icon: UserRound, roles: all },
  { label: "Paramètres", href: "/parametres", icon: Settings, roles: all },
];
