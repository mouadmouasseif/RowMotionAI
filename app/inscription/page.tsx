"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Building2, Eye, EyeOff, IdCard, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Brand } from "@/components/Brand";
import { getFirebaseRegistrationError } from "@/lib/firebase-error";
import { registerUser } from "@/services/register-user";

const schema = z.object({
  firstName: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères."),
  lastName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().trim().email("Saisissez une adresse e-mail valide."),
  phone: z.string().optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").regex(/[A-Z]/, "Ajoutez au moins une majuscule.").regex(/[a-z]/, "Ajoutez au moins une minuscule.").regex(/[0-9]/, "Ajoutez au moins un chiffre."),
  confirmPassword: z.string(),
  role: z.enum(["athlete", "coach", "club_admin"]),
  clubId: z.string().optional(),
  coachId: z.string().optional(),
  licenseNumber: z.string().optional(),
  termsAccepted: z.boolean().refine((value) => value, "Vous devez accepter les conditions."),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas." });
  if (values.role === "coach" && !values.licenseNumber?.trim()) context.addIssue({ code: "custom", path: ["licenseNumber"], message: "Le numéro de licence est requis pour un entraîneur." });
  if ((values.role === "coach" || values.role === "club_admin") && !values.clubId?.trim()) context.addIssue({ code: "custom", path: ["clubId"], message: "Indiquez le club demandé." });
});

type RegistrationValues = z.infer<typeof schema>;
const roleOptions = [{ value: "athlete", label: "Athlète" }, { value: "coach", label: "Entraîneur" }, { value: "club_admin", label: "Admin club" }] as const;

export default function RegistrationPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegistrationValues>({ resolver: zodResolver(schema), defaultValues: { role: "athlete", termsAccepted: false } });
  const role = watch("role");

  async function onSubmit(values: RegistrationValues) {
    setServerError("");
    try {
      const profile = await registerUser(values);
      if (profile.role === "athlete") router.replace("/athlete/dashboard");
      else router.replace(`/pending-approval?role=${profile.role}`);
      router.refresh();
    } catch (error) { setServerError(getFirebaseRegistrationError(error)); }
  }

  return <main className="auth-page registration-page">
    <section className="auth-visual"><div className="auth-overlay" /><Brand /><motion.div className="auth-message" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><span><ShieldCheck /> Rejoignez RowMotion AI</span><h1>Votre progression commence ici.</h1><p>Créez votre espace sécurisé pour analyser votre technique et collaborer avec votre club.</p></motion.div></section>
    <section className="auth-panel"><div className="mobile-brand"><Brand compact /></div><motion.div className="auth-card registration-card" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }}>
      <div className="auth-heading"><span className="auth-icon"><UserRound /></span><h2>Créer votre compte</h2><p>Renseignez vos informations et choisissez votre profil.</p></div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="role-picker registration-roles">{roleOptions.map((option) => <label className={role === option.value ? "selected" : ""} key={option.value}><input type="radio" value={option.value} {...register("role")} /><span>{option.label}</span></label>)}</div>
        <div className="form-grid"><Field label="Prénom" error={errors.firstName?.message}><div className="input-shell"><UserRound /><input placeholder="Mouad" {...register("firstName")} /></div></Field><Field label="Nom" error={errors.lastName?.message}><div className="input-shell"><UserRound /><input placeholder="Nom" {...register("lastName")} /></div></Field></div>
        <Field label="Adresse e-mail" error={errors.email?.message}><div className="input-shell"><Mail /><input type="email" autoComplete="email" placeholder="nom@club.fr" {...register("email")} /></div></Field>
        <Field label="Téléphone (facultatif)" error={errors.phone?.message}><div className="input-shell"><Phone /><input type="tel" placeholder="+212 6 00 00 00 00" {...register("phone")} /></div></Field>
        <div className="form-grid"><Field label="Mot de passe" error={errors.password?.message}><div className="input-shell"><LockKeyhole /><input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="8 caractères minimum" {...register("password")} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></Field><Field label="Confirmation" error={errors.confirmPassword?.message}><div className="input-shell"><LockKeyhole /><input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirmez" {...register("confirmPassword")} /></div></Field></div>
        <div className="form-grid"><Field label={role === "club_admin" ? "Club demandé ou nom du club" : "Club demandé"} error={errors.clubId?.message}><div className="input-shell"><Building2 /><input placeholder={role === "athlete" ? "Facultatif" : "Requis"} {...register("clubId")} /></div></Field>{role !== "club_admin" && <Field label={role === "coach" ? "Numéro de licence" : "Numéro de licence (facultatif)"} error={errors.licenseNumber?.message}><div className="input-shell"><IdCard /><input placeholder={role === "coach" ? "Requis" : "Facultatif"} {...register("licenseNumber")} /></div></Field>}</div>
        {role === "athlete" && <Field label="Coach demandé (facultatif)" error={errors.coachId?.message}><div className="input-shell"><UserRound /><input placeholder="Identifiant ou e-mail du coach" {...register("coachId")} /></div></Field>}
        {role !== "athlete" && <div className="approval-note"><ShieldCheck /> {role === "coach" ? "Votre compte devra être validé par un administrateur de club ou un Super administrateur." : "Votre compte devra être validé par le Super administrateur."}</div>}
        <label className="remember terms-check"><input type="checkbox" {...register("termsAccepted")} /> J’accepte les conditions d’utilisation et la politique de confidentialité.</label>{errors.termsAccepted && <span className="field-error">{errors.termsAccepted.message}</span>}
        {serverError && <div className="auth-error">{serverError}</div>}<button className="submit-button" disabled={isSubmitting}>{isSubmitting ? "Création du compte…" : "Créer mon compte"}</button>
      </form><p className="signup-line">Vous avez déjà un compte ? <a href="/connexion">Se connecter</a></p>
    </motion.div></section>
  </main>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="form-field"><label className="field-label">{label}</label>{children}{error && <span className="field-error">{error}</span>}</div>;
}
