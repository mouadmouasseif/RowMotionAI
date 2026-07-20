import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicHome } from "@/components/public/PublicHome";
import { PublicPage } from "@/components/public/PublicPage";
import { BlogIndex, BlogPost } from "@/components/public/BlogViews";
import { SearchPage } from "@/components/public/SearchPage";
import { getPublicPage, publicPages } from "@/content/public-pages";
import { blogArticles, getBlogArticle } from "@/content/blog";
import { createMetadata } from "@/lib/seo";
import { isPublicLocale, siteConfig } from "@/config/site";

type Props = { params: Promise<{ locale: string; slug?: string[] }>; searchParams: Promise<{ q?: string }> };
export function generateStaticParams() { return siteConfig.locales.flatMap((locale) => [{locale}, ...publicPages.map((page) => ({locale,slug:page.path.split("/")})), {locale,slug:["blog"]}, ...blogArticles.map((article) => ({locale,slug:["blog",article.slug]})), {locale,slug:["search"]}]); }
export async function generateMetadata({ params }: Props) { const {locale:raw,slug=[]}=await params; if(!isPublicLocale(raw)) return {}; const path=slug.join("/"); const page=getPublicPage(path); const article=path.startsWith("blog/")?getBlogArticle(slug[1] ?? ""):undefined; return createMetadata({locale:raw,path,title:article?.title ?? page?.title[raw] ?? (path === "blog" ? "Blog aviron et biomécanique" : path === "search" ? "Recherche" : "Analyse biomécanique intelligente pour l’aviron"),description:article?.description ?? page?.description[raw] ?? siteConfig.description,type:article?"article":"website"}); }
export default async function LocalizedPublicPage({params,searchParams}:Props){const {locale:raw,slug=[]}=await params;if(!isPublicLocale(raw))notFound();const path=slug.join("/");let content;if(!path)content=<PublicHome locale={raw}/>;else if(path==="blog")content=<BlogIndex locale={raw}/>;else if(path==="search")content=<SearchPage locale={raw} query={(await searchParams).q ?? ""}/>;else if(path.startsWith("blog/")){const article=getBlogArticle(slug[1] ?? "");if(!article)notFound();content=<BlogPost locale={raw} article={article}/>;}else{const page=getPublicPage(path);if(!page)notFound();content=<PublicPage locale={raw} page={page}/>;}return <PublicShell locale={raw}>{content}</PublicShell>;}
