"use client";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ProfileDiscipline, ProfileGender, UserProfile, UserRole } from "@/types/user";

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

export interface ManagedCreateUserValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  phone: string | null;
  clubId: string | null;
  coachId: string | null;
  licenseNumber: string | null;
  birthDate: string | null;
  trainingStartYear: number | null;
  specialty: string | null;
  technicalScope: UserProfile["technicalScope"];
}

class AdminRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
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
    const message =
      payload?.error?.message ||
      (response.status >= 500
        ? "Service administrateur indisponible."
        : "L'action administrateur a echoue.");
    throw new AdminRequestError(message, response.status);
  }
  return payload;
}

async function updateFirestoreProfile(userId: string, values: ManagedUserValues) {
  const actor = auth?.currentUser;
  if (!db || !actor) throw new Error("Firebase indisponible.");
  await updateDoc(doc(db, "users", userId), {
    email: values.email.toLowerCase(),
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    birthDate: values.birthDate,
    licenseNumber: values.licenseNumber,
    trainingStartYear: values.trainingStartYear,
    specialty: values.specialty,
    category: values.category,
    officialCategory: values.officialCategory,
    level: values.level,
    height: values.height,
    weight: values.weight,
    gender: values.gender,
    disciplines: values.disciplines,
    primaryDiscipline: values.primaryDiscipline,
    nationality: values.nationality,
    dominantSide: values.dominantSide,
    sportStatus: values.sportStatus,
    active: values.active,
    clubId: values.clubId,
    coachId: values.coachId,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  });
}

export async function updateManagedUser(userId: string, values: ManagedUserValues) {
  await updateFirestoreProfile(userId, values);
}

export async function createManagedUser(values: ManagedCreateUserValues) {
  await adminRequest("/api/admin/users", {
    method: "POST",
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
