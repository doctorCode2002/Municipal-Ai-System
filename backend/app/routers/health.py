from __future__ import annotations

from fastapi import APIRouter

from ..services.models import MODEL_LOAD_ERROR

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok" if MODEL_LOAD_ERROR is None else "degraded",
        "model_error": MODEL_LOAD_ERROR,
    }
