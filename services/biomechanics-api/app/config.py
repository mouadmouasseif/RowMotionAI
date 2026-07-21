from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    api_key: str
    firebase_project_id: str
    firebase_client_email: str
    firebase_private_key: str
    firebase_storage_bucket: str
    worker_id: str = "rowmotion-worker"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
settings = Settings()
