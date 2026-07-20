import { redirect } from "next/navigation";
export default async function ClubCoachPage({ params }: { params: Promise<{ coachId: string }> }) { const { coachId } = await params; redirect(`/coaches/${coachId}`); }
