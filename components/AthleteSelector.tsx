"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { displayAge } from "@/lib/user-profile";
import { useAuth } from "@/providers/AuthProvider";
import { listAthletes } from "@/services/user-service";
import type { ProfileDiscipline, UserProfile } from "@/types/user";

export function AthleteSelector({ value, onChange, initialId }: { value: UserProfile | null; onChange: (value: UserProfile) => void; initialId?: string | null }) {
  const { profile } = useAuth();
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [club, setClub] = useState("all");
  const [coach, setCoach] = useState("all");
  const [discipline, setDiscipline] = useState("all");
  const [category, setCategory] = useState("all");
  const [gender, setGender] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    setError("");
    void listAthletes(profile)
      .then((rows) => {
        setAthletes(rows);
        const selected = rows.find((item) => item.uid === initialId) ?? (profile.role === "ATHLETE" ? rows[0] : undefined);
        if (selected) onChange(selected);
      })
      .catch(() => setError("Impossible de charger les athlètes autorisés."))
      .finally(() => setLoading(false));
  }, [initialId, onChange, profile]);

  const options = useMemo(() => ({
    clubs: Array.from(new Set(athletes.map((item) => item.clubId).filter((item): item is string => Boolean(item)))).sort(),
    coaches: Array.from(new Set(athletes.flatMap((item) => [item.coachId, ...(item.coachIds ?? [])]).filter((item): item is string => Boolean(item)))).sort(),
    disciplines: Array.from(new Set(athletes.flatMap((item) => item.disciplines))).sort(),
    categories: Array.from(new Set(athletes.map((item) => item.officialCategory ?? item.calculatedCategory ?? item.category).filter((item): item is string => Boolean(item)))).sort(),
    genders: Array.from(new Set(athletes.map((item) => item.gender).filter((item) => item !== "not_specified"))).sort(),
  }), [athletes]);

  const filtered = useMemo(() => athletes.filter((athlete) => {
    const categoryValue = athlete.officialCategory ?? athlete.calculatedCategory ?? athlete.category ?? "";
    return `${athlete.firstName} ${athlete.lastName} ${athlete.licenseNumber ?? ""}`.toLowerCase().includes(search.toLowerCase())
      && (club === "all" || athlete.clubId === club)
      && (coach === "all" || athlete.coachId === coach || athlete.coachIds?.includes(coach))
      && (discipline === "all" || athlete.disciplines.includes(discipline as ProfileDiscipline))
      && (category === "all" || categoryValue === category)
      && (gender === "all" || athlete.gender === gender);
  }), [athletes, category, club, coach, discipline, gender, search]);

  return (
    <div className="athlete-selector">
      {profile?.role !== "ATHLETE" && (
        <>
          <label className="search-field">
            <Search />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un athlète ou une licence" />
          </label>
          <div className="athlete-filter-grid">
            <select aria-label="Club" value={club} onChange={(event) => setClub(event.target.value)}>
              <option value="all">Tous les clubs</option>
              {options.clubs.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Coach" value={coach} onChange={(event) => setCoach(event.target.value)}>
              <option value="all">Tous les coachs</option>
              {options.coaches.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Discipline" value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
              <option value="all">Toutes disciplines</option>
              {options.disciplines.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Catégorie" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">Toutes catégories</option>
              {options.categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Genre" value={gender} onChange={(event) => setGender(event.target.value)}>
              <option value="all">Tous genres</option>
              {options.genders.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </>
      )}
      {loading && <div className="empty-inline"><UserRound />Chargement des athlètes...</div>}
      {error && <div className="error-card">{error}</div>}
      <div className="athlete-choice-list">
        {filtered.map((athlete) => (
          <button type="button" className={value?.uid === athlete.uid ? "selected" : ""} key={athlete.uid} onClick={() => onChange(athlete)}>
            <ProfileAvatar photoUrl={athlete.profilePhotoUrl} firstName={athlete.firstName} lastName={athlete.lastName} />
            <span>
              <strong>{athlete.firstName} {athlete.lastName}</strong>
              <small>{displayAge(athlete) !== null ? `${displayAge(athlete)} ans` : "Age non renseigné"} · {athlete.officialCategory ?? athlete.calculatedCategory ?? "Sans catégorie"}<br />{athlete.disciplines.join(" · ") || "Disciplines non renseignées"}</small>
            </span>
          </button>
        ))}
      </div>
      {!loading && filtered.length === 0 && !error && <div className="empty-inline"><UserRound />Aucun athlète autorisé.</div>}
    </div>
  );
}
