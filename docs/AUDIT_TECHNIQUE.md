# Audit technique RowMotion AI

## Architecture observée

Application Next.js 15 App Router et React 19, TypeScript strict, Firebase Authentication/Firestore/Storage côté navigateur, PWA avec service worker manuel. Les pages métier utilisent des services Firebase. Un nouveau service indépendant `services/biomechanics-api` contient FastAPI, OpenCV, MediaPipe et un worker Firestore.

## Diagnostic initial

Le formulaire créait un document, enregistrait parfois la vidéo uniquement dans IndexedDB, puis affectait directement `processing`. Aucun document `analysisJobs`, aucune route serveur, aucun appel FastAPI et aucun worker n’existaient. La page détail faisait une lecture unique et ne pouvait donc pas afficher une progression. Le moteur navigateur `MediaPipeReadyEngine` était explicitement un point d’intégration vide. Voilà pourquoi le statut restait bloqué et toutes les métriques restaient nulles.

## Problèmes et corrections

- `app/analyses/nouvelle/page.tsx` : validation des métadonnées, Storage obligatoire pour un traitement réel, états `uploaded` puis `queued` et appel sécurisé de la route de traitement.
- `app/analyses/[analysisId]/page.tsx` : abonnement temps réel nettoyé au démontage, progression issue du worker, annulation/reprise et aucune valeur fictive.
- `services/analysis-service.ts` : SDK Firestore temps réel et commandes authentifiées.
- `lib/firebase/client.ts`, `lib/firebase/admin.ts` : séparation client/serveur et initialisation unique.
- `app/api/analyses/[analysisId]/*` : vérification du jeton, rôle/propriété et création transactionnelle du job.
- `public/sw.js` : clone avant cache, cache v2, exclusions API/Firebase/vidéo/admin.
- `services/biomechanics-api` : téléchargement Storage, lecture OpenCV, détection MediaPipe, angles genou/hanche, progression et résultats Firestore.
- `firestore.rules`, `storage.rules`, `firestore.indexes.json` : collections métier, taille vidéo configurable côté UI (limite serveur 500 Mo), formats et index.

## Fonctionnel réel et limites

Réels : upload Storage, job atomique, progression, extraction OpenCV, pose MediaPipe, angles moyens de genou et hanche, échec explicite, annulation coopérative et provenance `biomechanics_engine`.

Non encore implémentés : segmentation complète des neuf phases, analyses avancées skiff/Beach Sprint, multi-rameurs, GPS/Concept2, condition physique UI, QR complet, références mondiales, annotations, rapports PDF et tests Emulator/Playwright. Aucun de ces éléments ne doit être présenté comme opérationnel.

## Variables

Voir `.env.example`. Le frontend exige les variables `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_VIDEO_STORAGE_MODE=firebase`, `NEXT_PUBLIC_MAX_VIDEO_SIZE_MB`, et le serveur Next.js exige les variables `FIREBASE_ADMIN_*`. Le backend exige les cinq variables de son `.env.example`. Les clés privées utilisent des sauts de ligne échappés `\\n`.

## Lancement

`npm install`, puis `npm run dev`. Pour le moteur : créer un environnement Python 3.11, installer `requirements.txt`, lancer `uvicorn app.main:app --reload` depuis `services/biomechanics-api`, puis lancer `python -m app.worker_runner` dans un second processus.

## Déploiement

Déployer Next.js sur Vercel, Firebase Auth/Firestore/Storage avec les règles et index du dépôt, puis construire le Dockerfile sur Cloud Run. Le worker doit être un service persistant ou un Cloud Run Job; aucune analyse longue ne s’exécute dans Vercel.
