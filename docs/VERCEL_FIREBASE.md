# Configuration Firebase sur Vercel

RowMotion AI lit la configuration Firebase au moment du build Next.js. Les variables `NEXT_PUBLIC_*` doivent donc être présentes dans Vercel avant le déploiement.

## Variables requises

Ajoutez les variables suivantes sans guillemets dans **Vercel → Project Settings → Environment Variables** :

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
SUPER_ADMIN_CODE
```

`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` est facultative. `FIREBASE_ADMIN_*` et `SUPER_ADMIN_CODE` sont des variables serveur et ne doivent jamais être renommées avec le préfixe `NEXT_PUBLIC_`.
Pour `FIREBASE_ADMIN_PRIVATE_KEY`, gardez les sauts de ligne sous forme `\n` dans Vercel.

## Environnements

Configurez les valeurs pour :

- Production
- Preview
- Development, si `vercel dev` est utilisé

Après tout ajout ou changement, lancez un nouveau déploiement. Un ancien déploiement ne récupère pas automatiquement les nouvelles variables publiques.

## Vérifications Firebase Console

1. Activez **Authentication → Sign-in method → Email/Password**.
2. Ajoutez le domaine Vercel dans **Authentication → Settings → Authorized domains**.
3. Vérifiez que le document Super Admin utilise `users/{firebaseAuthenticationUid}` avec `role: "SUPER_ADMIN"` et `active: true`.
4. Publiez le contenu de `firestore.rules` dans **Firestore Database → Rules**.

Ne copiez jamais `.env.local` dans Git et ne mettez aucune valeur réelle dans `.env.example`.
