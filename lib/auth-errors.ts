import { FirebaseError } from "firebase/app";

const messages: Record<string, string> = {
  "auth/invalid-credential": "Adresse e-mail ou mot de passe incorrect.",
  "auth/invalid-email": "L’adresse e-mail n’est pas valide.",
  "auth/user-disabled": "Ce compte a été désactivé.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
  "auth/network-request-failed": "Vérifiez votre connexion Internet.",
  "unavailable": "Impossible de joindre Firestore. Désactivez temporairement votre bloqueur de contenu puis réessayez.",
  "permission-denied": "Votre compte n’est pas autorisé à lire ce profil.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) return messages[error.code] ?? "Impossible de vous connecter pour le moment.";
  if (error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue.";
}
