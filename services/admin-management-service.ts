"use client";

import { auth } from "@/lib/firebase";
import type { ProfileDiscipline, ProfileGender, UserProfile } from "@/types/user";

export interface ManagedUserValues {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthDate: string | null;
  licenseNumber: string | null;
  trainingStartYear: number | null;
  specialty: string | null;
  category: string | null;
  officialCategory: string | null;
  level: string | null;
  height: number | null;
  weight: number | null;
  gender: ProfileGender;
  disciplines: ProfileDiscipline[];
  primaryDiscipline: ProfileDiscipline | null;
  nationality: string | null;
  dominantSide: UserProfile["dominantSide"];
  sportStatus: UserProfile["sportStatus"];
  active: boolean;
  clubId: string | null;
  coachId: string | null;
}

async function adminRequest(path: string, init: RequestInit) {
  const user = auth?.currentUser;
  if (!user) throw new Error("Session administrateur indisponible.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; error?: { message?: string } }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message || "L’action administrateur a échoué.");
  }
  return payload;
}

export async function updateManagedUser(userId: string, values: ManagedUserValues) {
  await adminRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify(values),
  });
}

export async function deleteManagedUser(userId: string) {
  await adminRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export async function deleteManagedClub(clubId: string) {
  await adminRequest(`/api/admin/clubs/${encodeURIComponent(clubId)}`, {
    method: "DELETE",
  });
}
