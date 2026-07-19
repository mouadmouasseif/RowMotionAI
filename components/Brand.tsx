import Link from "next/link";
import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`brand${compact ? " compact" : ""}`} href="/" aria-label="RowMotion AI, accueil">
      <Image className="brand-logo" src="/logo-horizontal-dark.png" alt="RowMotion AI — Better Technique. Better Performance." width={332} height={88} priority />
    </Link>
  );
}
