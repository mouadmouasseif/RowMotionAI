import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class StorageUploadError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "StorageUploadError";
  }
}

export function validateImage(file: File): void {
  if (!file) throw new StorageUploadError("Aucun fichier n’a été sélectionné.");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new StorageUploadError("Utilisez une image JPG, PNG ou WebP.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new StorageUploadError("L’image ne doit pas dépasser 5 Mo.");
  }
}

function extensionFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function normalizeFirebaseStorageError(error: unknown): StorageUploadError {
  if (error instanceof StorageUploadError) return error;
  const firebaseError = error as { code?: string; message?: string } | null;
  const code = firebaseError?.code;
  if (process.env.NODE_ENV === "development") {
    console.error("[RowMotion] Firebase Storage upload failed:", error);
  }
  switch (code) {
    case "storage/unauthorized":
      return new StorageUploadError("Vous n’avez pas l’autorisation de modifier cette image.", code);
    case "storage/canceled":
      return new StorageUploadError("L’envoi de l’image a été annulé.", code);
    case "storage/retry-limit-exceeded":
      return new StorageUploadError("Le délai d’envoi a été dépassé. Vérifiez votre connexion.", code);
    case "storage/quota-exceeded":
      return new StorageUploadError("Le quota Firebase Storage a été dépassé.", code);
    case "storage/bucket-not-found":
      return new StorageUploadError("Le bucket Firebase Storage est introuvable.", code);
    case "storage/project-not-found":
      return new StorageUploadError("Le projet Firebase est introuvable.", code);
    default:
      return new StorageUploadError("Impossible d’envoyer l’image. Vérifiez votre connexion et réessayez.", code);
  }
}

async function uploadImage(path: string, file: File, metadata: Record<string, string>) {
  if (!storage) throw new StorageUploadError("Firebase Storage n’est pas configuré.", "storage/not-configured");
  validateImage(file);
  try {
    const imageRef = ref(storage, `${path}.${extensionFor(file)}`);
    const snapshot = await uploadBytes(imageRef, file, {
      contentType: file.type,
      customMetadata: metadata,
    });
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    throw normalizeFirebaseStorageError(error);
  }
}

export function uploadProfileImage(userId: string, file: File) {
  if (!userId) throw new StorageUploadError("L’utilisateur doit être connecté.");
  return uploadImage(`profile-photos/${userId}/avatar`, file, {
    ownerId: userId,
    category: "profile-photo",
  });
}

export function uploadCompetitionImage(competitionId: string, file: File, ownerId: string) {
  if (!competitionId) throw new StorageUploadError("L’identifiant de la compétition est manquant.");
  if (!ownerId) throw new StorageUploadError("L’utilisateur doit être connecté.");
  return uploadImage(`competitions/${competitionId}/logo`, file, {
    ownerId,
    competitionId,
    category: "competition-logo",
  });
}

export function uploadClubImage(clubId: string, file: File, ownerId: string) {
  if (!clubId) throw new StorageUploadError("L’identifiant du club est manquant.");
  if (!ownerId) throw new StorageUploadError("L’utilisateur doit être connecté.");
  return uploadImage(`clubs/${clubId}/logo`, file, {
    ownerId,
    clubId,
    category: "club-logo",
  });
}

export async function deleteStorageFile(fileUrlOrPath: string): Promise<void> {
  if (!fileUrlOrPath || !storage) return;
  try {
    await deleteObject(ref(storage, fileUrlOrPath));
  } catch (error) {
    throw normalizeFirebaseStorageError(error);
  }
}
