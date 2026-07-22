import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export function resolveStorageBucket(projectId?: string, configuredBucket?: string) {
  if (!projectId) return configuredBucket;
  const bucket = configuredBucket?.trim();
  if (!bucket || (!bucket.startsWith(`${projectId}.`) && bucket !== `${projectId}.appspot.com`)) {
    return `${projectId}.firebasestorage.app`;
  }
  return bucket;
}

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseProjectId,
  storageBucket: resolveStorageBucket(firebaseProjectId, process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = {
  NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
};

const missingVariables = Object.entries(requiredConfig).filter(([, value]) => !value).map(([key]) => key);

export const isFirebaseConfigured = missingVariables.length === 0;
export const firebaseConfigurationError = missingVariables.length > 0
  ? `Variables Firebase manquantes : ${missingVariables.join(", ")}`
  : null;
export const firebaseApp = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firebaseDb = firebaseApp ? getFirestore(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;
export const auth = firebaseAuth;
export const db = firebaseDb;
export const storage = firebaseStorage;

export async function getFirebaseAnalytics() {
  if (!firebaseApp || typeof window === "undefined") return null;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? getAnalytics(firebaseApp) : null;
}
