import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
function loadApp(): App {
  if (getApps().length) return getApps()[0];
  const projectId=process.env.FIREBASE_ADMIN_PROJECT_ID; const clientEmail=process.env.FIREBASE_ADMIN_CLIENT_EMAIL; const privateKey=process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g,"\n");
  if(!projectId||!clientEmail||!privateKey) throw new Error("Configuration Firebase Admin incomplète.");
  return initializeApp({credential:cert({projectId,clientEmail,privateKey}),storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET});
}
export function getAdminServices(){const app=loadApp();return {auth:getAuth(app),db:getFirestore(app),storage:getStorage(app)};}
