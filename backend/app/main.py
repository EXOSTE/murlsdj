from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import media, admin, comments

app = FastAPI(title="Mur LSDJ — Une infinité d'histoires", version="1.0.0")

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(media.router)
app.include_router(admin.router)
app.include_router(comments.router)


@app.get("/")
def root():
    return {"status": "ok", "project": "Mur LSDJ"}
