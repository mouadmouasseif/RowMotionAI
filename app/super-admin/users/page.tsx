"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { CreateManagedUserDialog } from "@/components/admin/CreateManagedUserDialog";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { listClubs, listManagedUsers } from "@/services/club-service";
import { listCoaches } from "@/services/user-service";
import type { Club } from "@/types/club";
import type { UserProfile } from "@/types/user";

function UsersContent() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [coaches, setCoaches] = useState<UserProfile[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      void Promise.all([listManagedUsers(profile), listClubs(profile), listCoaches(profile)]).then(
        ([rows, availableClubs, availableCoaches]) => {
          setUsers(rows);
          setClubs(availableClubs);
          setCoaches(availableCoaches);
        },
      );
    }
  }, [profile]);

  const load = async () => {
    if (!profile) return;
    const [rows, availableClubs, availableCoaches] = await Promise.all([
      listManagedUsers(profile),
      listClubs(profile),
      listCoaches(profile),
    ]);
    setUsers(rows);
    setClubs(availableClubs);
    setCoaches(availableCoaches);
  };

  return (
    <AppShell
      title="Tous les utilisateurs"
      subtitle="Super administration"
      headerActions={<button className="button primary" type="button" onClick={() => setCreateOpen(true)}><UserPlus />Creer un compte</button>}
    >
      <div className="data-grid">
        {users.map((user) => (
          <article className="data-card" key={user.uid}>
            <ProfileAvatar
              photoUrl={user.profilePhotoUrl}
              firstName={user.firstName}
              lastName={user.lastName}
            />
            <h2>{user.firstName} {user.lastName}</h2>
            <p>{user.email}</p>
            <small>
              {user.role} · {user.active ? "Actif" : "En attente"}
              <br />
              Club : {user.clubId ?? "—"}
            </small>
          </article>
        ))}
      </div>
      {users.length === 0 && (
        <div className="empty-state">
          <Users />
          <p>Aucun utilisateur accessible.</p>
        </div>
      )}
      {createOpen && (
        <CreateManagedUserDialog
          clubs={clubs}
          coaches={coaches}
          onClose={() => setCreateOpen(false)}
          onSaved={load}
        />
      )}
    </AppShell>
  );
}

export default function SuperAdminUsersPage() {
  return (
    <ProtectedPage allowedRoles={["SUPER_ADMIN"]}>
      <UsersContent />
    </ProtectedPage>
  );
}

