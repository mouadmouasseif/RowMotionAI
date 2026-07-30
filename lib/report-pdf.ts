import { resolveAnalysisMetrics } from "@/lib/analysis/normalize-analysis";
import type { RowingAnalysis } from "@/types/analysis";

type PdfDocument = import("jspdf").jsPDF;

const blue: [number, number, number] = [39, 121, 244];
const ink: [number, number, number] = [21, 36, 52];
const muted: [number, number, number] = [91, 111, 132];

function reportDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString("fr-FR");
  }
  if (value instanceof Date) return value.toLocaleDateString("fr-FR");
  return "Date non renseignée";
}

function filenamePart(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function valueLabel(value: number | null, unit: string, digits = 1) {
  return value == null ? "Non mesuré" : `${value.toFixed(digits)} ${unit}`.trim();
}

function pageWidth(doc: PdfDocument) {
  return doc.internal.pageSize.getWidth();
}

function addHeader(doc: PdfDocument, title: string, subtitle: string) {
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth(doc), 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("RowMotion AI", 14, 13);
  doc.setFontSize(12);
  doc.text(title, 14, 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.setFontSize(9);
  doc.text(subtitle, 14, 38);
  return 47;
}

function ensureSpace(doc: PdfDocument, y: number, needed: number) {
  const height = doc.internal.pageSize.getHeight();
  if (y + needed <= height - 17) return y;
  doc.addPage();
  return 18;
}

function sectionTitle(doc: PdfDocument, title: string, y: number) {
  const nextY = ensureSpace(doc, y, 13);
  doc.setDrawColor(210, 222, 234);
  doc.line(14, nextY - 3, pageWidth(doc) - 14, nextY - 3);
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, nextY + 4);
  return nextY + 11;
}

function keyValues(doc: PdfDocument, rows: Array<[string, string]>, y: number) {
  let cursor = y;
  rows.forEach(([label, value]) => {
    cursor = ensureSpace(doc, cursor, 9);
    doc.setFillColor(246, 249, 252);
    doc.roundedRect(14, cursor - 4, pageWidth(doc) - 28, 8, 1.5, 1.5, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    doc.text(label, 18, cursor + 1);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ink);
    doc.text(value, pageWidth(doc) - 18, cursor + 1, { align: "right" });
    cursor += 10;
  });
  return cursor;
}

function textList(doc: PdfDocument, rows: string[], y: number) {
  let cursor = y;
  const values = rows.length ? rows : ["Aucun élément signalé."];
  values.forEach((row) => {
    const lines = doc.splitTextToSize(row, pageWidth(doc) - 36) as string[];
    cursor = ensureSpace(doc, cursor, lines.length * 5 + 4);
    doc.setFillColor(...blue);
    doc.circle(17, cursor - 1, 1, "F");
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(lines, 22, cursor);
    cursor += lines.length * 5 + 4;
  });
  return cursor;
}

function addFooters(doc: PdfDocument) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(220, 228, 236);
    doc.line(14, doc.internal.pageSize.getHeight() - 12, pageWidth(doc) - 14, doc.internal.pageSize.getHeight() - 12);
    doc.setTextColor(...muted);
    doc.setFontSize(8);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} - Page ${page}/${total}`, 14, doc.internal.pageSize.getHeight() - 7);
    doc.text("Aide technique vidéo - les données capteur non disponibles ne sont pas estimées.", pageWidth(doc) - 14, doc.internal.pageSize.getHeight() - 7, { align: "right" });
  }
}

export async function createAnalysisPdf(analysis: RowingAnalysis) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const metrics = resolveAnalysisMetrics(analysis);
  const score = analysis.technicalScore == null ? null : analysis.technicalScore > 10 ? analysis.technicalScore / 10 : analysis.technicalScore;
  let y = addHeader(doc, "Rapport d’analyse biomécanique", `${analysis.athleteName} - ${reportDate(analysis.createdAt)}`);

  y = sectionTitle(doc, "Synthèse", y);
  y = keyValues(doc, [
    ["Athlète", analysis.athleteName],
    ["Vidéo", analysis.fileName || "Vidéo sans nom"],
    ["Score technique", valueLabel(score, "/10", 1)],
    ["Cadence moyenne", valueLabel(metrics.strokeRate, "spm")],
    ["Symétrie", valueLabel(metrics.symmetryScore, "%")],
    ["Régularité", valueLabel(metrics.rhythmScore, "%")],
  ], y);

  y = sectionTitle(doc, "Posture et angles", y + 2);
  y = keyValues(doc, [
    ["Angle du genou", valueLabel(metrics.kneeAngle, "°")],
    ["Angle de la hanche", valueLabel(metrics.hipAngle, "°")],
    ["Inclinaison du dos", valueLabel(metrics.backAngle, "°")],
    ["Angle des épaules", valueLabel(metrics.shoulderAngle, "°")],
    ["Angle des coudes", valueLabel(metrics.elbowAngle, "°")],
  ], y);

  y = sectionTitle(doc, "Points à surveiller", y + 2);
  y = textList(doc, analysis.errors ?? [], y);
  y = sectionTitle(doc, "Recommandations", y + 2);
  textList(doc, analysis.recommendations ?? [], y);

  doc.setProperties({ title: `Rapport RowMotion AI - ${analysis.athleteName}`, subject: "Analyse biomécanique d’aviron", author: "RowMotion AI" });
  addFooters(doc);
  return {
    doc,
    filename: `rowmotion-analyse-${filenamePart(analysis.athleteName) || analysis.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
  };
}

export async function downloadAnalysisPdf(analysis: RowingAnalysis) {
  const { doc, filename } = await createAnalysisPdf(analysis);
  doc.save(filename);
  return filename;
}

interface ReportsPdfInput {
  analyses: RowingAnalysis[];
  clubs: number;
  competitions: number;
  athletes: number;
  coaches: number;
}

export async function createReportsPdf(input: ReportsPdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const completed = input.analyses.filter((analysis) => analysis.status === "completed");
  let y = addHeader(doc, "Rapport global de la structure", `Données disponibles au ${new Date().toLocaleDateString("fr-FR")}`);

  y = sectionTitle(doc, "Vue d’ensemble", y);
  y = keyValues(doc, [
    ["Clubs actifs", String(input.clubs)],
    ["Compétitions", String(input.competitions)],
    ["Athlètes", String(input.athletes)],
    ["Coachs", String(input.coaches)],
    ["Analyses terminées", String(completed.length)],
    ["Analyses en cours", String(input.analyses.filter((analysis) => analysis.status === "processing").length)],
  ], y);

  y = sectionTitle(doc, "Analyses récentes", y + 2);
  const recentRows: Array<[string, string]> = completed.slice(0, 30).map((analysis) => {
    const score = analysis.technicalScore == null ? "Non mesuré" : `${(analysis.technicalScore > 10 ? analysis.technicalScore / 10 : analysis.technicalScore).toFixed(1)}/10`;
    return [`${analysis.athleteName} - ${reportDate(analysis.createdAt)}`, score];
  });
  keyValues(doc, recentRows.length ? recentRows : [["Analyses", "Aucune analyse terminée"]], y);

  doc.setProperties({ title: "Rapport global RowMotion AI", subject: "Synthèse de la structure", author: "RowMotion AI" });
  addFooters(doc);
  return { doc, filename: `rowmotion-rapport-${new Date().toISOString().slice(0, 10)}.pdf` };
}

export async function downloadReportsPdf(input: ReportsPdfInput) {
  const { doc, filename } = await createReportsPdf(input);
  doc.save(filename);
  return filename;
}
