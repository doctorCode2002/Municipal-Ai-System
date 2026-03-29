from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Header, HTTPException

from ..core.constants import AGENCY_TO_DEPARTMENT
from ..db import get_db
from ..schemas import CategoryRequest, CategoryResponse, ReportItem, ReportRequest, ReportResponse
from ..services.auth import get_user_from_token
from ..services.models import (
    AGENCY_LABEL,
    AGENCY_PIPELINE,
    PRIORITY_LABEL,
    PRIORITY_PIPELINE,
    MODEL_LOAD_ERROR,
    build_features,
    derive_counts,
    predict_category,
    priority_features,
)

router = APIRouter(prefix="/api", tags=["reports"])


def _format_report_row(row) -> ReportItem:
    dept = row["department"] if "department" in row.keys() else None
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
            SELECT id, user_id, title, description, category, location, department, agency, priority, status, created_at
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

    derived = derive_counts(payload)
    payload = payload.model_copy(
        update={
            "geo_density": payload.geo_density or derived["geo_density"],
            "high_demand_area_flag": payload.high_demand_area_flag if payload.high_demand_area_flag is not None else derived["high_demand_area_flag"],
            "repeat_issue_flag": payload.repeat_issue_flag if payload.repeat_issue_flag is not None else derived["repeat_issue_flag"],
            "service_name_count": payload.service_name_count if payload.service_name_count is not None else derived["service_name_count"],
            "neighborhood_service_count": payload.neighborhood_service_count if payload.neighborhood_service_count is not None else derived["neighborhood_service_count"],
            "street_service_count": payload.street_service_count if payload.street_service_count is not None else derived["street_service_count"],
            "agency_request_count": payload.agency_request_count if payload.agency_request_count is not None else derived["agency_request_count"],
        }
    )

    base_df = build_features(payload)
    priority_df = priority_features(base_df)

    try:
        agency_pred = AGENCY_PIPELINE.predict(base_df)
        agency_label = AGENCY_LABEL.inverse_transform(agency_pred)[0]
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Agency prediction failed: {exc}")

    try:
        priority_pred = PRIORITY_PIPELINE.predict(priority_df)
        priority_label = PRIORITY_LABEL.inverse_transform(priority_pred)[0]
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Priority prediction failed: {exc}")

    status = "Routed"
    department = AGENCY_TO_DEPARTMENT.get(str(agency_label), "Admin / 311")

    conn = get_db()
    try:
        cursor = conn.execute(
            """
            INSERT INTO reports (
                user_id, title, description, category, location,
                department,
                service_subtype, analysis_neighborhood, police_district,
                geo_density, high_demand_area_flag, repeat_issue_flag,
                agency, priority, status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                str(agency_label),
                str(priority_label),
                status,
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        report_id = int(cursor.lastrowid)
    finally:
        conn.close()

    return ReportResponse(
        report_id=f"RPT-{report_id:06d}",
        agency=str(agency_label),
        priority=str(priority_label),
        status=status,
        department=department,
    )
