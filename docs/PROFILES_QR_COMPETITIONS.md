# Profils, QR et compétitions

## Fonctionnalités opérationnelles

- profil utilisateur complet dans `users/{uid}` ;
- date de naissance, année de début, taille, poids, genre, nationalité et côté dominant ;
- catégorie calculée automatiquement pour la saison courante ;
- catégorie officielle et motif de dérogation modifiables par coach/administration ;
- disciplines multiples `ERGOMETER`, `SKIFF`, `BEACH_ROWING` ;
- photo de profil importable, remplaçable et supprimable ;
- QR opaque ne contenant aucune donnée personnelle ;
- projection limitée dans `qrProfiles/{qrCodeId}` ;
- visibilité public, authentifié, club ou coach ;
- téléchargement, impression, régénération et révocation de l’ancien QR ;
- journalisation des scans authentifiés sans géolocalisation ;
- performances personnelles et résultats de compétition dans `users/{uid}/personalBests` ;
- calendrier des compétitions dans `competitions/{competitionId}`.

## Migration

La source utilisée par l’application est `users`, et non l’ancienne collection `athletes`.

```bash
npm run migrate:athletes:dry
npm run migrate:athletes
```

La migration nécessite Firebase Admin (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`) ou des identifiants Google Application Default Credentials.

## Déploiement Firebase

Le déploiement Vercel ne publie pas automatiquement les règles Firebase. Après validation :

```bash
npm run firebase:deploy:rules
```

Cette commande publie `firestore.rules`, `firestore.indexes.json` et `storage.rules` via `firebase.json`.

## Confidentialité

Le QR contient uniquement `/profiles/scan/{qrCodeId}`. La page lit une projection séparée et n’expose ni e-mail, ni téléphone, ni données non autorisées. Les anciennes URL cessent de fonctionner après régénération.

## Limites

- le recadrage carré interactif et la génération de trois tailles d’image restent à ajouter ;
- la vérification officielle d’une performance est réservée au schéma et nécessite encore un workflow d’approbation dédié ;
- les règles doivent être publiées sur Firebase pour que QR, compétitions et performances fonctionnent en production.
