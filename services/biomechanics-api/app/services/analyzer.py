import cv2, numpy as np
from .geometry import calculate_angle
from .pose_detector import MediaPipePoseDetector
def _point(landmarks,index):
    p=landmarks[index];return (p[0],p[1]) if p[3]>=.5 else None
def analyze_video(path:str,progress,cancelled):
    capture=cv2.VideoCapture(path)
    if not capture.isOpened():raise ValueError("VIDEO_UNREADABLE")
    total=int(capture.get(cv2.CAP_PROP_FRAME_COUNT));fps=capture.get(cv2.CAP_PROP_FPS)
    if total<=0 or fps<=0:raise ValueError("VIDEO_METADATA_INVALID")
    detector=MediaPipePoseDetector();samples=[];processed=0;stride=max(1,round(fps/15))
    try:
        index=0
        while True:
            ok,frame=capture.read()
            if not ok:break
            if cancelled():raise InterruptedError("CANCELLED")
            if index%stride==0:
                landmarks=detector.detect(frame)
                if landmarks:
                    samples.append({"time":index/fps,"leftKnee":calculate_angle(_point(landmarks,23),_point(landmarks,25),_point(landmarks,27)),"rightKnee":calculate_angle(_point(landmarks,24),_point(landmarks,26),_point(landmarks,28)),"leftHip":calculate_angle(_point(landmarks,11),_point(landmarks,23),_point(landmarks,25)),"rightHip":calculate_angle(_point(landmarks,12),_point(landmarks,24),_point(landmarks,26))})
                processed+=1
                if processed%15==0:progress(index+1,total)
            index+=1
    finally:capture.release();detector.close()
    if len(samples)<5:raise ValueError("NO_ATHLETE_DETECTED")
    values=lambda key:[s[key] for s in samples if s[key] is not None]
    knee=values("leftKnee")+values("rightKnee");hip=values("leftHip")+values("rightHip")
    return {"metrics":{"kneeAngle":float(np.mean(knee)) if knee else None,"hipAngle":float(np.mean(hip)) if hip else None},"sampleCount":len(samples),"durationSeconds":total/fps}
