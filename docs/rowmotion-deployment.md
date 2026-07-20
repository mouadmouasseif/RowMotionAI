# Déploiement

## Variables

Copier `.env.example` vers `.env.local` et renseigner Firebase. `AI_API_KEY` reste exclusivement serveur. Utiliser `NEXT_PUBLIC_VIDEO_STORAGE_MODE=firebase` pour le stockage cloud après déploiement et validation des règles.

## Contrôles

Exécuter `npm install`, `npm run lint`, `npm run typecheck`, `npm run test` et `npm run build`. Déployer `firestore.rules` et `storage.rules` séparément via Firebase CLI. Vérifier les index Firestore demandés en conditions réelles.

## Production

Configurer HTTPS, App Check, une politique de conservation, consentement et suppression, sauvegardes, journalisation sans données sensibles, surveillance des erreurs et session serveur. Tester caméra et installation PWA sur iOS, Android et ordinateur.
