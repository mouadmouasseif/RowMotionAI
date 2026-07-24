"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { StorageUploadError, uploadClubLogo, validateProfileImage } from "@/services/profile-media-service";

export function ClubLogoUploader({
  clubId,
  initialUrl,
  onChange,
}: {
  clubId: string;
  initialUrl: string | null;
  onChange?: (url: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lockRef = useRef(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const select = (next: File | null) => {
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    if (!next) {
      setFile(null);
      setPreview(null);
      return;
    }
    try {
      validateProfileImage(next);
      setFile(next);
      setPreview(URL.createObjectURL(next));
    } catch (reason) {
      setFile(null);
      setPreview(null);
      setError(reason instanceof Error ? reason.message : "Logo invalide.");
    }
  };

  const upload = async () => {
    if (!file || busy || lockRef.current) return;
    try {
      lockRef.current = true;
      setBusy(true);
      const url = await uploadClubLogo(clubId, file);
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      onChange?.(url);
    } catch (reason) {
      setError(reason instanceof StorageUploadError ? reason.message : "Impossible d’envoyer le logo.");
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="entity-logo-uploader">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {(preview || initialUrl) && <img src={preview ?? initialUrl ?? ""} alt="Aperçu du logo" />}
      <label className="button ghost"><ImagePlus />Choisir le logo
        <input hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => {
          select(event.target.files?.[0] ?? null);
          event.target.value = "";
        }} />
      </label>
      <button className="button primary" type="button" disabled={!file || busy} onClick={() => void upload()}>
        <Save />{busy ? "Envoi…" : "Enregistrer le logo"}
      </button>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
