import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/super-admin/","/club/","/coach/","/athlete/","/athletes/","/analyses/","/tableau-de-bord/","/connexion","/inscription"]},sitemap:`${siteConfig.url}/sitemap.xml`,host:siteConfig.url};}
