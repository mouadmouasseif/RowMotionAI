import { createUserWithEmailAndPassword, deleteUser, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore/lite";
import { auth, db, firebaseConfigurationError, isFirebaseConfigured } from "@/lib/firebase";
import type { PublicRegistrationRole, UserProfile } from "@/types/user";

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: PublicRegistrationRole;
  phone?: string;
  clubId?: string;
  coachId?: string;
  licenseNumber?: string;
}

function getInitialActiveStatus(role: PublicRegistrationRole): boolean {
  return role === "athlete";
}

export async function registerUser(input: RegisterUserInput): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth || !db) {
    const message = process.env.NODE_ENV === "development" && firebaseConfigurationError
      ? firebaseConfigurationError
      : "Le service d’inscription est temporairement indisponible.";
    throw new Error(message);
  }
  if (!["athlete", "coach", "club_admin"].includes(input.role)) {
    throw new Error("Ce rôle ne peut pas être créé depuis l’inscription publique.");
  }

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const credential = await createUserWithEmailAndPassword(auth, email, input.password);

  try {
    await updateProfile(credential.user, { displayName: `${firstName} ${lastName}`.trim() });
    const profile: UserProfile = {
      uid: credential.user.uid,
      email,
      firstName,
      lastName,
      role: input.role,
      active: getInitialActiveStatus(input.role),
      clubId: input.clubId?.trim() || null,
      coachId: input.coachId?.trim() || null,
      licenseNumber: input.licenseNumber?.trim() || null,
      phone: input.phone?.trim() || null,
    };
    await setDoc(doc(db, "users", credential.user.uid), { ...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return profile;
  } catch (error) {
    try { await deleteUser(credential.user); } catch { /* L’erreur Firestore initiale reste prioritaire. */ }
    throw error;
  }
}
