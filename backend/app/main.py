import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.database import Base, SessionLocal, engine
from app.routes.api import router
from app.services.seed import seed_database


app = FastAPI(
    title="FleetIQ API",
    description="AI-powered fleet and asset management demo API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    last_error: Exception | None = None
    for _ in range(20):
        try:
            Base.metadata.create_all(bind=engine)
            with SessionLocal() as db:
                seed_database(db)
            return
        except OperationalError as exc:
            last_error = exc
            time.sleep(1.5)
    if last_error:
        raise last_error


app.include_router(router)
