# RowMotion AI

Application Next.js utilisant Firebase Authentication, Firestore et Firebase Storage.

## Configuration Firebase sur Vercel

Ajouter les variables suivantes dans **Vercel → Project Settings → Environment Variables** pour les environnements **Production**, **Preview** et **Development** :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rowmotion-ai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rowmotion-ai
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rowmotion-ai.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

La valeur de `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` doit être exactement `rowmotion-ai.firebasestorage.app`. Elle ne doit pas contenir de préfixe `https://`, `gs://` ni utiliser l’ancien domaine `appspot.com`.

Après toute modification des variables Vercel, lancer un nouveau déploiement. Les vidéos d’analyse restent stockées localement dans le navigateur ; Firebase Storage est utilisé uniquement pour les images autorisées.

## Configuration CORS de Firebase Storage

Le fichier [`firebase-storage-cors.json`](./firebase-storage-cors.json) autorise le domaine de production et les ports locaux. Cette configuration ne peut pas être appliquée par le code Next.js.

Depuis Google Cloud Shell :

```bash
gcloud config set project rowmotion-ai
gcloud storage buckets update \
  gs://rowmotion-ai.firebasestorage.app \
  --cors-file=firebase-storage-cors.json
gcloud storage buckets describe \
  gs://rowmotion-ai.firebasestorage.app \
  --format="default(cors_config)"
```

Alternative avec `gsutil` :

```bash
gsutil cors set firebase-storage-cors.json \
  gs://rowmotion-ai.firebasestorage.app
gsutil cors get \
  gs://rowmotion-ai.firebasestorage.app
```

## Déploiement des règles Firebase

```bash
npm run firebase:deploy:rules
```

Les règles conservent les droits du propriétaire, des gestionnaires autorisés et du superadministrateur. Aucun accès global public en écriture n’est utilisé.

## Diagnostic navigateur

Les erreurs `MessageNotSentError`, `RegisterClientLocalizationsError`, `content_script.js`, `Receiving end does not exist` et `Unchecked runtime.lastError` proviennent généralement d’extensions Chrome. `ERR_BLOCKED_BY_CLIENT` peut également être provoqué par un bloqueur de publicité.

Tester dans une fenêtre privée avec les extensions désactivées pour les distinguer d’une erreur Firebase Storage. Ces messages ne sont pas masqués par l’application.

## Vérifications locales

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```
