"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/providers/AuthProvider";
import { listAthletes } from "@/services/user-service";
import { displayAge } from "@/lib/user-profile";
import type { UserProfile } from "@/types/user";

export function AthleteSelector({ value, onChange, initialId }: { value: UserProfile | null; onChange: (value: UserProfile) => void; initialId?: string | null }) {
  const { profile } = useAuth(); const [athletes, setAthletes] = useState<UserProfile[]>([]); const [search, setSearch] = useState(""); const [error, setError] = useState("");
  useEffect(() => { if (!profile) return; void listAthletes(profile).then((rows) => { setAthletes(rows); const selected = rows.find((item) => item.uid === initialId) ?? (profile.role === "athlete" ? rows[0] : undefined); if (selected) onChange(selected); }).catch(() => setError("Impossible de charger les athlètes autorisés.")); }, [initialId, onChange, profile]);
  const filtered = useMemo(() => athletes.filter((athlete) => `${athlete.firstName} ${athlete.lastName} ${athlete.licenseNumber ?? ""}`.toLowerCase().includes(search.toLowerCase())), [athletes, search]);
  return <div className="athlete-selector">{profile?.role !== "athlete" && <label className="search-field"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un athlète ou une licence" /></label>}{error && <div className="error-card">{error}</div>}<div className="athlete-choice-list">{filtered.map((athlete) => <button type="button" className={value?.uid === athlete.uid ? "selected" : ""} key={athlete.uid} onClick={() => onChange(athlete)}><ProfileAvatar photoUrl={athlete.profilePhotoUrl} firstName={athlete.firstName} lastName={athlete.lastName} /><span><strong>{athlete.firstName} {athlete.lastName}</strong><small>{displayAge(athlete) !== null ? `${displayAge(athlete)} ans` : "Âge non renseigné"} · {athlete.officialCategory ?? athlete.calculatedCategory ?? "Sans catégorie"}<br />{athlete.disciplines.join(" · ") || "Disciplines non renseignées"}</small></span></button>)}</div>{filtered.length === 0 && !error && <div className="empty-inline"><UserRound />Aucun athlète autorisé.</div>}</div>;
}
