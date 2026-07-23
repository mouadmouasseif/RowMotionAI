import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseConfigurationError } from "@/lib/firebase";
import { isUserRole, type ProfileCategory, type ProfileDiscipline, type ProfileGender, type UserProfile, type UserRole } from "@/types/user";

interface LoginParams {
  email: string;
  password: string;
  selectedRole: UserRole;
  superAdminCode?: string;
}

export function createUserProfile(uid: string, authEmail: string | null, data: Record<string, unknown>): UserProfile {
  if (!isUserRole(data.role)) throw new Error("Le profil possède un rôle invalide.");
  if (typeof data.uid === "string" && data.uid !== uid) {
    throw new Error("L’UID du profil Firestore ne correspond pas au compte Authentication.");
  }
  const allowedDisciplines: ProfileDiscipline[] = ["ERGOMETER", "SKIFF", "BEACH_ROWING"];
  const disciplines = Array.isArray(data.disciplines)
    ? data.disciplines.filter((value): value is ProfileDiscipline => typeof value === "string" && allowedDisciplines.includes(value as ProfileDiscipline))
    : [];
  const privacy = typeof data.privacySettings === "object" && data.privacySettings !== null ? data.privacySettings as Record<string, unknown> : {};
  const category = typeof data.category === "string" ? data.category : null;
  return {
    uid,
    email: typeof data.email === "string" ? data.email : authEmail ?? "",
    firstName: typeof data.firstName === "string" ? data.firstName : "",
    lastName: typeof data.lastName === "string" ? data.lastName : "",
    role: data.role,
    active: data.active === true,
    clubId: typeof data.clubId === "string" ? data.clubId : null,
    coachId: typeof data.coachId === "string" ? data.coachId : null,
    licenseNumber: typeof data.licenseNumber === "string" ? data.licenseNumber : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    profilePhotoUrl: typeof data.profilePhotoUrl === "string" ? data.profilePhotoUrl : null,
    birthDate: data.birthDate ?? null,
    trainingStartYear: typeof data.trainingStartYear === "number" ? data.trainingStartYear : null,
    specialty: typeof data.specialty === "string" ? data.specialty : null,
    category: typeof data.category === "string" ? data.category : null,
    level: typeof data.level === "string" ? data.level : null,
    height: typeof data.height === "number" ? data.height : null,
    weight: typeof data.weight === "number" ? data.weight : null,
    legacyAge: typeof data.age === "number" ? data.age : null,
    gender: (["male", "female", "other", "not_specified"] as string[]).includes(String(data.gender)) ? data.gender as ProfileGender : "not_specified",
    disciplines,
    primaryDiscipline: typeof data.primaryDiscipline === "string" && allowedDisciplines.includes(data.primaryDiscipline as ProfileDiscipline) ? data.primaryDiscipline as ProfileDiscipline : disciplines[0] ?? null,
    calculatedCategory: typeof data.calculatedCategory === "string" ? data.calculatedCategory as ProfileCategory : category as ProfileCategory | null,
    officialCategory: typeof data.officialCategory === "string" ? data.officialCategory as ProfileCategory : category as ProfileCategory | null,
    categoryOverrideReason: typeof data.categoryOverrideReason === "string" ? data.categoryOverrideReason : null,
    nationality: typeof data.nationality === "string" ? data.nationality : null,
    dominantSide: (["left", "right", "ambidextrous"] as string[]).includes(String(data.dominantSide)) ? data.dominantSide as "left" | "right" | "ambidextrous" : null,
    qrCodeId: typeof data.qrCodeId === "string" ? data.qrCodeId : null,
    privacySettings: {
      qrEnabled: privacy.qrEnabled !== false,
      qrVisibility: (["public", "authenticated", "club_only", "coach_only"] as string[]).includes(String(privacy.qrVisibility)) ? privacy.qrVisibility as UserProfile["privacySettings"]["qrVisibility"] : "authenticated",
      showAge: privacy.showAge === true,
      showGender: privacy.showGender === true,
      showLicenseNumber: privacy.showLicenseNumber === true,
      showBestPerformances: privacy.showBestPerformances !== false,
    },
    sportStatus: (["active", "injured", "inactive", "archived"] as string[]).includes(String(data.sportStatus)) ? data.sportStatus as UserProfile["sportStatus"] : "active",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function verifySuperAdminCode(code: string): Promise<void> {
  const response = await fetch("/api/auth/verify-super-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const result = (await response.json()) as { valid?: boolean };
  if (!response.ok || result.valid !== true) throw new Error("Code Super administrateur incorrect.");
}

export async function loginUser({ email, password, selectedRole, superAdminCode = "" }: LoginParams): Promise<UserProfile> {
  if (!auth || !db) {
    throw new Error(process.env.NODE_ENV === "development" && firebaseConfigurationError
      ? firebaseConfigurationError
      : "Le service de connexion est temporairement indisponible.");
  }
  if (selectedRole === "superadmin") await verifySuperAdminCode(superAdminCode);

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  try {
    const snapshot = await getDoc(doc(db, "users", credential.user.uid));
    if (!snapshot.exists()) throw new Error("Le compte existe, mais son profil n’est pas configuré.");
    const profile = createUserProfile(credential.user.uid, credential.user.email, snapshot.data());
    if (!profile.active) {
      if (profile.role === "coach") throw new Error("Votre compte entraîneur est en attente de validation par un administrateur.");
      if (profile.role === "club_admin") throw new Error("Votre compte administrateur de club est en attente de validation par le Super administrateur.");
      throw new Error("Ce compte a été désactivé.");
    }
    if (profile.role !== selectedRole) throw new Error("Le rôle sélectionné ne correspond pas à ce compte.");
    return profile;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}
