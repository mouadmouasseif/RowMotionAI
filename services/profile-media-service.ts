import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const isCloudMediaEnabled = process.env.NEXT_PUBLIC_MEDIA_STORAGE_MODE === "firebase";

export function validateProfileImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Format non pris en charge. Utilisez JPG, PNG ou WebP.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("L’image dépasse 5 Mo.");
}

function requireMediaServices() {
  if (!auth?.currentUser || !db || !storage) throw new Error("L’import d’image nécessite Firebase Storage.");
  return { user: auth.currentUser, database: db, bucket: storage };
}

async function canManageProfilePhoto(database: NonNullable<typeof db>, actorId: string, targetId: string) {
  if (actorId === targetId) return true;
  const [actor, target] = await Promise.all([
    getDoc(doc(database, "users", actorId)),
    getDoc(doc(database, "users", targetId)),
  ]);
  if (!actor.exists() || !target.exists() || actor.data().active !== true) return false;
  if (actor.data().role === "superadmin") return true;
  if (actor.data().role === "club_admin") {
    return Boolean(actor.data().clubId && actor.data().clubId === target.data().clubId);
  }
  return actor.data().role === "coach" &&
    target.data().role === "athlete" &&
    target.data().coachId === actorId;
}

async function syncQrPhoto(database: NonNullable<typeof db>, userId: string, profilePhotoUrl: string | null) {
  const profile = await getDoc(doc(database, "users", userId));
  const qrCodeId = profile.exists() && typeof profile.data().qrCodeId === "string" ? profile.data().qrCodeId : null;
  if (qrCodeId) await setDoc(doc(database, "qrProfiles", qrCodeId), { profilePhotoUrl, updatedAt: serverTimestamp() }, { merge: true });
}

export async function uploadProfilePhoto(userId: string, file: File) {
  validateProfileImage(file);
  const { user, database, bucket } = requireMediaServices();
  if (!await canManageProfilePhoto(database, user.uid, userId)) throw new Error("Vous n’êtes pas autorisé à modifier cette photo.");
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const object = ref(bucket, `profile-photos/${userId}/avatar.${extension}`);
  await uploadBytes(object, file, { contentType: file.type });
  const url = await getDownloadURL(object);
  await updateDoc(doc(database, "users", userId), { profilePhotoUrl: url, updatedAt: serverTimestamp() });
  await syncQrPhoto(database, userId, url);
  return url;
}

export async function deleteProfilePhoto(userId: string, storagePath: string) {
  const { user, database, bucket } = requireMediaServices();
  if (!await canManageProfilePhoto(database, user.uid, userId)) throw new Error("Vous n’êtes pas autorisé à supprimer cette photo.");
  await deleteObject(ref(bucket, storagePath));
  await updateDoc(doc(database, "users", userId), { profilePhotoUrl: null, updatedAt: serverTimestamp() });
  await syncQrPhoto(database, userId, null);
}

export async function deleteProfilePhotoFromUrl(userId: string, url: string) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/\/o\/(.+)$/);
  if (!match) throw new Error("Chemin de photo invalide.");
  return deleteProfilePhoto(userId, decodeURIComponent(match[1]));
}

async function uploadEntityImage(path: string, file: File) {
  validateProfileImage(file);
  const { bucket } = requireMediaServices();
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const object = ref(bucket, `${path}.${extension}`);
  await uploadBytes(object, file, { contentType: file.type });
  return getDownloadURL(object);
}

export async function uploadClubLogo(clubId: string, file: File) {
  const { database } = requireMediaServices();
  const url = await uploadEntityImage(`clubs/${clubId}/logo`, file);
  await updateDoc(doc(database, "clubs", clubId), { logoUrl: url, updatedAt: serverTimestamp() });
  return url;
}

export async function uploadCompetitionLogo(competitionId: string, file: File) {
  const { database } = requireMediaServices();
  const url = await uploadEntityImage(`competitions/${competitionId}/logo`, file);
  await updateDoc(doc(database, "competitions", competitionId), { logoUrl: url, updatedAt: serverTimestamp() });
  return url;
}
