import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
const allowedTypes = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]);
export const MAX_VIDEO_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE_MB ?? 500);
export const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024;
export const isCloudVideoStorageEnabled = process.env.NEXT_PUBLIC_VIDEO_STORAGE_MODE === "firebase";
export interface VideoMetadata { duration:number; width:number; height:number; fps:null; orientation:"landscape"|"portrait"|"square" }
export function validateAnalysisVideo(file: File) {
  if (!allowedTypes.has(file.type)) throw new Error("Format non pris en charge. Utilisez MP4, MOV, WebM ou AVI.");
  if (!file.size) throw new Error("La vidéo est vide ou illisible.");
  if (file.size > MAX_VIDEO_SIZE) throw new Error(`Vidéo trop lourde. La limite est de ${MAX_VIDEO_SIZE_MB} Mo.`);
}
export async function inspectAnalysisVideo(file: File): Promise<VideoMetadata> {
  validateAnalysisVideo(file); const url=URL.createObjectURL(file);
  try { return await new Promise((resolve,reject)=>{ const video=document.createElement("video"); const timeout=window.setTimeout(()=>reject(new Error("Vidéo illisible ou corrompue.")),10000); video.preload="metadata"; video.onloadedmetadata=()=>{ window.clearTimeout(timeout); if(!Number.isFinite(video.duration)||video.duration<1||!video.videoWidth||!video.videoHeight){reject(new Error("Vidéo trop courte ou sans piste vidéo."));return;} resolve({duration:video.duration,width:video.videoWidth,height:video.videoHeight,fps:null,orientation:video.videoWidth===video.videoHeight?"square":video.videoWidth>video.videoHeight?"landscape":"portrait"});}; video.onerror=()=>{window.clearTimeout(timeout);reject(new Error("Vidéo illisible ou corrompue."));}; video.src=url; }); } finally { URL.revokeObjectURL(url); }
}
export async function uploadAnalysisVideo(analysisId:string,file:File,onProgress:(value:number)=>void){ if(!auth?.currentUser||!storage)throw new Error("Firebase Storage n’est pas disponible."); validateAnalysisVideo(file); const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-"); const path=`analyses/${auth.currentUser.uid}/${analysisId}/${safeName}`; const task=uploadBytesResumable(ref(storage,path),file,{contentType:file.type,customMetadata:{analysisId}}); await new Promise<void>((resolve,reject)=>task.on("state_changed",s=>onProgress(Math.round(s.bytesTransferred/s.totalBytes*100)),reject,resolve)); return {url:await getDownloadURL(task.snapshot.ref),path}; }
export async function deleteAnalysisVideo(path:string){if(!storage)throw new Error("Firebase Storage n’est pas disponible.");await deleteObject(ref(storage,path));}
export async function getAnalysisVideoUrl(path:string){if(!storage)throw new Error("Firebase Storage n’est pas disponible.");return getDownloadURL(ref(storage,path));}
