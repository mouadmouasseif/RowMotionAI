import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const CONFIRMATION = "delete-dynamic-data";
const dynamicCollections = [
  "analyses",
  "analysisJobs",
  "athleteQrScans",
  "coachInvitations",
  "competitionEntries",
  "competitions",
  "juryAssignments",
  "messages",
  "notifications",
  "physicalTests",
  "records",
  "results",
  "technicalEvaluations",
  "trainingPlans",
  "trainingSessions",
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function loadAdminApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: requiredEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

async function deleteQueryBatch(db, query, dryRun) {
  const snapshot = await query.limit(400).get();
  if (snapshot.empty) return 0;
  if (!dryRun) {
    const batch = db.batch();
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
  return snapshot.size;
}

async function emptyCollection(db, collectionPath, dryRun) {
  let total = 0;
  while (true) {
    const deleted = await deleteQueryBatch(db, db.collection(collectionPath), dryRun);
    total += deleted;
    if (deleted < 400 || dryRun) return total;
  }
}

async function emptyPersonalBests(db, dryRun) {
  const users = await db.collection("users").get();
  let total = 0;
  for (const user of users.docs) {
    total += await emptyCollection(db, `users/${user.id}/personalBests`, dryRun);
  }
  return total;
}

async function main() {
  const dryRun = process.env.ROWMOTION_RESET_CONFIRM !== CONFIRMATION;
  const db = getFirestore(loadAdminApp());
  const result = {};

  for (const collectionPath of dynamicCollections) {
    result[collectionPath] = await emptyCollection(db, collectionPath, dryRun);
  }
  result["users/*/personalBests"] = await emptyPersonalBests(db, dryRun);

  console.table(result);
  if (dryRun) {
    console.log(`Dry-run only. Re-run with ROWMOTION_RESET_CONFIRM=${CONFIRMATION} to delete these documents.`);
  } else {
    console.log("Dynamic Firebase data reset complete.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
