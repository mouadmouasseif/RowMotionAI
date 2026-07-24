"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import {
  deleteProfilePhotoFromUrl,
  StorageUploadError,
  uploadProfilePhoto,
  validateProfileImage,
} from "@/services/profile-media-service";

interface ProfilePhotoUploaderProps {
  uid: string;
  firstName: string;
  lastName: string;
  initialUrl: string | null;
  onChange?: (url: string | null) => void;
}

export function ProfilePhotoUploader({
  uid,
  firstName,
  lastName,
  initialUrl,
  onChange,
}: ProfilePhotoUploaderProps) {
  const [url, setUrl] = useState(initialUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const uploadLockRef = useRef(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (file: File | null) => {
    setError("");
    setMessage("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    try {
      validateProfileImage(file);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (reason) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(reason instanceof Error ? reason.message : "Image invalide.");
    }
  };

  const upload = async () => {
    if (!selectedFile || busy || uploadLockRef.current) return;
    try {
      uploadLockRef.current = true;
      setBusy(true);
      setError("");
      setMessage("Envoi de la photo en cours…");
      const next = await uploadProfilePhoto(uid, selectedFile);
      setUrl(next);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setMessage("Photo de profil mise à jour.");
      onChange?.(next);
    } catch (reason) {
      setMessage("");
      setError(reason instanceof StorageUploadError
        ? reason.message
        : "Impossible de mettre à jour la photo de profil.");
    } finally {
      uploadLockRef.current = false;
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!url || busy || uploadLockRef.current) return;
    try {
      uploadLockRef.current = true;
      setBusy(true);
      setError("");
      await deleteProfilePhotoFromUrl(uid, url);
      setUrl(null);
      setMessage("Photo supprimée.");
      onChange?.(null);
    } catch (reason) {
      setError(reason instanceof StorageUploadError ? reason.message : "Suppression impossible.");
    } finally {
      uploadLockRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="profile-photo-editor">
      <ProfileAvatar photoUrl={previewUrl ?? url} firstName={firstName} lastName={lastName} large />
      <div>
        <label className="button ghost">
          <ImagePlus />Choisir une photo
          <input
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              selectFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </label>
        <button className="button primary" type="button" disabled={!selectedFile || busy} onClick={() => void upload()}>
          <Save />{busy ? "Envoi en cours…" : "Enregistrer la photo"}
        </button>
        {url && <button className="danger-button" type="button" disabled={busy} onClick={() => void remove()}><Trash2 />Supprimer</button>}
        {message && <span className="field-success" aria-live="polite">{message}</span>}
        {error && <span className="field-error" role="alert">{error}</span>}
      </div>
    </div>
  );
}
