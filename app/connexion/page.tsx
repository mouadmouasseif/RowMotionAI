"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { GoogleAuthProvider, sendPasswordResetEmail, setPersistence, signInWithPopup, signOut, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getDashboardRouteByRole } from "@/config/dashboard-routes";
import { getAuthErrorMessage, getFirebaseErrorCode } from "@/lib/auth-errors";
import { auth, db } from "@/lib/firebase";
import { getSafeNextPath } from "@/lib/navigation/safe-next-path";
import { createUserProfile, loginUser } from "@/services/auth-service";

const schema = z.object({
  email: z.string().email("Saisissez une adresse e-mail valide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres."),
  remember: z.boolean().optional(),
});
type LoginValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });
  const email = watch("email");
  const remember = watch("remember");

  function redirectAfterLogin(role: Parameters<typeof getDashboardRouteByRole>[0]) {
    const requestedPath = new URLSearchParams(window.location.search).get("next");
    router.replace(getSafeNextPath(requestedPath, getDashboardRouteByRole(role)));
    router.refresh();
  }

  async function onSubmit(values: LoginValues) {
    setServerError("");
    setSuccessMessage("");
    try {
      if (!auth) throw new Error("Le service de connexion est temporairement indisponible.");
      await setPersistence(auth, values.remember ? browserLocalPersistence : browserSessionPersistence);
      const profile = await loginUser({ email: values.email, password: values.password });
      redirectAfterLogin(profile.role);
    } catch (error) {
      const firebaseCode = getFirebaseErrorCode(error);
      if (firebaseCode && firebaseCode !== "auth/invalid-credential") {
        console.error("[RowMotion] Firebase login failed:", firebaseCode);
      }
      setServerError(getAuthErrorMessage(error));
    }
  }

  async function handlePasswordReset() {
    setServerError("");
    setSuccessMessage("");
    const normalizedEmail = email?.trim();
    if (!normalizedEmail) {
      setServerError("Saisissez votre adresse e-mail avant de demander la reinitialisation.");
      return;
    }
    try {
      if (!auth) throw new Error("Le service de connexion est temporairement indisponible.");
      await sendPasswordResetEmail(auth, normalizedEmail);
      setSuccessMessage("Un e-mail de reinitialisation vient d'etre envoye si ce compte existe.");
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
    }
  }

  async function handleGoogleLogin() {
    setServerError("");
    setSuccessMessage("");
    setSocialLoading(true);
    try {
      if (!auth || !db) throw new Error("Le service de connexion est temporairement indisponible.");
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const snapshot = await getDoc(doc(db, "users", credential.user.uid));
      if (!snapshot.exists()) {
        await signOut(auth);
        throw new Error("Votre compte Google existe mais aucun profil RowMotion AI n'est associe a ce compte.");
      }
      const profile = createUserProfile(credential.user.uid, credential.user.email, snapshot.data());
      if (!profile.active) {
        await signOut(auth);
        throw new Error("Ce compte a ete desactive.");
      }
      redirectAfterLogin(profile.role);
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
    } finally {
      setSocialLoading(false);
    }
  }

  return (
    <main className="row-login-page">
      <section className="row-login-hero" aria-label="Presentation RowMotion AI">
        <motion.div className="row-login-brand-block" initial={false} animate={{ opacity: 1, y: 0 }}>
          <Image className="row-login-logo" src="/logo-horizontal-dark.png" alt="RowMotion AI - Better Technique. Better Performance." width={332} height={88} priority />
        </motion.div>
        <motion.div className="row-login-copy" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h1>Analyse biomecanique intelligente pour <span>l&apos;aviron</span></h1>
          <p>Analysez les mouvements d&apos;un rameur sur ergometre ou dans le bateau grace a l&apos;intelligence artificielle, a la vision par ordinateur et aux donnees de performance.</p>
        </motion.div>
        <div className="row-login-rower-visual" aria-hidden="true">
          <Image src="/rowing-analysis.png" alt="" fill priority sizes="(max-width: 1023px) 100vw, 53vw" />
        </div>
      </section>

      <section className="row-login-panel" aria-label="Connexion">
        <motion.div className="row-login-card" initial={false} animate={{ opacity: 1, x: 0 }}>
          <div className="row-login-heading">
            <h2>Connexion</h2>
            <p>Connectez-vous a votre compte RowMotion AI</p>
          </div>

          <form className="row-login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="row-login-field">
              <label htmlFor="email">Adresse e-mail</label>
              <div className={`row-login-input${errors.email ? " invalid" : ""}`}>
                <Mail aria-hidden="true" />
                <input id="email" type="email" autoComplete="email" placeholder="Votre adresse e-mail" {...register("email")} />
              </div>
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>

            <div className="row-login-field">
              <label htmlFor="password">Mot de passe</label>
              <div className={`row-login-input${errors.password ? " invalid" : ""}`}>
                <LockKeyhole aria-hidden="true" />
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Votre mot de passe" {...register("password")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>

            <div className="row-login-options">
              <label className="remember"><input type="checkbox" {...register("remember")} /> Se souvenir de moi</label>
              <button type="button" onClick={handlePasswordReset} disabled={isSubmitting || socialLoading}>Mot de passe oublie ?</button>
            </div>

            {serverError && <InlineAuthMessage tone="error" message={serverError} />}
            {successMessage && <InlineAuthMessage tone="success" message={successMessage} />}

            <button className="row-login-submit" disabled={isSubmitting || socialLoading}>
              {isSubmitting ? <><Loader2 aria-hidden="true" /> Connexion...</> : <>Se connecter <ArrowRight aria-hidden="true" /></>}
            </button>
          </form>

          <div className="row-login-divider"><span>ou continuer avec</span></div>
          <div className="row-login-socials" aria-label="Autres options de connexion">
            <button type="button" onClick={handleGoogleLogin} disabled={isSubmitting || socialLoading}>
              {socialLoading ? <Loader2 aria-hidden="true" /> : <GoogleMark />} Google
            </button>
          </div>

          <p className="row-login-signup">Pas encore de compte ? <Link href="/inscription">Creer un compte</Link></p>
          <p className="row-login-legal">Aucun role n&apos;est choisi sur cet ecran. Les permissions viennent du profil Firestore.</p>
        </motion.div>

        <div className="row-login-security">
          <ShieldCheck aria-hidden="true" />
          <p>Vos donnees sont securisees. Nous ne partageons jamais vos informations.</p>
        </div>
      </section>
    </main>
  );
}

function InlineAuthMessage({ tone, message }: { tone: "error" | "success"; message: string }) {
  const isError = tone === "error";
  return (
    <div className={`row-login-alert ${tone}`} role={isError ? "alert" : "status"}>
      {isError ? <AlertCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <span>{message}</span>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.8-5.5 3.8a6 6 0 0 1 0-12c1.9 0 3.1.8 3.8 1.5l2.6-2.5A9.8 9.8 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12Z" />
      <path fill="#34A853" d="M3.3 7.4 6.5 9.8A6 6 0 0 1 12 5.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5A9.8 9.8 0 0 0 12 2a10 10 0 0 0-8.7 5.4Z" />
      <path fill="#4A90E2" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.1-2.4c-.8.6-1.9 1-3.5 1a6 6 0 0 1-5.6-4.1l-3.2 2.5A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-4.1L3.3 7.4a10 10 0 0 0 0 9.1L6.4 14Z" />
    </svg>
  );
}
