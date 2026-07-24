import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  FileBarChart,
  FileVideo,
  HelpCircle,
  Info,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  TrendingUp,
  Trophy,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/user";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const all: UserRole[] = ["athlete", "coach", "club_admin", "superadmin"];
const managers: UserRole[] = ["coach", "club_admin", "superadmin"];

export const navigationSections: NavigationSection[] = [
  {
    label: "Général",
    items: [
      { label: "Tableau de bord", href: "/tableau-de-bord", icon: LayoutDashboard, roles: all },
      { label: "Analyses", href: "/analyses", icon: FileVideo, roles: all },
      { label: "Progression", href: "/progression", icon: TrendingUp, roles: all },
      { label: "Calendrier", href: "/competitions/calendrier", icon: CalendarDays, roles: all },
      { label: "Notifications", href: "/notifications", icon: Bell, roles: all },
    ],
  },
  {
    label: "Gestion",
    items: [
      { label: "Compétitions", href: "/competitions", icon: Trophy, roles: all },
      { label: "Athlètes", href: "/athletes", icon: Users, roles: managers },
      { label: "Coachs", href: "/coaches", icon: UserCog, roles: ["club_admin", "superadmin"] },
      { label: "Clubs", href: "/clubs", icon: Building2, roles: ["superadmin"] },
      { label: "Mon coach", href: "/mon-coach", icon: UserCog, roles: ["athlete"] },
      { label: "Mon club", href: "/mon-club", icon: Building2, roles: ["athlete", "coach", "club_admin"] },
    ],
  },
  {
    label: "Entraînement",
    items: [
      { label: "Plans d’entraînement", href: "/plans-entrainement", icon: BookOpen, roles: all },
    ],
  },
  {
    label: "Rapports & exports",
    items: [
      { label: "Rapports", href: "/rapports", icon: FileBarChart, roles: all },
    ],
  },
  {
    label: "Paramètres",
    items: [
      { label: "Profil", href: "/profil", icon: UserRound, roles: all },
      { label: "Paramètres", href: "/parametres", icon: Settings, roles: all },
      { label: "Confidentialité", href: "/confidentialite", icon: ShieldCheck, roles: all },
      { label: "Aide & support", href: "/aide", icon: HelpCircle, roles: all },
      { label: "À propos", href: "/a-propos", icon: Info, roles: all },
    ],
  },
];

export const navigationItems = navigationSections.flatMap((section) => section.items);
