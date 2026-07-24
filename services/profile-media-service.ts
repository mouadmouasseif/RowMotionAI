import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  deleteStorageFile,
  StorageUploadError,
  uploadClubImage,
  uploadCompetitionImage,
  uploadProfileImage,
  validateImage,
} from "@/services/image-storage-service";

export { StorageUploadError };
export const validateProfileImage = validateImage;

function requireDatabase() {
  if (!auth?.currentUser || !db) throw new StorageUploadError("L’utilisateur doit être connecté.");
  return { user: auth.currentUser, database: db };
}

async function canManageProfilePhoto(actorId: string, targetId: string) {
  if (actorId === targetId) return true;
  const { database } = requireDatabase();
  const [actor, target] = await Promise.all([
    getDoc(doc(database, "users", actorId)),
    getDoc(doc(database, "users", targetId)),
  ]);
  if (!actor.exists() || !target.exists() || actor.data().active !== true) return false;
  if (actor.data().role === "superadmin") return true;
  if (actor.data().role === "club_admin") {
    return Boolean(actor.data().clubId && actor.data().clubId === target.data().clubId);
  }
  return actor.data().role === "coach"
    && target.data().role === "athlete"
    && target.data().coachId === actorId;
}

async function syncQrPhoto(userId: string, profilePhotoUrl: string | null) {
  const { database } = requireDatabase();
  const profile = await getDoc(doc(database, "users", userId));
  const qrCodeId = profile.exists() && typeof profile.data().qrCodeId === "string"
    ? profile.data().qrCodeId
    : null;
  if (qrCodeId) {
    await setDoc(doc(database, "qrProfiles", qrCodeId), {
      profilePhotoUrl,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
}

export async function uploadProfilePhoto(userId: string, file: File) {
  const { user, database } = requireDatabase();
  if (!await canManageProfilePhoto(user.uid, userId)) {
    throw new StorageUploadError("Vous n’avez pas l’autorisation de modifier cette image.", "storage/unauthorized");
  }
  const url = await uploadProfileImage(userId, file);
  await updateDoc(doc(database, "users", userId), {
    profilePhotoUrl: url,
    updatedAt: serverTimestamp(),
  });
  await syncQrPhoto(userId, url);
  return url;
}

export async function deleteProfilePhotoFromUrl(userId: string, url: string) {
  const { user, database } = requireDatabase();
  if (!await canManageProfilePhoto(user.uid, userId)) {
    throw new StorageUploadError("Vous n’avez pas l’autorisation de modifier cette image.", "storage/unauthorized");
  }
  await deleteStorageFile(url);
  await updateDoc(doc(database, "users", userId), {
    profilePhotoUrl: null,
    updatedAt: serverTimestamp(),
  });
  await syncQrPhoto(userId, null);
}

export async function uploadClubLogo(clubId: string, file: File) {
  const { user, database } = requireDatabase();
  const url = await uploadClubImage(clubId, file, user.uid);
  await updateDoc(doc(database, "clubs", clubId), { logoUrl: url, updatedAt: serverTimestamp() });
  return url;
}

export async function uploadCompetitionLogo(competitionId: string, file: File) {
  const { user, database } = requireDatabase();
  const url = await uploadCompetitionImage(competitionId, file, user.uid);
  await updateDoc(doc(database, "competitions", competitionId), {
    logoUrl: url,
    updatedAt: serverTimestamp(),
  });
  return url;
}
