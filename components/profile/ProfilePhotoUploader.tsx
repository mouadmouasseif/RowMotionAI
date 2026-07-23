"use client";

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { deleteProfilePhotoFromUrl, uploadProfilePhoto, validateProfileImage } from "@/services/profile-media-service";

export function ProfilePhotoUploader({ uid, firstName, lastName, initialUrl, onChange }: { uid: string; firstName: string; lastName: string; initialUrl: string | null; onChange?: (url: string | null) => void }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const upload = async (file: File) => {
    try { setBusy(true); setError(""); validateProfileImage(file); const next = await uploadProfilePhoto(uid, file); setUrl(next); onChange?.(next); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Import impossible."); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!url) return;
    try { setBusy(true); setError(""); await deleteProfilePhotoFromUrl(uid, url); setUrl(null); onChange?.(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Suppression impossible."); }
    finally { setBusy(false); }
  };
  return <div className="profile-photo-editor"><ProfileAvatar photoUrl={url} firstName={firstName} lastName={lastName} large /><div><label className="button ghost"><ImagePlus />{busy ? "Traitement…" : "Changer la photo"}<input hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>{url && <button className="danger-button" disabled={busy} onClick={() => void remove()}><Trash2 />Supprimer</button>}{error && <span className="field-error">{error}</span>}</div></div>;
}
