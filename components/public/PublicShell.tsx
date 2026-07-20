import type { ReactNode } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { GlobalSchemas } from "@/components/seo/Schemas";
import type { PublicLocale } from "@/config/site";

export function PublicShell({ locale, children }: { locale: PublicLocale; children: ReactNode }) {
  return <div className="public-site" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><GlobalSchemas locale={locale} /><a className="skip-link" href="#main-content">Aller au contenu</a><PublicHeader locale={locale} /><div id="main-content">{children}</div><PublicFooter locale={locale} /></div>;
}
