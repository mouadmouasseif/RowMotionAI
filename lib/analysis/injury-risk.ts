import type { InjuryRiskItem, InjuryRiskLevel } from "@/types/rowing-domain";
export interface InjuryRiskInput { bodyArea: InjuryRiskItem["bodyArea"]; excessiveRange?: boolean; repeatedPoorPosture?: boolean; asymmetryPercent?: number; fatigue?: number; pain?: number; sessionMinutes?: number; confidence?: number }
function level(score: number): InjuryRiskLevel { if (score >= 80) return "CRITICAL"; if (score >= 60) return "HIGH"; if (score >= 30) return "MODERATE"; return "LOW"; }
export function calculateInjuryRisk(input: InjuryRiskInput): InjuryRiskItem {
  const factors: string[] = []; let score = 0;
  if (input.excessiveRange) { score += 20; factors.push("Amplitude excessive répétée"); }
  if (input.repeatedPoorPosture) { score += 20; factors.push("Posture défavorable répétée"); }
  if ((input.asymmetryPercent ?? 0) > 10) { score += Math.min(20, input.asymmetryPercent ?? 0); factors.push("Asymétrie gauche-droite"); }
  if ((input.fatigue ?? 0) >= 7) { score += 15; factors.push("Fatigue déclarée élevée"); }
  if ((input.pain ?? 0) > 0) { score += Math.min(20, (input.pain ?? 0) * 2); factors.push("Douleur déclarée"); }
  if ((input.sessionMinutes ?? 0) > 90) { score += 10; factors.push("Volume de séance élevé"); }
  const bounded = Math.min(100, Math.round(score));
  return { bodyArea: input.bodyArea, score: bounded, level: level(bounded), factors, recommendations: factors.length ? ["Adapter la charge et faire valider la situation par un professionnel de santé si les symptômes persistent."] : ["Poursuivre la surveillance et la récupération habituelle."], confidence: Math.min(1, Math.max(0, input.confidence ?? 0.5)) };
}

