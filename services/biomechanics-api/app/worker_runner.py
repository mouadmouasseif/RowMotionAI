import time,traceback
from firebase_admin import firestore
from .config import settings
from .firebase_service import db,analysis_ref
from .worker import process_analysis
@firestore.transactional
def claim(transaction,ref):
    snap=ref.get(transaction=transaction)
    if not snap.exists or snap.to_dict().get("status")!="queued":return False
    transaction.update(ref,{"status":"processing","lockedBy":settings.worker_id,"lockedAt":firestore.SERVER_TIMESTAMP,"heartbeatAt":firestore.SERVER_TIMESTAMP,"attempts":firestore.Increment(1),"updatedAt":firestore.SERVER_TIMESTAMP});return True
def run_forever():
    while True:
        jobs=db.collection("analysisJobs").where("status","==","queued").limit(5).stream()
        for job in jobs:
            if not claim(db.transaction(),job.reference):continue
            try:process_analysis(job.id);job.reference.update({"status":"completed","updatedAt":firestore.SERVER_TIMESTAMP})
            except InterruptedError:job.reference.update({"status":"failed","errorCode":"CANCELLED","updatedAt":firestore.SERVER_TIMESTAMP})
            except Exception as exc:
                data=job.reference.get().to_dict();dead=data.get("attempts",1)>=data.get("maxAttempts",3);job.reference.update({"status":"dead_letter" if dead else "failed","errorCode":str(exc),"updatedAt":firestore.SERVER_TIMESTAMP});analysis_ref(job.id).update({"status":"failed","progress.status":"failed","progress.errorCode":str(exc),"progress.errorMessage":"Le traitement biomécanique a échoué.","updatedAt":firestore.SERVER_TIMESTAMP});traceback.print_exc()
        time.sleep(3)
if __name__=="__main__":run_forever()
