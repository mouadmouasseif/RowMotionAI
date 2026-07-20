import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Brand } from "@/components/Brand";
export default function OfflinePage() { return <main className="offline-page"><Brand /><section><span><WifiOff /></span><h1>Vous êtes hors connexion</h1><p>Certaines fonctionnalités comme l’import vidéo, l’analyse en direct et la synchronisation Firebase nécessitent Internet.</p><Link className="button primary" href="/">Réessayer</Link></section></main>; }
