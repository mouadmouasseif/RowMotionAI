# Audit des erreurs console

## Diagnostic

La recherche exhaustive ne trouve aucun usage de `chrome.runtime`, `chrome.tabs`, `browser.runtime`, `ObjectMultiplex`, `cookieManager` ou `RegisterClientLocalizationsError` dans RowMotion AI. Les messages « Receiving end does not exist », `background-liveness`, `cookieManager.injectClientScript`, `MessageNotSentError` et `RegisterClientLocalizationsError` proviennent donc très probablement de scripts `chrome-extension://` injectés par des extensions. Aucun filtre global, remplacement de `console.error` ou gestionnaire destiné à les masquer n’a été ajouté.

Le problème PWA appartenait à l’application : l’événement `beforeinstallprompt` était intercepté par l’ancien provider, mais son cycle de résultat et les appels concurrents n’étaient pas entièrement gérés. Le composant d’enregistrement du service worker ajoutait aussi des listeners imbriqués sans conserver toutes leurs références pour le nettoyage.

## Corrections applicatives

- `PwaInstallProvider` unique dans `app/layout.tsx` ; aucun listener dans le hook.
- `prompt()` uniquement depuis les boutons après une action utilisateur.
- états `accepted`, `dismissed`, `unavailable`, verrou anti-double-clic et suppression du prompt consommé.
- détection standalone et instruction réservée à Safari iOS.
- singleton `registerServiceWorker()` et nettoyage de tous les listeners du composant.
- validation locale de `next` sur la page de connexion afin de refuser les URL externes et les chemins `//`.
- timers d’authentification annulés au démontage et promesse Analytics munie d’un traitement d’erreur.
- page superadmin `/admin/system/pwa` pour contrôler l’état sans exposer de secret.

## Tests manuels

1. **Chrome normal** : charger l’application, ouvrir la console et relever les URL sources.
2. **Navigation privée** : désactiver l’exécution des extensions en navigation privée, charger l’application et confirmer la disparition de `contentscript.js`.
3. **Profil vierge** : créer un profil Chrome temporaire sans extension et comparer la console.
4. **PWA** : désinstaller l’application, supprimer service worker et données du site, recharger, attendre l’installabilité, cliquer sur Installer et vérifier l’ouverture du prompt.
5. **Refus** : refuser le prompt ; vérifier le message informatif et l’absence de rejet non géré.
6. **Acceptation** : accepter ; vérifier `appinstalled` et la disparition du bouton.
7. **Mobile** : tester Chrome Android, puis Safari iOS et l’instruction Partager → Sur l’écran d’accueil.

## Limites

Chrome décide lui-même quand `beforeinstallprompt` est émis. Il peut rester indisponible si l’application est déjà installée, si les critères PWA ne sont pas satisfaits ou si l’engagement utilisateur est insuffisant. Une application web ne peut ni intercepter ni corriger les erreurs internes d’une extension installée.
