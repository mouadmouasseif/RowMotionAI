import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicPage } from "@/components/public/PublicPage";
import { BlogIndex, BlogPost } from "@/components/public/BlogViews";
import { SearchPage } from "@/components/public/SearchPage";
import { getPublicPage } from "@/content/public-pages";
import { getBlogArticle } from "@/content/blog";

export function PublicRoute({ path, query="" }: { path:string; query?:string }) { let content;if(path==="blog")content=<BlogIndex locale="fr"/>;else if(path==="search")content=<SearchPage locale="fr" query={query}/>;else if(path.startsWith("blog/")){const article=getBlogArticle(path.slice(5));if(!article)notFound();content=<BlogPost locale="fr" article={article}/>;}else{const page=getPublicPage(path);if(!page)notFound();content=<PublicPage locale="fr" page={page}/>;}return <PublicShell locale="fr">{content}</PublicShell>; }
