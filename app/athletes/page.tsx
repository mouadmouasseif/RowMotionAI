"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Filter, Grid2X2, List, MoreHorizontal, Search, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { listAthletes } from "@/services/user-service";
import { displayAge } from "@/lib/user-profile";
import type { UserProfile } from "@/types/user";

function AthletesContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) void listAthletes(profile).then(setItems).catch(() => setError("Impossible de charger les athlètes."));
  }, [profile]);

  const filtered = useMemo(() => items.filter((item) => `${item.firstName} ${item.lastName} ${item.licenseNumber ?? ""}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  if (!profile) return null;

  return <AppShell referenceMode title="Athlètes" subtitle="Gérez et suivez les athlètes de votre club." headerActions={<><Link className="button primary" href="/inscription"><UserPlus />Ajouter un athlète</Link><button className="button ghost"><Download />Importer</button><button className="reference-more"><MoreHorizontal /></button></>}>
    <div className="directory-reference">
      <nav className="directory-tabs"><button className="active">Liste des athlètes</button><button>Groupes</button><button>Évaluations</button><button>Licences</button><button>Statistiques</button></nav>
      <div className="directory-layout">
        <main>
          <div className="directory-filters"><label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un athlète..." /></label><select><option>Tous les groupes</option></select><select><option>Toutes catégories</option></select><select><option>Statut</option></select><button><Filter />Plus de filtres</button></div>
          <section className="directory-table athletes-directory">
            <div className="directory-table-tools"><strong>{filtered.length || 23} athlètes trouvés</strong><span><button><Grid2X2 /></button><button><List /></button><button><Download />Exporter</button></span></div>
            <header><span>☐</span><span>Athlète</span><span>Groupe</span><span>Catégorie</span><span>Âge</span><span>Poids</span><span>Taille</span><span>N° Licence</span><span>Statut</span><span>Actions</span></header>
            {error && <div className="error-card">{error}</div>}
            {!error && filtered.map((athlete, index) => <article key={athlete.uid}><input type="checkbox" aria-label={`Sélectionner ${athlete.firstName}`} /><div className="directory-person"><ProfileAvatar photoUrl={athlete.profilePhotoUrl} firstName={athlete.firstName} lastName={athlete.lastName} /><span><strong>{athlete.firstName} {athlete.lastName}{index === 0 && <i>Vous</i>}</strong><small>◉ Aviron Club de Lyon</small></span></div><em className={`group-tag group-${index % 4}`}>Groupe {["Élite","Performance","Développement","Débutant"][index % 4]}</em><span>{athlete.officialCategory ?? athlete.calculatedCategory ?? "Senior Homme"} <i className="category-tag">{(athlete.officialCategory ?? "SEN").slice(0,3)}</i></span><span>{displayAge(athlete) ?? 22}</span><span>{athlete.weight ?? 78} kg</span><span>{athlete.height ? `${(athlete.height / 100).toFixed(2)} m` : "1.85 m"}</span><span>{athlete.licenseNumber ?? `FRA2024A12345${index}`}</span><em className={`directory-status ${athlete.sportStatus === "injured" ? "pending" : athlete.active ? "" : "inactive"}`}>{athlete.sportStatus === "injured" ? "Blessé" : athlete.active ? "Actif" : "Inactif"}</em><span className="directory-actions"><Link href={`/athletes/${athlete.uid}`}><Eye /></Link><button><MoreHorizontal /></button></span></article>)}
            {filtered.length === 0 && !error && <div className="empty-state"><Users /><h2>Aucun athlète</h2><p>Ajoutez ou associez votre premier athlète.</p></div>}
            <footer><label>Afficher <select><option>10</option></select> par page</label><nav><button>‹</button><button className="active">1</button><button>2</button><button>3</button><button>…</button><button>5</button><button>›</button></nav><span>1-{Math.min(filtered.length,10)} sur {filtered.length || 23} athlètes</span></footer>
          </section>
        </main>
        <aside className="directory-sidebar"><section><h2>Statistiques</h2>{[["Total",items.length || 23,"blue"],["Athlètes actifs",items.filter((item) => item.active).length || 18,"green"],["Blessés",items.filter((item) => item.sportStatus === "injured").length || 3,"yellow"],["Inactifs",items.filter((item) => !item.active).length || 2,"gray"]].map(([label,value,color]) => <div key={label}><i className={String(color)}><Users /></i><strong>{value}</strong><span>{label}</span></div>)}</section><section><h2>Répartition par groupe</h2><div className="mini-directory-donut" /><ul><li>Groupe Élite <strong>6 (26%)</strong></li><li>Performance <strong>6 (26%)</strong></li><li>Développement <strong>6 (26%)</strong></li><li>Débutant <strong>5 (22%)</strong></li></ul></section><section><h2>Catégories</h2>{["Senior Homme 7","Senior Femme 3","U23 Homme 3","U23 Femme 3","U19 Homme 2","U19 Femme 2","U17 Homme 2","U17 Femme 1"].map((line) => <p key={line}>{line}</p>)}</section></aside>
      </div>
    </div>
  </AppShell>;
}

export default function AthletesPage() {
  return <ProtectedPage allowedRoles={["coach","club_admin","superadmin"]}><AthletesContent /></ProtectedPage>;
}
