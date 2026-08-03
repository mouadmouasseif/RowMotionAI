import { FieldValue } from "firebase-admin/firestore";
import { requireApiUser } from "@/lib/api-auth";
import { getAdminServices } from "@/lib/firebase/admin";

function responseError(reason: unknown) {
  const code = reason instanceof Error ? reason.message : "INTERNAL_ERROR";
  const status =
    code === "AUTH_REQUIRED" ? 401 : code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : 400;
  const messages: Record<string, string> = {
    AUTH_REQUIRED: "Authentification requise.",
    ACCOUNT_INACTIVE: "Compte administrateur inactif.",
    FORBIDDEN: "Action réservée au Super administrateur.",
    NOT_FOUND: "Club introuvable.",
  };
  return Response.json(
    { success: false, error: { code, message: messages[code] ?? code } },
    { status },
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ clubId: string }> },
) {
  try {
    const actor = await requireApiUser(request);
    if (actor.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
    const { clubId } = await context.params;
    const { db } = getAdminServices();
    const reference = db.doc(`clubs/${clubId}`);
    if (!(await reference.get()).exists) throw new Error("NOT_FOUND");

    const [members, competitions] = await Promise.all([
      db.collection("users").where("clubId", "==", clubId).get(),
      db.collection("competitions").where("clubId", "==", clubId).get(),
    ]);
    const batch = db.batch();
    members.docs.forEach((row) =>
      batch.update(row.ref, {
        clubId: null,
        coachId: row.data().role === "ATHLETE" ? null : row.data().coachId ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    competitions.docs.forEach((row) =>
      batch.update(row.ref, {
        clubId: null,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    await batch.commit();
    await db.recursiveDelete(reference);
    return Response.json({ success: true });
  } catch (reason) {
    return responseError(reason);
  }
}
