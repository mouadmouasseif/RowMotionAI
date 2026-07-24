"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Download, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import { listCompetitions } from "@/services/competition-service";
import type { Competition } from "@/types/competition";

function CalendarContent() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Competition[]>([]);
  const [cursor, setCursor] = useState(new Date());
  useEffect(() => { if (profile) void listCompetitions().then(setItems); }, [profile]);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => index - offset + 1);
  const monthItems = useMemo(() => items.filter((item) => { const date = new Date(item.startDate); return date.getFullYear() === year && date.getMonth() === month; }), [items, month, year]);
  if (!profile) return null;

  return <AppShell referenceMode title="Calendrier des compétitions" subtitle="Consultez les compétitions Firebase à venir et passées." headerActions={<><button className="button ghost"><Download />Exporter le calendrier</button><Link className="button primary" href="/competitions/nouvelle"><Plus />Ajouter une compétition</Link></>}>
    <div className="competition-calendar-layout"><main><header><button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button><h2>{cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2><button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button></header><div className="competition-calendar">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((day) => <strong key={day}>{day}</strong>)}{cells.map((day, index) => <div className={day < 1 || day > days ? "outside" : ""} key={index}><span>{day > 0 && day <= days ? day : ""}</span>{monthItems.filter((item) => new Date(item.startDate).getDate() === day).map((item) => <article className={item.type ?? "other"} key={item.id}><CalendarDays /><strong>{item.name}</strong><small>{item.location}</small></article>)}</div>)}</div></main><aside><section><h2>Compétitions du mois</h2>{monthItems.length ? monthItems.map((item) => <Link href="/competitions" key={item.id}><time>{new Date(item.startDate).getDate()}</time><span><strong>{item.name}</strong><small>{item.location}</small></span></Link>) : <p>Aucune compétition ce mois.</p>}</section><section><h2>Filtres</h2><label>Statut<select><option>Tous les statuts</option></select></label><label>Type<select><option>Tous les types</option></select></label><label>Pays<select><option>Tous les pays</option></select></label></section></aside></div>
  </AppShell>;
}
export default function CompetitionCalendarPage() { return <ProtectedPage><CalendarContent /></ProtectedPage>; }
