import { redirect } from "next/navigation";
export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) { const { reportId } = await params; redirect(`/rapports?report=${encodeURIComponent(reportId)}`); }
