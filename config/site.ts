export const siteConfig = {
  name: "RowMotion AI",
  description: "Plateforme d’analyse biomécanique et vidéo pour l’aviron basée sur l’intelligence artificielle.",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "https://rowmotionai.vercel.app").replace(/\/$/, ""),
  locale: "fr" as const,
  locales: ["fr", "en", "ar"] as const,
  creator: "Mouad Mouasseif",
  portfolioUrl: "https://mouadmouasseif.vercel.app/",
  keywords: ["analyse vidéo aviron", "analyse biomécanique aviron", "intelligence artificielle aviron", "analyse ergomètre", "analyse bateau aviron", "AI rowing analysis", "rowing biomechanics", "rowing technique analysis", "ergometer analysis", "rowing coaching software"],
};
export type PublicLocale = (typeof siteConfig.locales)[number];
export function isPublicLocale(value: string): value is PublicLocale { return siteConfig.locales.includes(value as PublicLocale); }
export function localizedPath(locale: PublicLocale, path = "") { const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`; return `/${locale}${normalized}`; }
