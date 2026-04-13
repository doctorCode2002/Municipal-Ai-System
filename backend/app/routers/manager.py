from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Header, HTTPException

from ..db import get_db
from ..schemas import MetricsItem, ReportItem, StatusUpdateRequest, ReassignRequestCreate
from ..services.auth import get_user_from_token, require_role
from ..services.reports import format_report_row, build_metrics

router = APIRouter(prefix="/api/manager", tags=["manager"])


@router.get("/reports", response_model=list[ReportItem])
def manager_reports(authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"manager"})
    department = user["department"] or ""
    if not department:
        return []
    conn = get_db()
    try:
        rows = conn.execute(
            """
            SELECT id, user_id, title, description, category, location, department, agency, priority,
                   status, created_at, resolution_speed, repeat_pattern
            FROM reports
            WHERE department = ?
            ORDER BY id DESC
            """,
            (department,),
        ).fetchall()
    finally:
        conn.close()
    return [format_report_row(row, include_user=True) for row in rows]


@router.get("/metrics", response_model=list[MetricsItem])
def manager_metrics(authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"manager"})
    department = user["department"] or ""
    if not department:
        return build_metrics(0, 0, None)
    conn = get_db()
    try:
        total = conn.execute(
            "SELECT COUNT(*) AS c FROM reports WHERE department = ?",
            (department,),
        ).fetchone()["c"]
        resolved = conn.execute(
            "SELECT COUNT(*) AS c FROM reports WHERE status = 'Resolved' AND department = ?",
            (department,),
        ).fetchone()["c"]
        avg_row = conn.execute(
            """
            SELECT AVG(julianday('now') - julianday(created_at)) AS avg_days
            FROM reports
            WHERE status = 'Resolved' AND department = ?
            """,
            (department,),
        ).fetchone()
        avg_days = avg_row["avg_days"] if avg_row else None
    finally:
        conn.close()
    return build_metrics(int(total or 0), int(resolved or 0), avg_days)


@router.post("/reports/{report_id}/status", response_model=ReportItem)
def manager_update_status(
    report_id: str, payload: StatusUpdateRequest, authorization: str | None = Header(default=None)
):
    user = get_user_from_token(authorization)
    require_role(user, {"manager"})
    department = user["department"] or ""
    if not department:
        raise HTTPException(status_code=400, detail="Manager department not configured.")

    allowed = {"Pending", "In Progress", "Resolved"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status.")

    report_pk = int(report_id.split("-", 1)[1]) if report_id.upper().startswith("RPT-") else int(report_id)

    conn = get_db()
    try:
        row = conn.execute(
            """
            SELECT id, user_id, title, description, category, location, department, agency, priority,
                   status, created_at, resolution_speed, repeat_pattern
            FROM reports
            WHERE id = ? AND department = ?
            """,
            (report_pk, department),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Report not found for this department.")

        conn.execute(
            "UPDATE reports SET status = ? WHERE id = ?",
            (payload.status, report_pk),
        )
        conn.commit()

        updated = conn.execute(
            """
            SELECT id, user_id, title, description, category, location, department, agency, priority,
                   status, created_at, resolution_speed, repeat_pattern
            FROM reports
            WHERE id = ?
            """,
            (report_pk,),
        ).fetchone()
    finally:
        conn.close()

    return format_report_row(updated, include_user=True)


@router.post("/reports/{report_id}/reassign-request")
def manager_reassign_request(
    report_id: str, payload: ReassignRequestCreate, authorization: str | None = Header(default=None)
):
    user = get_user_from_token(authorization)
    require_role(user, {"manager"})
    department = user["department"] or ""
    if not department:
        raise HTTPException(status_code=400, detail="Manager department not configured.")

    report_pk = int(report_id.split("-", 1)[1]) if report_id.upper().startswith("RPT-") else int(report_id)

    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Reason is required.")

    conn = get_db()
    try:
        report = conn.execute(
            "SELECT id, department FROM reports WHERE id = ?",
            (report_pk,),
        ).fetchone()
        if report is None:
            raise HTTPException(status_code=404, detail="Report not found.")
        if report["department"] != department:
            raise HTTPException(status_code=403, detail="Report not in your department.")

        requested_department = payload.requested_department.strip() if payload.requested_department else None
        if requested_department:
            dept_exists = conn.execute(
                "SELECT id FROM departments WHERE name = ?",
                (requested_department,),
            ).fetchone()
            if not dept_exists:
                raise HTTPException(status_code=400, detail="Requested department does not exist.")

        conn.execute(
            """
            INSERT INTO reassign_requests
            (report_id, manager_id, from_department, requested_department, reason, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?)
            """,
            (
                report_pk,
                int(user["id"]),
                department,
                requested_department,
                reason,
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return {"status": "ok"}
