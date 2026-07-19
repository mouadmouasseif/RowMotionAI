import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";

const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_VIDEO_SIZE = 250 * 1024 * 1024;

export function validateAnalysisVideo(file: File) {
  if (!allowedTypes.includes(file.type)) throw new Error("Format vidéo non pris en charge. Utilisez MP4, MOV ou WebM.");
  if (file.size > MAX_VIDEO_SIZE) throw new Error("Fichier trop volumineux. La limite est de 250 Mo.");
}

export async function uploadAnalysisVideo(analysisId: string, file: File, onProgress: (value: number) => void) {
  if (!auth?.currentUser || !storage) throw new Error("Firebase Storage n’est pas disponible.");
  validateAnalysisVideo(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `analyses/${auth.currentUser.uid}/${analysisId}/${safeName}`;
  const objectRef = ref(storage, path);
  const task = uploadBytesResumable(objectRef, file, { contentType: file.type });
  await new Promise<void>((resolve, reject) => task.on("state_changed", (snapshot) => onProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)), reject, resolve));
  return { url: await getDownloadURL(task.snapshot.ref), path };
}

export async function deleteAnalysisVideo(path: string) {
  if (!storage) throw new Error("Firebase Storage n’est pas disponible.");
  await deleteObject(ref(storage, path));
}

export async function getAnalysisVideoUrl(path: string) {
  if (!storage) throw new Error("Firebase Storage n’est pas disponible.");
  return getDownloadURL(ref(storage, path));
}
