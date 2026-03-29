from __future__ import annotations

from fastapi import APIRouter, Header

from ..db import get_db
from ..schemas import DepartmentItem
from ..services.auth import get_user_from_token

router = APIRouter(prefix="/api", tags=["departments"])


@router.get("/departments", response_model=list[DepartmentItem])
def list_departments(authorization: str | None = Header(default=None)):
    get_user_from_token(authorization)
    conn = get_db()
    try:
        rows = conn.execute("SELECT id, name FROM departments ORDER BY name ASC").fetchall()
    finally:
        conn.close()
    return [DepartmentItem(id=int(row["id"]), name=row["name"]) for row in rows]
