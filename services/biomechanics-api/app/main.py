from fastapi import FastAPI,Header,HTTPException
from pydantic import BaseModel
from .config import settings
from .firebase_service import analysis_ref
from .worker import process_analysis
app=FastAPI(title="RowMotion Biomechanics API",version="1.0.0")
class AnalysisRequest(BaseModel): analysis_id:str
def authorize(value):
    if value!=settings.api_key:raise HTTPException(401,"Invalid API key")
@app.get("/health")
def health():return {"status":"ok","service":"biomechanics-api"}
@app.post("/analyses",status_code=202)
def create(body:AnalysisRequest,x_api_key:str|None=Header(None)):authorize(x_api_key);return {"analysisId":body.analysis_id,"status":"accepted"}
@app.post("/analyses/{analysis_id}/process")
def process(analysis_id:str,x_api_key:str|None=Header(None)):authorize(x_api_key);return process_analysis(analysis_id)
@app.get("/analyses/{analysis_id}")
def get_analysis(analysis_id:str,x_api_key:str|None=Header(None)):
    authorize(x_api_key)
    snap=analysis_ref(analysis_id).get()
    if not snap.exists: raise HTTPException(404,"Not found")
    return snap.to_dict()
@app.post("/analyses/{analysis_id}/cancel")
def cancel(analysis_id:str,x_api_key:str|None=Header(None)):authorize(x_api_key);analysis_ref(analysis_id).update({"status":"cancelled","progress.status":"cancelled"});return {"status":"cancelled"}
