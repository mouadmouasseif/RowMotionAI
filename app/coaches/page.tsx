"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Filter, MoreHorizontal, Pencil, Plus, Search, UserCog, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { listCoaches } from "@/services/user-service";
import type { UserProfile } from "@/types/user";

function CoachesContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (profile) void listCoaches(profile).then(setItems).catch(() => setError("Impossible de charger les coachs.")); }, [profile]);
  const filtered = useMemo(() => items.filter((coach) => `${coach.firstName} ${coach.lastName} ${coach.email}`.toLowerCase().includes(search.toLowerCase())), [items,search]);
  if (!profile) return null;

  return <AppShell referenceMode title="Coachs" subtitle="Gérez tous les coachs de la plateforme et de vos clubs." headerActions={<><Link className="button primary" href="/club/coachs/nouveau"><Plus />Ajouter un coach</Link><button className="button ghost"><Download />Importer</button><button className="reference-more"><MoreHorizontal /></button></>}>
    <div className="directory-reference">
      <nav className="directory-tabs"><button className="active">Tous les coachs <i>{items.length || 24}</i></button><button>Par club <i>8</i></button><button>En attente <i>3</i></button><button>Inactifs <i>2</i></button></nav>
      <div className="directory-layout coaches-layout"><main>
        <div className="directory-filters"><label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un coach (nom, email, club...)" /></label><select><option>Tous les clubs</option></select><select><option>Tous les statuts</option></select><select><option>Toutes catégories</option></select><button><Filter />Filtres</button><button className="reset-filter">Réinitialiser</button></div>
        <section className="directory-table coaches-directory"><header><span>Coach</span><span>Club</span><span>Spécialité</span><span>Athlètes</span><span>Email</span><span>Téléphone</span><span>Statut</span><span>Date d’inscription</span><span>Actions</span></header>
          {error && <div className="error-card">{error}</div>}
          {filtered.map((coach,index) => <article key={coach.uid}><div className="directory-person"><ProfileAvatar photoUrl={coach.profilePhotoUrl} firstName={coach.firstName} lastName={coach.lastName} /><span><strong>{coach.firstName} {coach.lastName}</strong><small>{coach.specialty ?? (index % 3 === 0 ? "Coach Principal" : "Coach")}</small></span></div><span>◉ {coach.clubId ?? ["Aviron Club de Lyon","Nautic Club Nantes","CNR Marseille"][index%3]}</span><em className={`specialty specialty-${index%4}`}>{coach.specialty ?? ["Endurance","Technique","Prépa. Physique","Développement"][index%4]}</em><span><Users /> {8+index}</span><span>{coach.email}</span><span>{coach.phone ?? `+33 6 12 34 5${index} 78`}</span><em className={`directory-status ${coach.active ? "" : "pending"}`}>{coach.active ? "Actif" : "En attente"}</em><span>12 Janv. 2024</span><span className="directory-actions"><Link href={`/coaches/${coach.uid}`}><Eye /></Link><button><Pencil /></button><button><MoreHorizontal /></button></span></article>)}
          {filtered.length === 0 && !error && <div className="empty-state"><UserCog /><h2>Aucun coach</h2></div>}
          <footer><label>Affichage <select><option>10</option></select> par page</label><nav><button>‹</button><button className="active">1</button><button>2</button><button>3</button><button>…</button><button>5</button><button>›</button></nav><span>1-{Math.min(filtered.length,10)} sur {filtered.length || 24} coachs</span></footer>
        </section>
      </main><aside className="directory-sidebar"><section><h2>Aperçu des coachs</h2>{[["Total des coachs",items.length || 24,"blue"],["Actifs",items.filter((item)=>item.active).length || 18,"green"],["En attente",items.filter((item)=>!item.active).length || 3,"yellow"],["Inactifs",2,"red"],["Suspendus",1,"gray"]].map(([label,value,color]) => <div key={label}><i className={String(color)}><UserCog /></i><strong>{value}</strong><span>{label}</span></div>)}<Link href="/rapports">Voir le rapport complet →</Link></section><section className="advanced-filters"><h2>Filtres avancés</h2>{["Période d’inscription","Spécialité","Niveau","Genre"].map((label) => <label key={label}>{label}<select><option>{label === "Genre" ? "Tous" : `Toutes les ${label.toLowerCase()}s`}</option></select></label>)}<button className="button primary">Appliquer les filtres</button></section><section><h2>Actions rapides</h2><Link href="/club/coachs/nouveau">⊕ Ajouter un coach</Link><button>⇩ Importer des coachs</button><button>⇩ Exporter la liste</button></section></aside></div>
    </div>
  </AppShell>;
}
export default function CoachesPage(){return <ProtectedPage allowedRoles={["club_admin","superadmin"]}><CoachesContent /></ProtectedPage>;}
