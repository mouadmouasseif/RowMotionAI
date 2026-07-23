import { createUserWithEmailAndPassword, deleteUser, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigurationError, isFirebaseConfigured } from "@/lib/firebase";
import { getAthleteCategory } from "@/lib/athlete-category";
import type { ProfileDiscipline, PublicRegistrationRole, UserProfile } from "@/types/user";

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
  birthDate: string;
  trainingStartYear: number;
  disciplines?: ProfileDiscipline[];
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
    const calculatedCategory = input.role === "athlete" ? getAthleteCategory(new Date(input.birthDate), new Date().getUTCFullYear()) : null;
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
      profilePhotoUrl: null,
      birthDate: input.birthDate,
      trainingStartYear: input.trainingStartYear,
      specialty: null,
      category: null,
      level: null,
      height: null,
      weight: null,
      legacyAge: null,
      gender: "not_specified",
      disciplines: input.role === "athlete" ? input.disciplines?.length ? input.disciplines : ["ERGOMETER"] : [],
      primaryDiscipline: input.role === "athlete" ? input.disciplines?.[0] ?? "ERGOMETER" : null,
      calculatedCategory,
      officialCategory: calculatedCategory,
      categoryOverrideReason: null,
      nationality: null,
      dominantSide: null,
      qrCodeId: crypto.randomUUID(),
      privacySettings: { qrEnabled: true, qrVisibility: "authenticated", showAge: false, showGender: false, showLicenseNumber: false, showBestPerformances: true },
      sportStatus: "active",
    };
    await setDoc(doc(db, "users", credential.user.uid), { ...profile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    if (profile.qrCodeId) await setDoc(doc(db, "qrProfiles", profile.qrCodeId), {
      athleteId: profile.uid, role: profile.role, firstName: profile.firstName, lastName: profile.lastName,
      profilePhotoUrl: profile.profilePhotoUrl, birthDate: profile.birthDate, gender: profile.gender,
      category: profile.officialCategory ?? profile.calculatedCategory, disciplines: profile.disciplines,
      clubId: profile.clubId, coachId: profile.coachId, licenseNumber: profile.licenseNumber,
      sportStatus: profile.sportStatus, privacySettings: profile.privacySettings, updatedAt: serverTimestamp(),
    });
    return profile;
  } catch (error) {
    try { await deleteUser(credential.user); } catch { /* L’erreur Firestore initiale reste prioritaire. */ }
    throw error;
  }
}
