import type { Metadata } from "next";
import { localizedPath, siteConfig, type PublicLocale } from "@/config/site";

export function createMetadata(input: { locale: PublicLocale; path?: string; title: string; description: string; keywords?: string[]; type?: "website" | "article"; publishedTime?: string; modifiedTime?: string }): Metadata {
  const path = input.path ?? ""; const canonical = `${siteConfig.url}${localizedPath(input.locale, path)}`;
  const languages = Object.fromEntries(siteConfig.locales.map((locale) => [locale, `${siteConfig.url}${localizedPath(locale, path)}`]));
  return {
    title: input.title, description: input.description,
    keywords: [...siteConfig.keywords, ...(input.keywords ?? [])],
    alternates: { canonical, languages: { ...languages, "x-default": `${siteConfig.url}${localizedPath("fr", path)}` } },
    robots: { index: true, follow: true },
    openGraph: { type: input.type ?? "website", locale: input.locale === "fr" ? "fr_FR" : input.locale === "en" ? "en_US" : "ar_MA", url: canonical, siteName: siteConfig.name, title: input.title, description: input.description, images: [{ url: `${siteConfig.url}/rowing-analysis.png`, width: 956, height: 537, alt: "RowMotion AI — analyse biomécanique d’aviron" }], publishedTime: input.publishedTime, modifiedTime: input.modifiedTime },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: [`${siteConfig.url}/rowing-analysis.png`] },
  };
}
