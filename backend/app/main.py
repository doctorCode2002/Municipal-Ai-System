from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import startup
from .routers import admin, auth, departments, health, manager, reports

app = FastAPI(title="Municipal AI System", version="1.0.0")

origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    startup()


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(departments.router)
app.include_router(manager.router)
app.include_router(admin.router)
