import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";

const allowedTypes = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/mov", "video/x-m4v"]);
const allowedExtensions = [".mp4", ".mov", ".m4v", ".webm", ".avi"];

export const MAX_VIDEO_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE_MB ?? 500);
export const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;
export const isCloudVideoStorageEnabled = process.env.NEXT_PUBLIC_VIDEO_STORAGE_MODE === "firebase";

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: null;
  orientation: "landscape" | "portrait" | "square";
}

export function validateAnalysisVideo(file: File) {
  const extension = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  const mobileCompatibleType = file.type.startsWith("video/");
  if (file.type && !allowedTypes.has(file.type) && !mobileCompatibleType) {
    throw new Error("Format non pris en charge. Utilisez MP4, MOV, M4V, WebM ou AVI.");
  }
  if (!file.type && !allowedExtensions.includes(extension)) {
    throw new Error("Format non pris en charge. Utilisez MP4, MOV, M4V, WebM ou AVI.");
  }
  if (!file.size) throw new Error("La video est vide ou illisible.");
  if (file.size > MAX_VIDEO_SIZE) throw new Error(`Video trop lourde. La limite est de ${MAX_VIDEO_SIZE_MB} Mo.`);
}

export async function inspectAnalysisVideo(file: File): Promise<VideoMetadata> {
  validateAnalysisVideo(file);
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const video = document.createElement("video");
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error("Video illisible sur ce navigateur. Sur telephone, essayez MP4/H.264 ou MOV depuis la galerie."));
        }
      }, 20000);

      const finish = () => {
        if (settled) return;
        if (!Number.isFinite(video.duration) || video.duration < 1) {
          settled = true;
          window.clearTimeout(timeout);
          reject(new Error("Video trop courte ou sans piste video."));
          return;
        }
        settled = true;
        window.clearTimeout(timeout);
        const width = video.videoWidth || 1;
        const height = video.videoHeight || 1;
        resolve({
          duration: video.duration,
          width,
          height,
          fps: null,
          orientation: width === height ? "square" : width > height ? "landscape" : "portrait",
        });
      };

      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.onloadedmetadata = finish;
      video.onloadeddata = finish;
      video.onerror = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        reject(new Error("Video illisible ou format non pris en charge par ce telephone."));
      };
      video.src = url;
      video.load();
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadAnalysisVideo(analysisId: string, file: File, onProgress: (value: number) => void) {
  if (!auth?.currentUser || !storage) throw new Error("Firebase Storage n'est pas disponible.");
  validateAnalysisVideo(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `analyses/${auth.currentUser.uid}/${analysisId}/${safeName}`;
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type || "video/mp4", customMetadata: { analysisId } });
  await new Promise<void>((resolve, reject) => task.on(
    "state_changed",
    (snapshot) => onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
    reject,
    resolve,
  ));
  return { url: await getDownloadURL(task.snapshot.ref), path };
}

export async function deleteAnalysisVideo(path: string) {
  if (!storage) throw new Error("Firebase Storage n'est pas disponible.");
  await deleteObject(ref(storage, path));
}

export async function getAnalysisVideoUrl(path: string) {
  if (!storage) throw new Error("Firebase Storage n'est pas disponible.");
  return getDownloadURL(ref(storage, path));
}
