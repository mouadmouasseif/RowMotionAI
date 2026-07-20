# Architecture RowMotion AI

L'application conserve App Router et Firebase. Les pages et composants orchestrent l'interface; `services/` porte les accès aux données et fournisseurs externes; `lib/analysis/` contient les calculs purs; `types/` constitue le contrat de domaine. Les données biomécaniques utilisent toujours une provenance `REAL`, `DEMO` ou `MANUAL`.

La sécurité repose sur trois couches : garde de navigation, validation des opérations métier, règles Firestore/Storage. La garde client n'est pas une barrière de sécurité. Une future session serveur Firebase est requise pour protéger également le rendu des pages côté serveur.

Les vidéos sont privées par défaut, stockées dans Firebase Storage ou explicitement en local dans IndexedDB. Le service worker n'intercepte ni API ni vidéo.

