# Audit initial de RowMotion AI

Date : 20 juillet 2026

## Périmètre examiné

L'audit porte sur l'arborescence Next.js, les routes App Router, les composants React, les types TypeScript, les services Firebase, les règles Firestore et Storage, la PWA, les parcours d'authentification, l'import vidéo et l'abstraction d'analyse de pose.

## Fonctionnalités existantes et réellement connectées

- Application Next.js 15 / React 19 en TypeScript strict.
- Authentification Firebase avec profils `athlete`, `coach`, `club_admin` et `superadmin`.
- Gardes de rôles côté client, complétées par des règles Firestore et Storage.
- Gestion de clubs, coachs, athlètes, associations et notifications.
- Création, consultation, liste et suppression d'analyses dans Firestore.
- Import réel de vidéos MP4, MOV et WebM, validation à 250 Mo, aperçu par URL objet.
- Stockage vidéo dans Firebase Storage lorsqu'il est configuré, sinon conservation locale dans IndexedDB explicitement signalée.
- Capture caméra réelle dans la page d'analyse en direct, choix caméra avant/arrière et arrêt du flux lorsque l'onglet devient invisible.
- Tableau de bord alimenté par les analyses accessibles dans Firestore, sans scores biomécaniques inventés.
- PWA : manifeste, icônes, service worker, installation, mise à jour et page hors ligne.
- Consentement avant activation de la mesure d'audience.

## Fonctionnalités simulées, incomplètes ou uniquement préparées

- `services/pose-analysis/pose-analysis-engine.ts` définit un contrat mais n'intègre aucun modèle MediaPipe, MoveNet ou TensorFlow.js.
- L'analyse en direct enregistre une session et une durée, mais ne calcule ni squelette, ni angle, ni cadence, ni phase de coup.
- Une vidéo importée passe à l'état `processing`, sans worker ni API qui réalise le traitement.
- Les métriques restent à `null`; l'interface le montre correctement et ne les présente pas comme réelles.
- Le rapport actuel est une page de préparation, pas un rapport individuel exportable en PDF.
- Les pages progression et rapports existent sous les routes françaises `/progression` et `/rapports`, mais les routes demandées `/progress` et `/reports/[reportId]` n'existent pas.
- Aucun module complet pour Beach Sprint, risque de blessure, zones d'entraînement, benchmarks ou import physiologique CSV.
- Aucun service d'IA générative ni route serveur `/api/ai/analyze-session`.
- Le script `test` est un contrôle de pages publiques, pas une suite de tests unitaires biomécaniques.

## Erreurs et risques trouvés

| Priorité | Constat | Fichiers concernés | Correction proposée |
| --- | --- | --- | --- |
| Critique | Le moteur de pose ne produit aucune analyse réelle. | `services/pose-analysis/pose-analysis-engine.ts`, `app/analyses/live/page.tsx` | Introduire un contrat de fournisseur, des résultats sourcés (`REAL`, `DEMO`, `MANUAL`) et un message d'indisponibilité explicite; connecter ensuite un fournisseur réel. |
| Critique | Les mises à jour Firestore sont trop génériques côté service; la sécurité dépend entièrement des règles et certains champs coach ne correspondent pas aux clés autorisées pour un athlète. | `services/analysis-service.ts`, `firestore.rules` | Créer des opérations métier ciblées et maintenir une liste de champs autorisés par rôle. |
| Haute | Les règles Storage permettent au propriétaire du chemin de lire une vidéo, mais un coach ou administrateur de club autorisé dans Firestore ne peut pas la lire. | `storage.rules` | Stocker les métadonnées d'autorisation dans un chemin ou document vérifiable, ou fournir des URL signées côté serveur. |
| Haute | Les routes sont protégées principalement après hydratation; il n'existe pas de middleware/session serveur Firebase pour les pages. | `components/RoleGuard.tsx`, layouts de rôles | Ajouter une session serveur sécurisée avant de considérer la protection des pages comme complète. Les règles Firebase restent la barrière effective sur les données. |
| Haute | Le dépôt contient de nombreux textes mojibake (`أ©`, `â€™`, etc.), ce qui dégrade l'interface française et la documentation des règles. | Plusieurs fichiers `app`, `components`, `services`, `firestore.rules` | Normaliser les sources en UTF-8 et corriger les chaînes visibles de façon contrôlée. |
| Haute | Aucun lecteur biomécanique avec FPS manuel, pas-à-pas, marqueurs et synchronisation bidirectionnelle. | Détail d'analyse actuel | Créer `components/video/BiomechanicalVideoPlayer.tsx` et un contexte spécialisé de synchronisation. |
| Moyenne | `AnalysisEnvironment` ne couvre que `boat` et `ergometer`, sans eau calme, côtier et Beach Sprint. | `types/analysis.ts`, formulaires et services | Ajouter le modèle de domaine demandé avec compatibilité des anciennes valeurs. |
| Moyenne | Plusieurs pages contractuelles demandées manquent ou utilisent d'autres noms. | `app/` | Ajouter les routes canoniques ou des redirections compatibles sans supprimer les routes existantes. |
| Moyenne | Le tableau de bord ne gère pas explicitement l'état d'erreur et compte au plus les cinq analyses chargées. | `components/DashboardView.tsx` | Ajouter états loading/error et agrégations dédiées côté données. |
| Moyenne | Les actions asynchrones de note coach et de relance n'affichent pas d'erreur ni d'état de succès. | `app/analyses/[analysisId]/page.tsx` | Ajouter un état de mutation et un retour utilisateur accessible. |
| Moyenne | L'import vidéo n'extrait ni durée ni FPS et ne propose pas de capture directe. | `app/analyses/nouvelle/page.tsx` | Lire les métadonnées du média, permettre la saisie du FPS et ajouter la capture navigateur. |
| Moyenne | La politique PWA doit être vérifiée pour éviter le cache de données sensibles. | `public/sw.js` | Limiter strictement le cache aux ressources statiques publiques et exclure API, Firebase et vidéos. |
| Faible | Plusieurs composants sont très condensés, ce qui limite la maintenabilité. | PWA, pages d'analyse, services | Reformater et extraire la logique métier en hooks/services ciblés. |

