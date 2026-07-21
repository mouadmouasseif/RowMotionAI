import firebase_admin
from firebase_admin import credentials,firestore,storage
from .config import settings
def initialize():
    if not firebase_admin._apps: firebase_admin.initialize_app(credentials.Certificate({"project_id":settings.firebase_project_id,"client_email":settings.firebase_client_email,"private_key":settings.firebase_private_key.replace("\\n","\n"),"token_uri":"https://oauth2.googleapis.com/token"}),{"storageBucket":settings.firebase_storage_bucket})
    return firestore.client()
db=initialize()
def analysis_ref(analysis_id):return db.collection("analyses").document(analysis_id)
def update_progress(analysis_id,step,percent,processed=0,total=0):analysis_ref(analysis_id).update({"status":"processing","progress":{"status":"processing","progress":percent,"currentStep":step,"processedFrames":processed,"totalFrames":total},"updatedAt":firestore.SERVER_TIMESTAMP})
def download_video(storage_path,target):storage.bucket().blob(storage_path).download_to_filename(target)
