import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .api.demo import router as demo_router

app = FastAPI(title="OceanWatch AI", description="Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(demo_router, prefix="/api")

# Static assets
os.makedirs("artifacts/demo/ennore", exist_ok=True)
os.makedirs("data/demo/ennore", exist_ok=True)
app.mount("/api/assets/artifacts", StaticFiles(directory="artifacts"), name="artifacts")
app.mount("/api/assets/data", StaticFiles(directory="data"), name="data")

@app.get("/")
def health():
    return {"status": "ok"}
