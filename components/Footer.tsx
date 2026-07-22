import { MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-identity"><Brand /><span className="footer-divider" /><strong>RowMotion AI</strong></div>
        <nav className="footer-links" aria-label="Liens légaux">
          <Link href="/politique-de-confidentialite">Politique de confidentialité</Link>
          <Link href="/conditions-utilisation">Conditions d&apos;utilisation</Link>
        </nav>
        <div className="footer-credit"><span>Développé par</span><Link href="https://mouadmouasseif.vercel.app/"><Image src="/made-for-web.png" alt="Mouad Mouasseif" width={42} height={42} /></Link><strong>Mouad Mouasseif</strong></div>
      </div>
      <div className="footer-bottom">© 2026 RowMotion AI <span>|</span> Développé par Mouad Mouasseif. Tous droits réservés.</div>
      <a className="footer-chat" href="https://mouadmouasseif.vercel.app/" aria-label="Contacter RowMotion AI"><MessageCircle /></a>
    </footer>
  );
}
