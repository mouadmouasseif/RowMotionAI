/*
 * Audit/migration volontaire des anciens profils.
 * Nécessite firebase-admin et GOOGLE_APPLICATION_CREDENTIALS côté machine admin.
 * Exécuter d'abord avec DRY_RUN=true. Aucun identifiant Firebase public n'est utilisé.
 */
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error("GOOGLE_APPLICATION_CREDENTIALS est requis.");
const dryRun = process.env.DRY_RUN !== "false";
const app = getApps().length ? getApps()[0] : initializeApp({ credential: applicationDefault() });
const database = getFirestore(app);
const snapshot = await database.collection("users").get();
let changed = 0;
for (const document of snapshot.docs) {
  const data = document.data();
  const patch = {};
  for (const field of ["profilePhotoUrl", "birthDate", "clubId", "coachId", "specialty", "category", "level", "height", "weight"]) {
    if (!(field in data)) patch[field] = null;
  }
  if (!("active" in data)) patch.active = false;
  if (Object.keys(patch).length) { changed += 1; if (!dryRun) await document.ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() }); }
}
console.log(`${changed} profil(s) ${dryRun ? "à normaliser" : "normalisé(s)"}.`);
