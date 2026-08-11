import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Dumbbell,
  FileBarChart,
  FileVideo,
  Flag,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  Medal,
  MessageSquare,
  Radio,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  UserCog,
  UserRound,
  Users,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/user";

export interface RoleNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface RoleNavigationSection {
  label: string;
  items: RoleNavigationItem[];
}

const common = {
  messages: { label: "Messages", href: "/messages", icon: MessageSquare },
  notifications: { label: "Notifications", href: "/notifications", icon: Bell },
  profile: { label: "Profil", href: "/profil", icon: UserRound },
  settings: { label: "Parametres", href: "/parametres", icon: Settings },
} satisfies Record<string, RoleNavigationItem>;

export const navigationByRole: Record<UserRole, RoleNavigationSection[]> = {
  ATHLETE: [
    { label: "Tableau de bord", items: [{ label: "Vue d'ensemble", href: "/athlete/dashboard", icon: LayoutDashboard }] },
    { label: "Analyse", items: [{ label: "Mes analyses", href: "/analyses", icon: FileVideo }, { label: "Nouvelle analyse", href: "/analyses/nouvelle", icon: Radio }, { label: "Comparer", href: "/analyses", icon: BarChart3 }, { label: "Progression", href: "/progression", icon: Activity }] },
    { label: "Entrainement", items: [{ label: "Mes plans", href: "/plans-entrainement", icon: BookOpen }, { label: "Mes seances", href: "/sessions", icon: CalendarDays }, { label: "Ergometre", href: "/training-zones", icon: Dumbbell }, { label: "Sur l'eau", href: "/rowing", icon: Waves }, { label: "Beach Rowing", href: "/beach-sprint", icon: Flag }, { label: "Zones & frequences", href: "/training-zones", icon: HeartPulse }, { label: "Exercices", href: "/plans-entrainement", icon: Target }] },
    { label: "Performance", items: [{ label: "Tests & evaluations", href: "/benchmarks", icon: Gauge }, { label: "Records", href: "/progression", icon: Medal }, { label: "Biomecanique", href: "/analyses", icon: Activity }] },
    { label: "Competitions", items: [{ label: "Mes competitions", href: "/competitions", icon: Trophy }, { label: "Resultats", href: "/competitions", icon: Medal }, { label: "Classements", href: "/competitions", icon: BarChart3 }] },
    { label: "Autres", items: [{ label: "Calendrier", href: "/competitions/calendrier", icon: CalendarDays }, common.notifications, common.messages] },
    { label: "Parametres", items: [common.profile, common.settings] },
  ],
  COACH: [
    { label: "Tableau de bord", items: [{ label: "Vue d'ensemble", href: "/coach/dashboard", icon: LayoutDashboard }, { label: "Mes athletes", href: "/coach/athletes", icon: Users }, { label: "Analyses", href: "/analyses", icon: FileVideo }, { label: "Comparaisons", href: "/analyses", icon: BarChart3 }, { label: "Progression equipe", href: "/progression", icon: Activity }] },
    { label: "Entrainement", items: [{ label: "Plans d'entrainement", href: "/plans-entrainement", icon: BookOpen }, { label: "Seances", href: "/sessions", icon: CalendarDays }, { label: "Ergometre", href: "/training-zones", icon: Dumbbell }, { label: "Sur l'eau", href: "/rowing", icon: Waves }, { label: "Beach Rowing", href: "/beach-sprint", icon: Flag }, { label: "Zones & frequences", href: "/training-zones", icon: HeartPulse }, { label: "Bibliotheque d'exercices", href: "/plans-entrainement", icon: Target }] },
    { label: "Competitions", items: [{ label: "Competitions", href: "/competitions", icon: Trophy }, { label: "Engagements", href: "/competitions", icon: Flag }, { label: "Resultats", href: "/competitions", icon: Medal }] },
    { label: "Gestion", items: [{ label: "Athletes", href: "/athletes", icon: Users }, { label: "Groupes", href: "/coach/athletes", icon: Users }, { label: "Calendrier", href: "/competitions/calendrier", icon: CalendarDays }, common.notifications, common.messages] },
    { label: "Rapports", items: [{ label: "Rapports", href: "/rapports", icon: FileBarChart }, { label: "Statistiques", href: "/progression", icon: BarChart3 }] },
    { label: "Parametres", items: [common.profile, common.settings] },
  ],
  CLUB_ADMIN: [
    { label: "Tableau de bord", items: [{ label: "Vue d'ensemble", href: "/club/dashboard", icon: LayoutDashboard }, { label: "Activite du club", href: "/club/dashboard", icon: Activity }] },
    { label: "Gestion", items: [{ label: "Athletes", href: "/club/athletes", icon: Users }, { label: "Coaches", href: "/club/coachs", icon: UserCog }, { label: "Groupes", href: "/club/associations", icon: Users }, { label: "Infrastructures", href: "/club/dashboard", icon: Building2 }, { label: "Equipements", href: "/club/dashboard", icon: Dumbbell }] },
    { label: "Entrainement", items: [{ label: "Plans d'entrainement", href: "/plans-entrainement", icon: BookOpen }, { label: "Seances", href: "/sessions", icon: CalendarDays }, { label: "Ergometres", href: "/training-zones", icon: Dumbbell }, { label: "Zones & frequences", href: "/training-zones", icon: HeartPulse }] },
    { label: "Competitions", items: [{ label: "Competitions", href: "/competitions", icon: Trophy }, { label: "Inscriptions", href: "/competitions", icon: Flag }, { label: "Resultats", href: "/competitions", icon: Medal }, { label: "Classements", href: "/competitions", icon: BarChart3 }] },
    { label: "Juree", items: [{ label: "Juges & arbitres", href: "/jury/dashboard", icon: ShieldCheck }, { label: "Affectations", href: "/jury/dashboard", icon: CalendarDays }] },
    { label: "Rapports", items: [{ label: "Rapports club", href: "/rapports", icon: FileBarChart }, { label: "Statistiques", href: "/progression", icon: BarChart3 }, { label: "Exportations", href: "/rapports", icon: FileBarChart }] },
    { label: "Parametres", items: [{ label: "Informations club", href: "/mon-club", icon: Building2 }, { label: "Utilisateurs", href: "/club/associations", icon: Users }, common.settings] },
  ],
  TECHNICAL_DIRECTOR: [
    { label: "Tableau de bord", items: [{ label: "Vue strategique", href: "/technical-director/dashboard", icon: LayoutDashboard }, { label: "Activite en direct", href: "/technical-director/dashboard", icon: Radio }, { label: "Alertes performance", href: "/technical-director/dashboard", icon: Bell }] },
    { label: "Athletes", items: [{ label: "Tous les athletes", href: "/athletes", icon: Users }, { label: "Groupes", href: "/athletes", icon: Users }, { label: "Talents", href: "/technical-director/dashboard", icon: Medal }, { label: "Athletes a surveiller", href: "/technical-director/athletes-a-surveiller", icon: HeartPulse }, { label: "Comparaisons", href: "/analyses", icon: BarChart3 }] },
    { label: "Coachs", items: [{ label: "Equipe technique", href: "/coaches", icon: UserCog }, { label: "Activite coaches", href: "/technical-director/dashboard", icon: Activity }, { label: "Plans proposes", href: "/plans-entrainement", icon: BookOpen }, { label: "Evaluations", href: "/benchmarks", icon: Gauge }] },
    { label: "Performance", items: [{ label: "Analyses techniques", href: "/analyses", icon: FileVideo }, { label: "Progression", href: "/progression", icon: Activity }, { label: "Biomecanique", href: "/analyses", icon: Gauge }, { label: "Puissance musculaire", href: "/technical-director/dashboard", icon: Dumbbell }, { label: "Tests physiques", href: "/benchmarks", icon: Target }, { label: "Records", href: "/progression", icon: Medal }] },
    { label: "Entrainement", items: [{ label: "Planification", href: "/plans-entrainement", icon: CalendarDays }, { label: "Plans d'entrainement", href: "/plans-entrainement", icon: BookOpen }, { label: "Cycles", href: "/plans-entrainement", icon: Activity }, { label: "Charge d'entrainement", href: "/progression", icon: Gauge }, { label: "Zones", href: "/training-zones", icon: HeartPulse }] },
    { label: "Competitions", items: [{ label: "Calendrier", href: "/competitions/calendrier", icon: CalendarDays }, { label: "Preparation", href: "/competitions", icon: Target }, { label: "Selections", href: "/competitions", icon: Flag }, { label: "Resultats", href: "/competitions", icon: Medal }] },
    { label: "Rapports", items: [{ label: "Rapport technique", href: "/rapports", icon: FileBarChart }, { label: "Export PDF / Excel", href: "/rapports", icon: FileBarChart }] },
    { label: "Communication", items: [common.messages, common.notifications] },
    { label: "Parametres", items: [common.profile, { label: "Preferences", href: "/parametres", icon: Settings }] },
  ],
  SUPER_ADMIN: [
    { label: "Tableau de bord", items: [{ label: "Vue d'ensemble", href: "/super-admin/dashboard", icon: LayoutDashboard }, { label: "Analyses generales", href: "/analyses", icon: FileVideo }, { label: "Activite temps reel", href: "/super-admin/dashboard", icon: Radio }] },
    { label: "Gestion globale", items: [{ label: "Athletes", href: "/super-admin/athletes", icon: Users }, { label: "Coaches", href: "/super-admin/coachs", icon: UserCog }, { label: "Directeurs techniques", href: "/super-admin/users", icon: ShieldCheck }, { label: "Clubs", href: "/super-admin/clubs", icon: Building2 }, { label: "Competitions", href: "/competitions", icon: Trophy }, { label: "Jury / Jurees", href: "/jury/dashboard", icon: ShieldCheck }, { label: "Plans d'entrainement", href: "/plans-entrainement", icon: BookOpen }] },
    { label: "Rapports & statistiques", items: [{ label: "Rapports", href: "/rapports", icon: FileBarChart }, { label: "Statistiques", href: "/progression", icon: BarChart3 }, { label: "Exportations", href: "/rapports", icon: FileBarChart }] },
    { label: "Parametres systeme", items: [{ label: "Utilisateurs", href: "/super-admin/users", icon: Users }, { label: "Roles & Permissions", href: "/super-admin/users", icon: ShieldCheck }, common.settings, { label: "Integrations", href: "/admin/system/pwa", icon: Gauge }, { label: "Securite", href: "/admin/system/pwa", icon: ShieldCheck }] },
  ],
  JURY: [
    { label: "Tableau de bord", items: [{ label: "Vue d'ensemble", href: "/jury/dashboard", icon: LayoutDashboard }] },
    { label: "Competitions", items: [{ label: "Mes affectations", href: "/jury/dashboard", icon: CalendarDays }, { label: "Competitions", href: "/competitions", icon: Trophy }, { label: "Courses", href: "/jury/dashboard", icon: Flag }, { label: "Live", href: "/jury/dashboard", icon: Radio }] },
    { label: "Jury", items: [{ label: "Departs", href: "/jury/dashboard", icon: Flag }, { label: "Arrivees", href: "/jury/dashboard", icon: Medal }, { label: "Penalites", href: "/jury/dashboard", icon: ShieldCheck }, { label: "Incidents", href: "/jury/dashboard", icon: Bell }, { label: "Protestations", href: "/jury/dashboard", icon: MessageSquare }] },
    { label: "Resultats", items: [{ label: "Classements", href: "/competitions", icon: BarChart3 }, { label: "Resultats provisoires", href: "/competitions", icon: FileBarChart }, { label: "Resultats officiels", href: "/competitions", icon: Medal }] },
    { label: "Autres", items: [common.notifications, common.profile] },
  ],
};
