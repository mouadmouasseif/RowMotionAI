import { HomeLanding } from "@/components/HomeLanding";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
export const metadata=createMetadata({locale:"fr",path:"",title:"Analyse biomécanique intelligente pour l’aviron",description:siteConfig.description});
export default function HomePage(){return <HomeLanding/>;}
