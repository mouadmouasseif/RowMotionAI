import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore/lite";
import { auth, db, storage } from "@/lib/firebase";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const isCloudMediaEnabled = process.env.NEXT_PUBLIC_MEDIA_STORAGE_MODE === "firebase";

function validateImage(file: File) { if (!IMAGE_TYPES.includes(file.type)) throw new Error("Format d’image non pris en charge."); if (file.size > MAX_IMAGE_SIZE) throw new Error("La photo dépasse 5 Mo."); }
function requireMediaServices() { if (!isCloudMediaEnabled || !auth?.currentUser || !db || !storage) throw new Error("L’import d’images nécessite Firebase Storage. Le mode gratuit actuel utilise les initiales."); return { user: auth.currentUser, database: db, bucket: storage }; }

export async function uploadProfilePhoto(userId: string, file: File) { validateImage(file); const { user, database, bucket } = requireMediaServices(); if (user.uid !== userId) throw new Error("Vous n’êtes pas autorisé à modifier cette photo."); const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"; const object = ref(bucket, `profile-photos/${userId}/avatar.${extension}`); await uploadBytes(object, file, { contentType: file.type }); const url = await getDownloadURL(object); await updateDoc(doc(database, "users", userId), { profilePhotoUrl: url, updatedAt: serverTimestamp() }); return url; }
export async function deleteProfilePhoto(userId: string, storagePath: string) { const { user, database, bucket } = requireMediaServices(); if (user.uid !== userId) throw new Error("Vous n’êtes pas autorisé à supprimer cette photo."); await deleteObject(ref(bucket, storagePath)); await updateDoc(doc(database, "users", userId), { profilePhotoUrl: null, updatedAt: serverTimestamp() }); }
export async function uploadClubLogo(clubId: string, file: File) { validateImage(file); const { database, bucket } = requireMediaServices(); const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"; const object = ref(bucket, `clubs/${clubId}/logo.${extension}`); await uploadBytes(object, file, { contentType: file.type }); const url = await getDownloadURL(object); await updateDoc(doc(database, "clubs", clubId), { logoUrl: url, updatedAt: serverTimestamp() }); return url; }
