const DATABASE_NAME = "rowmotion-local-videos";
const STORE_NAME = "videos";
const DATABASE_VERSION = 1;

interface LocalVideoRecord {
  analysisId: string;
  file: Blob;
  fileName: string;
  contentType: string;
  savedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("Le stockage local des vidéos n’est pas pris en charge par ce navigateur."));
  }
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "analysisId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Impossible d’ouvrir le stockage vidéo local."));
  });
}

export async function saveLocalAnalysisVideo(analysisId: string, file: File, onProgress?: (value: number) => void) {
  const database = await openDatabase();
  onProgress?.(20);
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ analysisId, file, fileName: file.name, contentType: file.type, savedAt: Date.now() } satisfies LocalVideoRecord);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Impossible d’enregistrer la vidéo dans ce navigateur."));
  });
  database.close();
  onProgress?.(100);
  return `local:${analysisId}`;
}

export async function getLocalAnalysisVideo(analysisId: string): Promise<{ url: string; fileName: string } | null> {
  const database = await openDatabase();
  const record = await new Promise<LocalVideoRecord | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(analysisId);
    request.onsuccess = () => resolve(request.result as LocalVideoRecord | undefined);
    request.onerror = () => reject(new Error("Impossible de lire la vidéo locale."));
  });
  database.close();
  return record ? { url: URL.createObjectURL(record.file), fileName: record.fileName } : null;
}

export async function deleteLocalAnalysisVideo(analysisId: string) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(analysisId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Impossible de supprimer la vidéo locale."));
  });
  database.close();
}
