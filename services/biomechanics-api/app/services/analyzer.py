import cv2, numpy as np
from .geometry import calculate_angle
from .pose_detector import MediaPipePoseDetector
def _point(landmarks,index):
    p=landmarks[index];return (p[0],p[1]) if p[3]>=.5 else None
def _midpoint(first,second):
    return ((first[0]+second[0])/2,(first[1]+second[1])/2) if first and second else None
def _back_angle(landmarks):
    shoulders=_midpoint(_point(landmarks,11),_point(landmarks,12));hips=_midpoint(_point(landmarks,23),_point(landmarks,24))
    if not shoulders or not hips:return None
    return float(abs(np.degrees(np.arctan2(shoulders[0]-hips[0],hips[1]-shoulders[1]))))
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
                    samples.append({
                        "time":index/fps,
                        "leftKnee":calculate_angle(_point(landmarks,23),_point(landmarks,25),_point(landmarks,27)),
                        "rightKnee":calculate_angle(_point(landmarks,24),_point(landmarks,26),_point(landmarks,28)),
                        "leftHip":calculate_angle(_point(landmarks,11),_point(landmarks,23),_point(landmarks,25)),
                        "rightHip":calculate_angle(_point(landmarks,12),_point(landmarks,24),_point(landmarks,26)),
                        "leftElbow":calculate_angle(_point(landmarks,11),_point(landmarks,13),_point(landmarks,15)),
                        "rightElbow":calculate_angle(_point(landmarks,12),_point(landmarks,14),_point(landmarks,16)),
                        "leftShoulder":calculate_angle(_point(landmarks,13),_point(landmarks,11),_point(landmarks,23)),
                        "rightShoulder":calculate_angle(_point(landmarks,14),_point(landmarks,12),_point(landmarks,24)),
                        "backAngle":_back_angle(landmarks),
                    })
                processed+=1
                if processed%15==0:progress(index+1,total)
            index+=1
    finally:capture.release();detector.close()
    if len(samples)<5:raise ValueError("NO_ATHLETE_DETECTED")
    values=lambda key:[s[key] for s in samples if s[key] is not None]
    def paired_series(left,right):
        rows=[]
        for sample in samples:
            available=[value for value in (sample[left],sample[right]) if value is not None]
            if available:rows.append({"time":round(sample["time"],2),"value":round(float(np.mean(available)),2)})
        return rows
    def single_series(key):
        return [{"time":round(sample["time"],2),"value":round(float(sample[key]),2)} for sample in samples if sample[key] is not None]
    def mean_series(rows):return float(np.mean([row["value"] for row in rows])) if rows else None
    knee_series=paired_series("leftKnee","rightKnee");hip_series=paired_series("leftHip","rightHip")
    elbow_series=paired_series("leftElbow","rightElbow");shoulder_series=paired_series("leftShoulder","rightShoulder")
    back_series=single_series("backAngle")
    symmetry_series=[{"time":round(sample["time"],2),"value":round(max(0,100-abs(sample["leftKnee"]-sample["rightKnee"])*2),2)} for sample in samples if sample["leftKnee"] is not None and sample["rightKnee"] is not None]
    return {
        "metrics":{
            "kneeAngle":mean_series(knee_series),"hipAngle":mean_series(hip_series),"backAngle":mean_series(back_series),
            "elbowAngle":mean_series(elbow_series),"shoulderAngle":mean_series(shoulder_series),"symmetryScore":mean_series(symmetry_series),
        },
        "timelines":{"kneeAngle":knee_series,"hipAngle":hip_series,"backAngle":back_series,"elbowAngle":elbow_series,"shoulderAngle":shoulder_series,"symmetry":symmetry_series},
        "sampleCount":len(samples),"durationSeconds":total/fps,
    }
