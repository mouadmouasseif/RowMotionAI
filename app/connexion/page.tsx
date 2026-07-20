"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Brand } from "@/components/Brand";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { loginUser } from "@/services/auth-service";
import { getDashboardPath, type UserRole } from "@/types/user";

const schema = z.object({
  email: z.string().email("Saisissez une adresse e-mail valide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  remember: z.boolean().optional(),
});
type LoginValues = z.infer<typeof schema>;

const roles = [
  { value: "athlete", label: "Athlète" }, { value: "coach", label: "Entraîneur" },
  { value: "club_admin", label: "Admin club" }, { value: "superadmin", label: "Super admin" },
] satisfies { value: UserRole; label: string }[];

function LoginContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("athlete");
  const [serverError, setServerError] = useState("");
  const [superAdminCode, setSuperAdminCode] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { remember: true } });

  async function onSubmit(values: LoginValues) {
    setServerError("");
    try {
      const profile = await loginUser({ email: values.email, password: values.password, selectedRole: role, superAdminCode });
      router.replace(getDashboardPath(profile.role));
      router.refresh();
    } catch (error) { setServerError(getAuthErrorMessage(error)); }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-overlay" /><Brand />
        <motion.div className="auth-message" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span><ShieldCheck /> Plateforme sécurisée</span>
          <h1>La performance commence par une meilleure technique.</h1>
          <p>Analysez vos mouvements, suivez votre progression et collaborez avec toute votre équipe.</p>
          <div className="auth-proof"><strong>15 000+</strong><small>analyses biomécaniques réalisées</small></div>
        </motion.div>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand"><Brand compact /></div>
        <motion.div className="auth-card" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }}>
          <div className="auth-heading"><span className="auth-icon"><UserRound /></span><h2>Heureux de vous revoir</h2><p>Connectez-vous à votre espace RowMotion AI.</p></div>
          <div className="role-picker" aria-label="Type de profil">
            {roles.map(({ value, label }) => <button type="button" className={role === value ? "selected" : ""} key={value} onClick={() => setRole(value)}>{label}</button>)}
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="field-label" htmlFor="email">Adresse e-mail</label>
            <div className={`input-shell${errors.email ? " invalid" : ""}`}><Mail /><input id="email" type="email" autoComplete="email" placeholder="nom@club.fr" {...register("email")} /></div>
            {errors.email && <span className="field-error">{errors.email.message}</span>}
            <div className="password-label"><label className="field-label" htmlFor="password">Mot de passe</label><a href="mailto:support@rowmotion.ai">Mot de passe oublié ?</a></div>
            <div className={`input-shell${errors.password ? " invalid" : ""}`}><LockKeyhole /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" {...register("password")} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Afficher ou masquer le mot de passe">{showPassword ? <EyeOff /> : <Eye />}</button></div>
            {errors.password && <span className="field-error">{errors.password.message}</span>}
            {role === "superadmin" && <><label className="field-label super-code-label" htmlFor="super-code">Code d’accès Super administrateur</label><div className="input-shell"><ShieldCheck /><input id="super-code" type="password" value={superAdminCode} onChange={(event) => setSuperAdminCode(event.target.value)} placeholder="ROW-SUPER-XXXX" /></div></>}
            <label className="remember"><input type="checkbox" {...register("remember")} /> Rester connecté sur cet appareil</label>
            {serverError && <div className="auth-error">{serverError}</div>}
            <button className="submit-button" disabled={isSubmitting}>{isSubmitting ? "Connexion…" : "Se connecter"}</button>
          </form>
          <p className="signup-line">Pas encore de compte ? <Link href="/inscription">Créer un compte</Link></p>
          <p className="legal">En vous connectant, vous acceptez les conditions d’utilisation et la politique de confidentialité.</p>
        </motion.div>
      </section>
    </main>
  );
}

export default function LoginPage() { return <LoginContent />; }
