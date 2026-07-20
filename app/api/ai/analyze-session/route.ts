import { NextResponse } from "next/server";
import { z } from "zod";
const inputSchema = z.object({ sessionId: z.string().min(1), objective: z.string().max(500).optional(), metrics: z.record(z.string(), z.number().nullable()).optional(), pains: z.array(z.string().max(100)).max(20).optional() }).strict();
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100_000) return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }
  const parsed = inputSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Données de séance invalides.", details: parsed.error.flatten() }, { status: 400 });
  if (!process.env.AI_API_KEY) return NextResponse.json({ error: "Service IA indisponible – aucune recommandation générée." }, { status: 503 });
  return NextResponse.json({ error: "Fournisseur IA non configuré. La clé reste côté serveur et aucune donnée n'a été envoyée." }, { status: 501 });
}
