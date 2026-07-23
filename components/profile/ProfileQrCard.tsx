"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Download, Printer, QrCode, RefreshCw } from "lucide-react";

export function ProfileQrCard({ qrCodeId, onRegenerate }: { qrCodeId: string; onRegenerate?: () => Promise<string> }) {
  const [code, setCode] = useState(qrCodeId);
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const target = `${window.location.origin}/profiles/scan/${code}`;
    void QRCode.toDataURL(target, { width: 320, margin: 2, color: { dark: "#071628", light: "#ffffff" } }).then(setImage);
  }, [code]);
  return <section className="content-card qr-card"><h2><QrCode />Code QR du profil</h2><p>Le code contient uniquement une URL opaque. Les données visibles respectent vos paramètres de confidentialité.</p>{image && <Image unoptimized src={image} alt="Code QR du profil" width={220} height={220} />}<div className="page-actions">{image && <a className="button ghost" href={image} download="rowmotion-profile-qr.png"><Download />Télécharger</a>}<button className="button ghost" onClick={() => window.print()}><Printer />Imprimer</button>{onRegenerate && <button className="button ghost" disabled={busy} onClick={() => { setBusy(true); void onRegenerate().then(setCode).finally(() => setBusy(false)); }}><RefreshCw />Régénérer</button>}</div></section>;
}
