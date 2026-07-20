import { z } from "zod";
export const aiFeedbackSchema = z.object({ summary: z.string().min(1), strengths: z.array(z.string()), weaknesses: z.array(z.string()), injuryPrevention: z.array(z.string()), technicalCorrections: z.array(z.string()), nextSessionObjectives: z.array(z.string()), confidence: z.number().min(0).max(1) });
export type ValidatedAITrainingFeedback = z.infer<typeof aiFeedbackSchema>;
export function parseAITrainingFeedback(value: unknown): ValidatedAITrainingFeedback { return aiFeedbackSchema.parse(value); }

