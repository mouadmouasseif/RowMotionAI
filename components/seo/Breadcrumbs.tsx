import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { localizedPath, type PublicLocale } from "@/config/site";
export function Breadcrumbs({ locale, path, current }: { locale: PublicLocale; path: string; current: string }) { const segments = path.split("/").filter(Boolean); return <nav className="breadcrumbs" aria-label="Fil d’Ariane"><Link href={localizedPath(locale)}>RowMotion AI</Link>{segments.slice(0, -1).map((segment, index) => { const href = localizedPath(locale, segments.slice(0, index + 1).join("/")); return <span key={href}><ChevronRight /><Link href={href}>{segment.replaceAll("-", " ")}</Link></span>; })}<span><ChevronRight /><span aria-current="page">{current}</span></span></nav>; }
