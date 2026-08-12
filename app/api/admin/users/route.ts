import { FieldValue } from "firebase-admin/firestore";
import { requireApiUser } from "@/lib/api-auth";
import { getAdminServices } from "@/lib/firebase/admin";
import { getAthleteCategory } from "@/lib/athlete-category";
import {
  isUserRole,
  type ProfileDiscipline,
  type UserProfile,
  type UserRole,
} from "@/types/user";

const disciplines: ProfileDiscipline[] = ["ERGOMETER", "SKIFF", "BEACH_ROWING"];
const rolesWithFederationScope: UserRole[] = ["FEDERATION_PRESIDENT"];
const clubManagedRoles: UserRole[] = ["ATHLETE", "COACH", "JURY"];

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function responseError(reason: unknown) {
  const code = reason instanceof Error ? reason.message : "INTERNAL_ERROR";
  const status =
    code === "AUTH_REQUIRED"
      ? 401
      : code === "FORBIDDEN"
        ? 403
        : code === "INVALID_ROLE" || code === "INVALID_EMAIL" || code === "INVALID_PASSWORD" || code === "INVALID_COACH"
          ? 400
          : 500;
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Authentification requise.",
    ACCOUNT_INACTIVE: "Compte administrateur inactif.",
    FORBIDDEN: "Vous n'etes pas autorise a creer ce type de compte.",
    INVALID_ROLE: "Role invalide pour Firebase.",
    INVALID_EMAIL: "L'adresse e-mail est invalide.",
    INVALID_PASSWORD: "Le mot de passe doit contenir au moins 6 caracteres.",
    INVALID_COACH: "Le coach selectionne est invalide ou appartient a un autre club.",
  };
  return Response.json(
    { success: false, error: { code, message: messages[code] ?? code } },
    { status },
  );
}

function technicalScopeFrom(body: Record<string, unknown>, role: UserRole): UserProfile["technicalScope"] {
  if (role === "TECHNICAL_DIRECTOR") {
    const raw = body.technicalScope;
    const scope = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    const type = scope.type === "MULTI_CLUB" || scope.type === "FEDERATION" ? scope.type : "CLUB";
    const clubIds = Array.isArray(scope.clubIds)
      ? scope.clubIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];
    return { type, clubIds };
  }
  if (rolesWithFederationScope.includes(role)) return { type: "FEDERATION", clubIds: [] };
  return null;
}

export async function POST(request: Request) {
  let createdUid: string | null = null;
  try {
    const actor = await requireApiUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const role = body.role;
    if (!isUserRole(role)) throw new Error("INVALID_ROLE");
    const actorIsSuperAdmin = actor.role === "SUPER_ADMIN";
    const actorIsClubAdmin = actor.role === "CLUB_ADMIN" && Boolean(actor.clubId);
    if (!actorIsSuperAdmin && (!actorIsClubAdmin || !clubManagedRoles.includes(role))) {
      throw new Error("FORBIDDEN");
    }

    const email = nullableString(body.email)?.toLowerCase();
    const password = nullableString(body.password);
    const firstName = nullableString(body.firstName) ?? "";
    const lastName = nullableString(body.lastName) ?? "";
    if (!email || !email.includes("@")) throw new Error("INVALID_EMAIL");
    if (!password || password.length < 6) throw new Error("INVALID_PASSWORD");

    const { auth, db } = getAdminServices();
    const account = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
      disabled: body.active !== true,
    });
    createdUid = account.uid;

    const selectedDisciplines =
      role === "ATHLETE" ? disciplines : [];
    const birthDate = nullableString(body.birthDate);
    const clubId = actorIsClubAdmin ? actor.clubId : nullableString(body.clubId);
    const coachId = role === "ATHLETE" ? nullableString(body.coachId) : null;
    if (actorIsClubAdmin && !clubId) throw new Error("FORBIDDEN");
    if (coachId) {
      const coach = await db.doc(`users/${coachId}`).get();
      if (
        !coach.exists ||
        coach.data()?.role !== "COACH" ||
        !clubId ||
        coach.data()?.clubId !== clubId
      ) {
        throw new Error("INVALID_COACH");
      }
    }
    const calculatedCategory =
      role === "ATHLETE" && birthDate
        ? getAthleteCategory(new Date(birthDate), new Date().getUTCFullYear())
        : null;
    const profile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
      uid: account.uid,
      email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      photoURL: null,
      role,
      active: body.active === true,
      onboardingCompleted: true,
      clubId,
      coachId,
      coachIds: [],
      technicalScope: technicalScopeFrom(body, role),
      licenseNumber: nullableString(body.licenseNumber),
      phone: nullableString(body.phone),
      profilePhotoUrl: null,
      birthDate,
      trainingStartYear: nullableNumber(body.trainingStartYear),
      specialty: nullableString(body.specialty),
      category: null,
      level: null,
      height: null,
      weight: null,
      legacyAge: null,
      gender: "not_specified",
      disciplines: selectedDisciplines,
      primaryDiscipline: selectedDisciplines[0] ?? null,
      calculatedCategory,
      officialCategory: calculatedCategory,
      categoryOverrideReason: null,
      nationality: null,
      dominantSide: null,
      qrCodeId: role === "ATHLETE" ? crypto.randomUUID() : null,
      privacySettings: {
        qrEnabled: role === "ATHLETE",
        qrVisibility: "authenticated",
        showAge: false,
        showGender: false,
        showLicenseNumber: false,
        showBestPerformances: true,
      },
      sportStatus: "active",
    };

    const batch = db.batch();
    batch.set(db.doc(`users/${account.uid}`), {
      ...profile,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
    });
    if (profile.qrCodeId) {
      batch.set(db.doc(`qrProfiles/${profile.qrCodeId}`), {
        athleteId: profile.uid,
        role: profile.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePhotoUrl: profile.profilePhotoUrl,
        birthDate: profile.birthDate,
        gender: profile.gender,
        category: profile.officialCategory ?? profile.calculatedCategory,
        disciplines: profile.disciplines,
        clubId: profile.clubId,
        coachId: profile.coachId,
        licenseNumber: profile.licenseNumber,
        sportStatus: profile.sportStatus,
        privacySettings: profile.privacySettings,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    return Response.json({ success: true, data: { uid: account.uid } }, { status: 201 });
  } catch (reason) {
    if (createdUid) {
      try {
        const { auth } = getAdminServices();
        await auth.deleteUser(createdUid);
      } catch {
        // The original creation error is more useful for the caller.
      }
    }
    return responseError(reason);
  }
}
