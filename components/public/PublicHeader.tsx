"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe2, Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedPath, siteConfig, type PublicLocale } from "@/config/site";

export function PublicHeader({ locale }: { locale: PublicLocale }) {
  const [open, setOpen] = useState(false); const pathname = usePathname(); const dictionary = getDictionary(locale);
  useEffect(() => { if (!open) return; const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; document.body.style.overflow = "hidden"; window.addEventListener("keydown", escape); return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", escape); }; }, [open]);
  const items = [[dictionary.nav.home, ""], [dictionary.nav.features, "features"], [dictionary.nav.solutions, "solutions"], [dictionary.nav.ergo, "features/ergometer-analysis"], [dictionary.nav.boat, "features/boat-analysis"], [dictionary.nav.resources, "resources"], [dictionary.nav.blog, "blog"], [dictionary.nav.pricing, "pricing"]] as const;
  const suffix = pathname.replace(/^\/(fr|en|ar)/, "").replace(/^\//, "");
  return <header className="public-header"><Brand /><button className="public-menu-button" aria-expanded={open} aria-controls="public-navigation" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</button><nav id="public-navigation" className={open ? "open" : ""}>{items.map(([label, path]) => <Link key={path || "home"} href={localizedPath(locale, path)} onClick={() => setOpen(false)}>{label}</Link>)}</nav><div className="public-actions"><Link className="search-link" href={localizedPath(locale, "search")} aria-label={dictionary.common.search}><Search /></Link><label className="language-select"><Globe2 /><span className="sr-only">Langue</span><select value={locale} onChange={(event) => { window.location.href = localizedPath(event.target.value as PublicLocale, suffix); }}>{siteConfig.locales.map((item) => <option value={item} key={item}>{item.toUpperCase()}</option>)}</select></label><Link className="button ghost" href="/connexion">{dictionary.nav.login}</Link><Link className="button primary" href="/inscription">{dictionary.nav.start}</Link></div></header>;
}
