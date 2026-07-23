import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

const dryRun = process.argv.includes("--dry-run");
if (!getApps().length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  initializeApp({ credential: projectId && clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault() });
}
const db = getFirestore();
const rows = await db.collection("users").where("role", "in", ["athlete", "coach"]).get();
let changed = 0;

function categoryFor(value: unknown) {
  const date = typeof value === "string" ? new Date(value) : value && typeof value === "object" && "toDate" in value ? (value as { toDate(): Date }).toDate() : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const age = new Date().getUTCFullYear() - date.getUTCFullYear();
  if (age < 15) return "U15"; if (age < 19) return "U19"; if (age < 21) return "U21"; if (age < 23) return "U23"; return "SENIOR";
}

for (const row of rows.docs) {
  const data = row.data();
  const athlete = data.role === "athlete";
  const calculatedCategory = athlete ? categoryFor(data.birthDate ?? data.dateOfBirth) : null;
  const disciplines = Array.isArray(data.disciplines) && data.disciplines.length ? data.disciplines : athlete ? data.discipline ? [data.discipline] : ["ERGOMETER"] : [];
  const qrCodeId = typeof data.qrCodeId === "string" ? data.qrCodeId : randomUUID();
  const privacySettings = data.privacySettings ?? { qrEnabled: true, qrVisibility: "authenticated", showAge: false, showGender: false, showLicenseNumber: false, showBestPerformances: true };
  const patch = {
    displayName: data.displayName ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
    disciplines, primaryDiscipline: data.primaryDiscipline ?? disciplines[0] ?? null,
    profilePhotoUrl: data.profilePhotoUrl ?? null, calculatedCategory: data.calculatedCategory ?? calculatedCategory,
    officialCategory: data.officialCategory ?? data.category ?? calculatedCategory, category: data.category ?? calculatedCategory,
    gender: data.gender ?? "not_specified", nationality: data.nationality ?? null, dominantSide: data.dominantSide ?? null,
    qrCodeId, privacySettings, sportStatus: data.sportStatus ?? "active", updatedAt: FieldValue.serverTimestamp(),
  };
  changed += 1;
  if (!dryRun) {
    await row.ref.set(patch, { merge: true });
    await db.collection("qrProfiles").doc(qrCodeId).set({ athleteId: row.id, role: data.role, firstName: data.firstName ?? "", lastName: data.lastName ?? "", profilePhotoUrl: patch.profilePhotoUrl, birthDate: data.birthDate ?? null, gender: patch.gender, category: patch.officialCategory, disciplines, clubId: data.clubId ?? null, coachId: data.coachId ?? null, licenseNumber: data.licenseNumber ?? null, sportStatus: patch.sportStatus, privacySettings, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
}

console.log(JSON.stringify({ dryRun, collection: "users", scanned: rows.size, changed }, null, 2));
