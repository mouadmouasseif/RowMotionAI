# Analyse IA

`PoseAnalysisEngine` est l'abstraction prévue pour MediaPipe, MoveNet, TensorFlow.js ou une API distante. L'implémentation actuelle ne fabrique aucune mesure. Sans fournisseur connecté, l'interface affiche « Analyse indisponible – aucune donnée biomécanique réelle calculée. »

Le service de coach valide sa sortie avec Zod. La route `/api/ai/analyze-session` valide et limite la taille des entrées et refuse proprement de fonctionner sans `AI_API_KEY`. L'appel à un fournisseur, l'authentification serveur, le quota persistant, le timeout et la journalisation structurée restent à connecter avant production.

