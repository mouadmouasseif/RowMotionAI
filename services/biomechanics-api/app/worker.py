import os,tempfile
from firebase_admin import firestore
from .config import settings
from .firebase_service import db,analysis_ref,download_video,update_progress
from .services.analyzer import analyze_video
def process_analysis(analysis_id:str):
    ref=analysis_ref(analysis_id);snap=ref.get()
    if not snap.exists:raise ValueError("ANALYSIS_NOT_FOUND")
    data=snap.to_dict();path=data.get("storagePath")
    if not path:raise ValueError("VIDEO_NOT_AVAILABLE")
    with tempfile.TemporaryDirectory() as folder:
        local=os.path.join(folder,"input-video");update_progress(analysis_id,"video_preprocessing",2);download_video(path,local)
        cancelled=lambda: ref.get().to_dict().get("status")=="cancelled"
        result=analyze_video(local,lambda done,total:update_progress(analysis_id,"pose_detection",5+round(80*done/max(total,1)),done,total),cancelled)
        update_progress(analysis_id,"saving_results",95)
        ref.update({"status":"completed","progress":{"status":"completed","progress":100,"currentStep":"completed","processedFrames":result["sampleCount"],"totalFrames":result["sampleCount"],"completedAt":firestore.SERVER_TIMESTAMP},"metrics.kneeAngle":result["metrics"]["kneeAngle"],"metrics.hipAngle":result["metrics"]["hipAngle"],"metricsSource":"biomechanics_engine","durationSeconds":result["durationSeconds"],"updatedAt":firestore.SERVER_TIMESTAMP})
    return result
