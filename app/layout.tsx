import type { Metadata } from "next";
import "./globals.css";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import { AuthProvider } from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "RowMotion AI — Analyse biomécanique d’aviron",
  description: "Analysez votre technique d'aviron par intelligence artificielle.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon-dark.png", apple: "/app-icon-dark.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body><AuthProvider><FirebaseAnalytics />{children}</AuthProvider></body>
    </html>
  );
}
