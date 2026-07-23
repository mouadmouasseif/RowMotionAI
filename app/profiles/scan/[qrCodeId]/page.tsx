"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/Brand";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { calculateAge } from "@/lib/user-profile";
import { getProfileByQrCode, logQrScan, type QrProfile } from "@/services/user-service";

const disciplineNames = { ERGOMETER: "Ergomètre", SKIFF: "Skiff", BEACH_ROWING: "Beach Rowing" } as const;

export default function ScanProfilePage({ params }: { params: Promise<{ qrCodeId: string }> }) {
  const { qrCodeId } = use(params);
  const [profile, setProfile] = useState<QrProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void getProfileByQrCode(qrCodeId).then((value) => { if (!value) setError("Ce QR est invalide ou a été révoqué."); else { setProfile(value); void logQrScan(qrCodeId, value.athleteId); } }).catch(() => setError("Ce profil est privé ou votre accès n’est pas autorisé.")).finally(() => setLoading(false)); }, [qrCodeId]);
  return <main className="public-main qr-profile-page"><header className="public-header"><Brand /><Link href="/"><ArrowLeft />Accueil</Link></header>{loading ? <section className="loading-card">Vérification du QR…</section> : error || !profile ? <section className="empty-state"><ShieldCheck /><h1>Profil non disponible</h1><p>{error}</p></section> : <section className="content-card qr-public-profile"><ProfileAvatar photoUrl={profile.profilePhotoUrl} firstName={profile.firstName} lastName={profile.lastName} large /><div><span className="status-pill completed"><Activity />{profile.sportStatus}</span><h1>{profile.firstName} {profile.lastName}</h1><p>{profile.role === "coach" ? "Entraîneur" : "Athlète"} · {profile.category ?? "Catégorie non renseignée"}</p>{profile.privacySettings.showAge && <p>Âge : {calculateAge(profile.birthDate) ?? "—"} ans</p>}{profile.privacySettings.showGender && <p>Genre : {profile.gender}</p>}{profile.privacySettings.showLicenseNumber && <p>Licence : {profile.licenseNumber ?? "—"}</p>}<div className="profile-disciplines">{profile.disciplines.map((discipline) => <span key={discipline}>{disciplineNames[discipline]}</span>)}</div>{profile.clubId && <small>Club : {profile.clubId}</small>}</div></section>}</main>;
}
