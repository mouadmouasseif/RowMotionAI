export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}
export type PwaInstallOutcome = "accepted" | "dismissed" | "unavailable";
export interface PwaInstallContextValue {
  canInstall: boolean; isInstalled: boolean; isStandalone: boolean; isPrompting: boolean;
  installOutcome: PwaInstallOutcome | null; isIosSafari: boolean;
  install: () => Promise<PwaInstallOutcome>;
}
