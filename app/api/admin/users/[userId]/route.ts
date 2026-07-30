import { FieldValue } from "firebase-admin/firestore";
import { requireApiUser } from "@/lib/api-auth";
import { getAdminServices } from "@/lib/firebase/admin";
import type { ProfileDiscipline, ProfileGender, UserProfile } from "@/types/user";

const disciplines: ProfileDiscipline[] = ["ERGOMETER", "SKIFF", "BEACH_ROWING"];
const genders: ProfileGender[] = ["male", "female", "other", "not_specified"];
const sportStatuses: UserProfile["sportStatus"][] = [
  "active",
  "injured",
  "inactive",
  "archived",
];
const dominantSides = ["left", "right", "ambidextrous"] as const;

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
        : code === "NOT_FOUND"
          ? 404
          : 400;
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Authentification requise.",
    ACCOUNT_INACTIVE: "Compte administrateur inactif.",
    FORBIDDEN: "Action réservée au Super administrateur.",
    NOT_FOUND: "Utilisateur introuvable.",
    INVALID_COACH: "Le coach sélectionné est invalide ou appartient à un autre club.",
    INVALID_EMAIL: "L’adresse e-mail est invalide.",
  };
  return Response.json(
    { success: false, error: { code, message: messages[code] ?? code } },
    { status },
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const actor = await requireApiUser(request);
    if (actor.role !== "superadmin") throw new Error("FORBIDDEN");
    const { userId } = await context.params;
    const { auth, db } = getAdminServices();
    const reference = db.doc(`users/${userId}`);
    const snapshot = await reference.get();
    if (!snapshot.exists) throw new Error("NOT_FOUND");
    const current = snapshot.data() ?? {};
    const body = (await request.json()) as Record<string, unknown>;

    const email = nullableString(body.email)?.toLowerCase();
    if (!email || !email.includes("@")) throw new Error("INVALID_EMAIL");
    const clubId = nullableString(body.clubId);
    const coachId = current.role === "athlete" ? nullableString(body.coachId) : null;
    const selectedDisciplines = Array.isArray(body.disciplines)
      ? body.disciplines.filter(
          (value): value is ProfileDiscipline =>
            typeof value === "string" &&
            disciplines.includes(value as ProfileDiscipline),
        )
      : [];
    const primaryDiscipline =
      typeof body.primaryDiscipline === "string" &&
      selectedDisciplines.includes(body.primaryDiscipline as ProfileDiscipline)
        ? (body.primaryDiscipline as ProfileDiscipline)
        : selectedDisciplines[0] ?? null;

    if (coachId) {
      const coach = await db.doc(`users/${coachId}`).get();
      if (
        !coach.exists ||
        coach.data()?.role !== "coach" ||
        !clubId ||
        coach.data()?.clubId !== clubId
      ) {
        throw new Error("INVALID_COACH");
      }
    }

    const gender = genders.includes(body.gender as ProfileGender)
      ? (body.gender as ProfileGender)
      : "not_specified";
    const sportStatus = sportStatuses.includes(
      body.sportStatus as UserProfile["sportStatus"],
    )
      ? (body.sportStatus as UserProfile["sportStatus"])
      : "active";
    const dominantSide = dominantSides.includes(
      body.dominantSide as (typeof dominantSides)[number],
    )
      ? (body.dominantSide as (typeof dominantSides)[number])
      : null;

    await auth.updateUser(userId, {
      email,
      displayName: `${nullableString(body.firstName) ?? ""} ${nullableString(body.lastName) ?? ""}`.trim(),
      disabled: body.active !== true,
    });

    const batch = db.batch();
    batch.update(reference, {
      email,
      firstName: nullableString(body.firstName) ?? "",
      lastName: nullableString(body.lastName) ?? "",
      phone: nullableString(body.phone),
      birthDate: nullableString(body.birthDate),
      licenseNumber: nullableString(body.licenseNumber),
      trainingStartYear: nullableNumber(body.trainingStartYear),
      specialty: nullableString(body.specialty),
      category: nullableString(body.category),
      officialCategory: nullableString(body.officialCategory),
      level: nullableString(body.level),
      height: nullableNumber(body.height),
      weight: nullableNumber(body.weight),
      gender,
      disciplines: selectedDisciplines,
      primaryDiscipline,
      nationality: nullableString(body.nationality),
      dominantSide,
      sportStatus,
      active: body.active === true,
      clubId,
      coachId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.uid,
    });

    if (current.role === "coach" && current.clubId !== clubId) {
      const assigned = await db.collection("users").where("coachId", "==", userId).get();
      for (const athlete of assigned.docs) {
        if (!clubId || athlete.data().clubId !== clubId) {
          batch.update(athlete.ref, {
            coachId: null,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }
    await batch.commit();
    return Response.json({ success: true });
  } catch (reason) {
    return responseError(reason);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const actor = await requireApiUser(request);
    if (actor.role !== "superadmin") throw new Error("FORBIDDEN");
    const { userId } = await context.params;
    if (actor.uid === userId) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
    const { auth, db } = getAdminServices();
    const reference = db.doc(`users/${userId}`);
    const snapshot = await reference.get();
    if (!snapshot.exists) throw new Error("NOT_FOUND");

    const batch = db.batch();
    const assigned = await db.collection("users").where("coachId", "==", userId).get();
    assigned.docs.forEach((row) =>
      batch.update(row.ref, {
        coachId: null,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    const qrProfiles = await db.collection("qrProfiles").where("athleteId", "==", userId).get();
    qrProfiles.docs.forEach((row) => batch.delete(row.ref));
    await batch.commit();
    await db.recursiveDelete(reference);
    try {
      await auth.deleteUser(userId);
    } catch (reason) {
      if (
        !(reason instanceof Error) ||
        !("code" in reason) ||
        reason.code !== "auth/user-not-found"
      ) {
        throw reason;
      }
    }
    return Response.json({ success: true });
  } catch (reason) {
    return responseError(reason);
  }
}
