import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Club } from "@/types/club";
import type { UserProfile } from "@/types/user";

function requireDatabase() {
  if (!auth?.currentUser || !db) throw new Error("Session Firebase indisponible.");
  return db;
}

export async function updateClubProfile(
  manager: UserProfile,
  clubId: string,
  values: Partial<Pick<Club, "name" | "shortName" | "city" | "country" | "email" | "phone" | "active">>,
) {
  const database = requireDatabase();
  if (manager.role !== "superadmin" && !(manager.role === "club_admin" && manager.clubId === clubId)) {
    throw new Error("Vous n’êtes pas autorisé à modifier ce club.");
  }
  await updateDoc(doc(database, "clubs", clubId), { ...values, updatedAt: serverTimestamp() });
}

export async function updateCoachProfile(
  manager: UserProfile,
  coach: UserProfile,
  values: {
    firstName: string;
    lastName: string;
    phone: string | null;
    specialty: string | null;
    licenseNumber: string | null;
    active: boolean;
  },
) {
  const database = requireDatabase();
  if (
    !["club_admin", "superadmin"].includes(manager.role) ||
    (manager.role === "club_admin" && manager.clubId !== coach.clubId)
  ) {
    throw new Error("Vous n’êtes pas autorisé à modifier ce coach.");
  }
  await updateDoc(doc(database, "users", coach.uid), { ...values, updatedAt: serverTimestamp() });
}
