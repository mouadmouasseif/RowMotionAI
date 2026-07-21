# Moteur biomécanique

Le moteur actuel est un MVP réel : OpenCV décode les images et MediaPipe Pose fournit les articulations. `calculate_angle` renvoie `None` si un point manque ou si la géométrie est dégénérée. L’abstraction `PoseDetector` permet de remplacer MediaPipe. Les métriques avancées non calculées restent nulles.
