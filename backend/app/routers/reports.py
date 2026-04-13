from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Header, HTTPException

from ..db import get_db
from ..schemas import CategoryRequest, CategoryResponse, ReportItem, ReportRequest, ReportResponse
from ..services.auth import get_user_from_token
from ..services.models import MODEL_LOAD_ERROR, predict_all, predict_category

router = APIRouter(prefix="/api", tags=["reports"])


def _format_report_row(row) -> ReportItem:
    keys = row.keys()
    dept = row["department"] if "department" in keys else None
    res_speed = row["resolution_speed"] if "resolution_speed" in keys else None
    rep_pattern = row["repeat_pattern"] if "repeat_pattern" in keys else None
    return ReportItem(
        id=int(row["id"]),
        report_id=f"RPT-{int(row['id']):06d}",
        title=row["title"],
        description=row["description"],
        category=row["category"],
        location=row["location"],
        department=dept,
        agency=row["agency"],
        priority=row["priority"],
        status=row["status"],
        created_at=row["created_at"],
        user_id=int(row["user_id"]),
        resolution_speed=res_speed,
        repeat_pattern=rep_pattern,
    )


@router.post("/predict-category", response_model=CategoryResponse)
def predict_category_route(payload: CategoryRequest):
    return predict_category(payload.title, payload.description)


@router.get("/reports", response_model=list[ReportItem])
def list_reports(authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    conn = get_db()
    try:
        rows = conn.execute(
            """
            SELECT id, user_id, title, description, category, location, department, agency, priority,
                   status, created_at, resolution_speed, repeat_pattern
            FROM reports
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (int(user["id"]),),
        ).fetchall()
    finally:
        conn.close()
    return [_format_report_row(row) for row in rows]


@router.post("/report", response_model=ReportResponse)
def create_report(payload: ReportRequest, authorization: str | None = Header(default=None)):
    if MODEL_LOAD_ERROR is not None:
        raise HTTPException(status_code=500, detail=f"Models not loaded: {MODEL_LOAD_ERROR}")

    user = get_user_from_token(authorization)

    try:
        result = predict_all(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    department = str(result["department"])
    priority_label = result["priority"]
    resolution_speed = str(result["resolution_speed"])
    repeat_pattern = str(result["repeat_pattern"])
    status = "Routed"

    conn = get_db()
    try:
        cursor = conn.execute(
            """
            INSERT INTO reports (
                user_id, title, description, category, location,
                department,
                service_subtype, analysis_neighborhood, police_district,
                geo_density, high_demand_area_flag, repeat_issue_flag,
                agency, priority, status, created_at,
                resolution_speed, repeat_pattern
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(user["id"]),
                payload.title,
                payload.description,
                payload.category,
                payload.location,
                department,
                payload.service_subtype,
                payload.analysis_neighborhood,
                payload.police_district,
                payload.geo_density,
                payload.high_demand_area_flag,
                payload.repeat_issue_flag,
                department,
                str(priority_label),
                status,
                datetime.utcnow().isoformat(),
                resolution_speed,
                repeat_pattern,
            ),
        )
        conn.commit()
        report_id = int(cursor.lastrowid)
    finally:
        conn.close()

    return ReportResponse(
        report_id=f"RPT-{report_id:06d}",
        agency=department,
        priority=str(priority_label),
        status=status,
        department=department,
        resolution_speed=resolution_speed,
        repeat_pattern=repeat_pattern,
    )
