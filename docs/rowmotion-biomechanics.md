# Biomécanique

Les angles sont calculés de façon déterministe à partir de trois points par `calculateAngle`. Le modèle couvre les landmarks, angles articulaires, frames et quatre phases du coup. Le lecteur biomécanique accepte un FPS manuel et utilise `1 / videoFps` pour le pas image par image.

Le contexte de synchronisation partage temps, frame, lecture, métrique et événement. Une courbe pourra appeler `seek(timestamp, fps)` pour déplacer la vidéo; le lecteur met déjà à jour le temps et la frame dans l'autre sens.

La détection actuelle des phases est une heuristique testable, pas un modèle validé. Elle doit être calibrée sur des séquences annotées avant usage sportif.

