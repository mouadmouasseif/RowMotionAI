import type { MetadataRoute } from "next";
import { blogArticles } from "@/content/blog";
import { publicPages } from "@/content/public-pages";
import { localizedPath, siteConfig } from "@/config/site";
export default function sitemap():MetadataRoute.Sitemap{const changed=new Date();const paths=["",...publicPages.map(p=>p.path),"blog",...blogArticles.map(a=>`blog/${a.slug}`)];return paths.flatMap(path=>siteConfig.locales.map(locale=>({url:`${siteConfig.url}${localizedPath(locale,path)}`,lastModified:changed,changeFrequency:path.startsWith("blog/")?"monthly" as const:"weekly" as const,priority:path?0.7:1}))).concat(paths.map(path=>({url:`${siteConfig.url}/${path}`,lastModified:changed,changeFrequency:"weekly" as const,priority:path?0.7:1})));}
