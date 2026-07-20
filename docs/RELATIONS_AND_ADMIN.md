# Relations clubs, coachs et athlètes

Les relations utilisent exclusivement les identifiants de documents Firebase : `clubId` et `coachId`.

## Création de comptes par un administrateur

La page `/club/coachs/nouveau` crée actuellement une invitation dans `coachInvitations`. Elle ne crée volontairement pas le compte Authentication depuis le navigateur, car `createUserWithEmailAndPassword` remplacerait la session de l’administrateur.

Pour finaliser automatiquement les invitations, déployer une Cloud Function ou une route serveur utilisant Firebase Admin SDK. Cette fonction doit vérifier le jeton Firebase de l’appelant, son rôle et son club avant d’appeler `createUser()`. Les identifiants du compte de service doivent rester dans l’environnement serveur et ne jamais être préfixés par `NEXT_PUBLIC_`.

## Migration

Le script `scripts/migrate-user-profiles.mjs` utilise Application Default Credentials. Installer `firebase-admin` uniquement dans l’environnement administratif, définir `GOOGLE_APPLICATION_CREDENTIALS`, puis exécuter d’abord avec `DRY_RUN=true`. Passer `DRY_RUN=false` seulement après contrôle du rapport.

## Images

Les champs `profilePhotoUrl` et `logoUrl` ainsi que les services d’upload sont prêts. Tant que Firebase Storage n’est pas activé, `NEXT_PUBLIC_MEDIA_STORAGE_MODE` doit rester à `local` et l’interface utilise les initiales.
