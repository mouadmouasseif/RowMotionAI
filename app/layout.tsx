import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import { AuthProvider } from "@/providers/AuthProvider";
import { PwaInstallProvider } from "@/components/pwa/PwaInstallProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { NetworkStatus } from "@/components/pwa/NetworkStatus";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { CookieConsent } from "@/components/CookieConsent";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "RowMotion AI", template: "%s | RowMotion AI" },
  description: "Plateforme d’analyse biomécanique pour l’aviron en bateau et sur ergomètre.",
  manifest: "/manifest.webmanifest",
  applicationName: "RowMotion AI",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RowMotion AI" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/favicon.ico" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};
export const viewport: Viewport = { themeColor: "#0b5cff", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" suppressHydrationWarning><body><PwaInstallProvider><AuthProvider><FirebaseAnalytics /><ServiceWorkerRegister /><NetworkStatus />{children}<CookieConsent /><InstallBanner /></AuthProvider></PwaInstallProvider></body></html>;
}
