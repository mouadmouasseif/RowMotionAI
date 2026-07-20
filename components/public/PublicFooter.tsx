import Link from "next/link";
import { Brand } from "@/components/Brand";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedPath, siteConfig, type PublicLocale } from "@/config/site";
type FooterLink = readonly [string, string];
export function PublicFooter({ locale }: { locale: PublicLocale }) { const d = getDictionary(locale); const columns: Array<readonly [string, readonly FooterLink[]]> = [
  [d.footer.product, [[d.nav.features,"features"],[d.nav.ergo,"features/ergometer-analysis"],[d.nav.boat,"features/boat-analysis"],[d.nav.pricing,"pricing"]]],
  [d.footer.solutions, [["Athlètes","solutions/athletes"],["Coachs","solutions/coaches"],["Clubs","solutions/clubs"],["Fédérations","solutions/federations"]]],
  [d.footer.resources, [[d.nav.resources,"resources"],[d.nav.blog,"blog"],["FAQ","faq"],[d.common.search,"search"]]],
  [d.footer.company, [["À propos","about"],["Contact","contact"]]],
  [d.footer.legal, [["Confidentialité","privacy"],["Conditions","terms"],["Cookies","cookies"]]],
  [d.footer.languages, siteConfig.locales.map((item) => [item.toUpperCase(), `__locale:${item}`] as const)]
  ]; return <footer className="public-footer"><div className="public-footer-brand"><Brand /><p>{siteConfig.description}</p></div><div className="footer-columns">{columns.map(([title, links]) => <section key={title}><h2>{title}</h2>{links.map(([label,path]) => <Link key={`${title}-${label}`} href={path.startsWith("__locale:") ? localizedPath(path.slice(9) as PublicLocale) : localizedPath(locale,path)}>{label}</Link>)}</section>)}</div><div className="public-footer-bottom"><span>© 2026 RowMotion AI</span><a href={siteConfig.portfolioUrl} rel="noreferrer">Developed by Mouad Mouasseif</a></div></footer>; }