## Routes présentes

Les routes principales existantes couvrent notamment `/dashboard`, `/analyses`, `/analyses/nouvelle`, `/analyses/[analysisId]`, `/analyses/live`, `/athletes`, `/coaches`, `/clubs`, `/rapports`, `/progression`, `/parametres` et les espaces dédiés aux rôles.

## Pages ou routes manquantes par rapport à la cible

- `/analyses/new` (équivalent actuel : `/analyses/nouvelle`)
- `/live-analysis` (équivalent actuel : `/analyses/live`)
- `/sessions` et `/sessions/[id]`
- `/reports` et `/reports/[reportId]`
- `/progress` (équivalent actuel : `/progression`)
- `/injury-risk`
- `/training-zones`
- `/benchmarks`
- `/beach-sprint`
- `/settings` (équivalent actuel : `/parametres`)
- `/admin` (équivalent partiel actuel : `/super-admin`)

## Vérifications techniques initiales

- TypeScript strict est activé dans `tsconfig.json`.
- Les usages de `window`, `document`, `navigator` et `localStorage` trouvés sont dans des composants client, des effets ou des fonctions protégées par `typeof window`; aucun accès serveur direct évident n'a été détecté.
- Aucun `href="#"` n'a été identifié dans les fichiers examinés.
- Aucune génération via `Math.random()` n'a été identifiée dans l'application.
- La commande de vérification initiale a été bloquée par la sandbox Windows (`EPERM` lors de la résolution de `C:\Users\mouad`); elle doit être relancée avec l'autorisation adaptée avant le rapport final.
- Le responsive est principalement géré dans `app/globals.css`; une validation visuelle multi-format reste nécessaire.

## Ordre recommandé d'implémentation

1. Stabiliser les scripts, l'encodage, les modèles de domaine, les opérations autorisées et les routes canoniques.
2. Livrer le lecteur vidéo biomécanique réel, les métadonnées FPS et la synchronisation partagée.
3. Ajouter les calculs biomécaniques purs testables (angles, phases) et l'abstraction du fournisseur de pose sans fausses données.
4. Ajouter l'import CSV physiologique et les zones personnalisables.
5. Ajouter le calcul explicable de risque et les questionnaires avec avertissement médical.
6. Ajouter rapports, exports, progression et benchmarks sourcés.
7. Ajouter le domaine et la timeline Beach Sprint.
8. Finaliser PWA, confidentialité, tests, documentation et déploiement.

## Limite structurante

Une analyse biomécanique réelle nécessite un modèle de pose exécuté dans le navigateur ou un service distant, ainsi qu'une configuration Firebase complète. Tant qu'un tel fournisseur n'est pas connecté, l'application doit afficher : « Analyse indisponible – aucune donnée biomécanique réelle calculée. »
