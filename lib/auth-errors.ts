import { FirebaseError } from "firebase/app";

const messages: Record<string, string> = {
  "auth/invalid-credential": "Adresse e-mail ou mot de passe incorrect.",
  "auth/user-not-found": "Adresse e-mail ou mot de passe incorrect.",
  "auth/wrong-password": "Adresse e-mail ou mot de passe incorrect.",
  "auth/invalid-email": "L’adresse e-mail n’est pas valide.",
  "auth/user-disabled": "Ce compte a été désactivé.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
  "auth/network-request-failed": "Vérifiez votre connexion Internet.",
  "auth/unauthorized-domain": "Ce domaine n’est pas autorisé dans Firebase Authentication.",
  "auth/operation-not-allowed": "La connexion par e-mail et mot de passe n’est pas activée dans Firebase.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "La clé API Firebase configurée n’est pas valide.",
  "auth/invalid-api-key": "La clé API Firebase configurée n’est pas valide.",
  "auth/internal-error": "Firebase Authentication a rencontré une erreur interne. Réessayez dans quelques instants.",
  "auth/invalid-user-token": "Votre session a expiré. Reconnectez-vous.",
  "auth/user-token-expired": "Votre session a expiré. Reconnectez-vous.",
  unavailable: "Impossible de joindre Firestore. Désactivez temporairement votre bloqueur de contenu puis réessayez.",
  "permission-denied": "Votre compte n’est pas autorisé à lire ce profil.",
  unauthenticated: "Firebase n’a pas pu authentifier cette session.",
  "failed-precondition": "La base Firebase n’est pas encore complètement configurée.",
  "deadline-exceeded": "Firebase met trop de temps à répondre. Réessayez.",
  "resource-exhausted": "Le quota Firebase est temporairement atteint.",
  "invalid-argument": "La requête envoyée à Firebase est invalide.",
};

export function getFirebaseErrorCode(error: unknown): string | null {
  return error instanceof FirebaseError ? error.code : null;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return messages[error.code]
      ?? `Impossible de vous connecter pour le moment. Référence : ${error.code}`;
  }
  if (error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue.";
}
