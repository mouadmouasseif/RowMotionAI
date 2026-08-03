import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseConfigurationError } from "@/lib/firebase";
import {
  normalizeUserRole,
  type ProfileCategory,
  type ProfileDiscipline,
  type ProfileGender,
  type UserProfile,
} from "@/types/user";

interface LoginParams {
  email: string;
  password: string;
}

function technicalScopeFrom(data: Record<string, unknown>): UserProfile["technicalScope"] {
  const raw = data.technicalScope;
  if (typeof raw !== "object" || raw === null) return null;
  const scope = raw as Record<string, unknown>;
  return {
    type: (["CLUB", "MULTI_CLUB", "FEDERATION"] as string[]).includes(String(scope.type))
      ? scope.type as "CLUB" | "MULTI_CLUB" | "FEDERATION"
      : "CLUB",
    clubIds: Array.isArray(scope.clubIds)
      ? scope.clubIds.filter((value): value is string => typeof value === "string")
      : [],
  };
}

export function createUserProfile(uid: string, authEmail: string | null, data: Record<string, unknown>): UserProfile {
  const role = normalizeUserRole(data.role);
  if (!role) throw new Error("Le profil possede un role invalide.");
  if (typeof data.uid === "string" && data.uid !== uid) {
    throw new Error("L'UID du profil Firestore ne correspond pas au compte Authentication.");
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
    displayName: typeof data.displayName === "string" ? data.displayName : undefined,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
    role,
    active: data.active === true,
    onboardingCompleted: data.onboardingCompleted === true,
    clubId: typeof data.clubId === "string" ? data.clubId : null,
    coachId: typeof data.coachId === "string" ? data.coachId : null,
    technicalScope: technicalScopeFrom(data),
    licenseNumber: typeof data.licenseNumber === "string" ? data.licenseNumber : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    profilePhotoUrl: typeof data.profilePhotoUrl === "string" ? data.profilePhotoUrl : typeof data.photoURL === "string" ? data.photoURL : null,
    birthDate: data.birthDate ?? null,
    trainingStartYear: typeof data.trainingStartYear === "number" ? data.trainingStartYear : null,
    specialty: typeof data.specialty === "string" ? data.specialty : null,
    category,
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

export async function loginUser({ email, password }: LoginParams): Promise<UserProfile> {
  if (!auth || !db) {
    throw new Error(process.env.NODE_ENV === "development" && firebaseConfigurationError
      ? firebaseConfigurationError
      : "Le service de connexion est temporairement indisponible.");
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  try {
    const snapshot = await getDoc(doc(db, "users", credential.user.uid));
    if (!snapshot.exists()) {
      throw new Error("Votre compte existe mais aucun profil RowMotion AI n'est associe a ce compte. Contactez l'administrateur.");
    }
    const profile = createUserProfile(credential.user.uid, credential.user.email, snapshot.data());
    if (!profile.active) throw new Error("Ce compte a ete desactive.");
    return profile;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}
