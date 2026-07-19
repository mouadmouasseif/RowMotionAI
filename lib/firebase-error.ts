import { FirebaseError } from "firebase/app";

const registrationMessages: Record<string, string> = {
  "auth/email-already-in-use": "Cette adresse e-mail possède déjà un compte.",
  "auth/invalid-email": "L’adresse e-mail est invalide.",
  "auth/weak-password": "Le mot de passe est trop faible.",
  "auth/network-request-failed": "Impossible de contacter Firebase. Vérifiez votre connexion.",
  "auth/operation-not-allowed": "L’inscription par e-mail et mot de passe n’est pas activée dans Firebase.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
  "permission-denied": "Firestore refuse l’enregistrement du profil. Vérifiez les règles de sécurité.",
  "unavailable": "Le service Firebase est temporairement indisponible.",
};

export function getFirebaseRegistrationError(error: unknown): string {
  if (error instanceof FirebaseError) return registrationMessages[error.code] ?? "Impossible de créer le compte pour le moment.";
  if (error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue pendant l’inscription.";
}
