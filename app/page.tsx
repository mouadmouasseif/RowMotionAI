import { PublicHome } from "@/components/public/PublicHome";
import { PublicShell } from "@/components/public/PublicShell";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export const metadata = createMetadata({ locale:"fr", path:"", title:"Analyse biomécanique intelligente pour l’aviron", description:siteConfig.description });
export default function HomePage(){return <PublicShell locale="fr"><PublicHome locale="fr"/></PublicShell>;}
