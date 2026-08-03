"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft, Chrome, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Brand } from "@/components/Brand";
import { getDashboardRouteByRole } from "@/config/dashboard-routes";
import { getAuthErrorMessage, getFirebaseErrorCode } from "@/lib/auth-errors";
import { getSafeNextPath } from "@/lib/navigation/safe-next-path";
import { loginUser } from "@/services/auth-service";

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
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  async function onSubmit(values: LoginValues) {
    setServerError("");
    try {
      const profile = await loginUser({ email: values.email, password: values.password });
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      router.replace(getSafeNextPath(requestedPath, getDashboardRouteByRole(profile.role)));
      router.refresh();
    } catch (error) {
      const firebaseCode = getFirebaseErrorCode(error);
      if (firebaseCode && firebaseCode !== "auth/invalid-credential") {
        console.error("[RowMotion] Firebase login failed:", firebaseCode);
      }
      setServerError(getAuthErrorMessage(error));
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-overlay" />
        <Brand />
        <motion.div className="auth-message" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span><ShieldCheck /> Plateforme securisee</span>
          <h1>RowMotion AI</h1>
          <p>Connexion a votre espace personnel, equipe, club, jury ou administration.</p>
        </motion.div>
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-hero" aria-hidden="true">
          <Link className="auth-back" href="/" tabIndex={-1}><ArrowLeft /></Link>
        </div>
        <div className="mobile-brand"><Brand compact /></div>
        <motion.div className="auth-card" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }}>
          <div className="auth-heading">
            <h2>Connexion a votre espace</h2>
            <p>Votre espace sera automatiquement configure selon votre role.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="field-label sr-only" htmlFor="email">Adresse e-mail</label>
            <div className={`input-shell${errors.email ? " invalid" : ""}`}>
              <Mail />
              <input id="email" type="email" autoComplete="email" placeholder="Email" {...register("email")} />
            </div>
            {errors.email && <span className="field-error">{errors.email.message}</span>}

            <label className="field-label sr-only" htmlFor="password">Mot de passe</label>
            <div className={`input-shell password-shell${errors.password ? " invalid" : ""}`}>
              <LockKeyhole />
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Mot de passe" {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Afficher ou masquer le mot de passe">
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password.message}</span>}

            <div className="auth-options">
              <label className="remember"><input type="checkbox" {...register("remember")} /> Se souvenir de moi</label>
              <a href="mailto:support@rowmotion.ai">Mot de passe oublie ?</a>
            </div>
            {serverError && <div className="auth-error">{serverError}</div>}
            <button className="submit-button" disabled={isSubmitting}>{isSubmitting ? "Connexion..." : "Se connecter"}</button>
          </form>

          <div className="social-divider"><span>ou continuer avec</span></div>
          <div className="social-logins" aria-label="Autres options de connexion">
            <button type="button" disabled title="Bientot disponible"><Chrome /></button>
          </div>
          <p className="signup-line">Pas encore de compte ? <Link href="/inscription">Creer un compte</Link></p>
          <p className="legal">Aucun role n&apos;est choisi sur cet ecran. Les permissions viennent du profil Firestore.</p>
        </motion.div>
      </section>
    </main>
  );
}
