"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, UserCog } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { getAssociatedCoach } from "@/services/user-service";
import type { UserProfile } from "@/types/user";

function MyCoachContent() {
  const { profile } = useAuth();
  const [coach, setCoach] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (profile) {
      void getAssociatedCoach(profile)
        .then(setCoach)
        .finally(() => setLoaded(true));
    }
  }, [profile]);

  if (!profile) return null;

  return (
    <AppShell title="Mon coach" subtitle="Encadrement technique">
      {!loaded ? (
        <div className="loading-card">Chargement…</div>
      ) : !coach ? (
        <div className="empty-state">
          <UserCog />
          <h2>Vous n’avez pas encore de coach associé</h2>
          <p>L’administrateur de votre club peut réaliser cette association.</p>
        </div>
      ) : (
        <section className="profile-summary">
          <ProfileAvatar
            photoUrl={coach.profilePhotoUrl}
            firstName={coach.firstName}
            lastName={coach.lastName}
            large
          />
          <div>
            <h2>{coach.firstName} {coach.lastName}</h2>
            <p>{coach.specialty ?? "Entraîneur"} · {coach.email}</p>
            <small>
              Club : {coach.clubId ?? "—"} · Téléphone :{" "}
              {coach.phone ?? "Non communiqué"}
            </small>
          </div>
          <Link className="button ghost" href="/analyses">
            <FileText />
            Voir mes analyses
          </Link>
        </section>
      )}
    </AppShell>
  );
}

export default function MyCoachPage() {
  return (
    <ProtectedPage allowedRoles={["athlete"]}>
      <MyCoachContent />
    </ProtectedPage>
  );
}
