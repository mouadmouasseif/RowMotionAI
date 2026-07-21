from abc import ABC, abstractmethod
import cv2
import mediapipe as mp
class PoseDetector(ABC):
    @abstractmethod
    def detect(self, frame): ...
    @abstractmethod
    def close(self): ...
class MediaPipePoseDetector(PoseDetector):
    def __init__(self): self.pose=mp.solutions.pose.Pose(static_image_mode=False,model_complexity=1,min_detection_confidence=.55,min_tracking_confidence=.55)
    def detect(self,frame):
        result=self.pose.process(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB))
        if not result.pose_landmarks:return None
        return [(p.x,p.y,p.z,p.visibility) for p in result.pose_landmarks.landmark]
    def close(self): self.pose.close()
