"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { listManagedUsers } from "@/services/club-service";
import type { UserProfile } from "@/types/user";

function UsersContent() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (profile) void listManagedUsers(profile).then(setUsers);
  }, [profile]);

  return (
    <AppShell title="Tous les utilisateurs" subtitle="Super administration">
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
    </AppShell>
  );
}

export default function SuperAdminUsersPage() {
  return (
    <ProtectedPage allowedRoles={["superadmin"]}>
      <UsersContent />
    </ProtectedPage>
  );
}
