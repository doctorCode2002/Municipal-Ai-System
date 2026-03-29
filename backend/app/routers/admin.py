from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Header, HTTPException

from ..db import get_db
from ..schemas import (
    DepartmentCreateRequest,
    DepartmentItem,
    DepartmentUpdateRequest,
    ManagerCreateRequest,
    ManagerItem,
    ManagerUpdateRequest,
    MetricsItem,
    ReportItem,
    ReassignRequestItem,
)
from ..services.auth import get_user_from_token, require_role
from ..services.reports import build_metrics, format_report_row

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/reports", response_model=list[ReportItem])
def admin_reports(authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    conn = get_db()
    try:
        rows = conn.execute(
            """
            SELECT id, user_id, title, description, category, location, department, agency, priority, status, created_at
            FROM reports
            ORDER BY id DESC
            """
        ).fetchall()
    finally:
        conn.close()
    return [format_report_row(row, include_user=True) for row in rows]


@router.get("/metrics", response_model=list[MetricsItem])
def admin_metrics(authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    conn = get_db()
    try:
        total = conn.execute("SELECT COUNT(*) AS c FROM reports").fetchone()["c"]
        resolved = conn.execute(
            "SELECT COUNT(*) AS c FROM reports WHERE status = 'Resolved'"
        ).fetchone()["c"]
        avg_row = conn.execute(
            """
            SELECT AVG(julianday('now') - julianday(created_at)) AS avg_days
            FROM reports
            WHERE status = 'Resolved'
            """
        ).fetchone()
        avg_days = avg_row["avg_days"] if avg_row else None
    finally:
        conn.close()
    return build_metrics(int(total or 0), int(resolved or 0), avg_days)


@router.get("/managers", response_model=list[ManagerItem])
def admin_managers(authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    conn = get_db()
    try:
        rows = conn.execute(
            """
            SELECT id, email, username, department
            FROM users
            WHERE role = 'manager'
            ORDER BY username ASC
            """
        ).fetchall()
    finally:
        conn.close()
    items: list[ManagerItem] = []
    for row in rows:
        items.append(
            ManagerItem(
                id=int(row["id"]),
                name=row["username"],
                email=row["email"],
                dept=row["department"],
                status="Active",
            )
        )
    return items


@router.post("/managers", response_model=ManagerItem)
def admin_create_manager(payload: ManagerCreateRequest, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    department = payload.department.strip()
    if not department:
        raise HTTPException(status_code=400, detail="Department is required.")

    conn = get_db()
    try:
        dept_exists = conn.execute(
            "SELECT id FROM departments WHERE name = ?", (department,)
        ).fetchone()
        if not dept_exists:
            raise HTTPException(status_code=400, detail="Department does not exist.")

        exists = conn.execute(
            "SELECT id FROM users WHERE username = ?", (payload.username,)
        ).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="Username already exists.")

        from ..core.security import pwd_context

        cursor = conn.execute(
            """
            INSERT INTO users (email, username, password_hash, role, department, created_at)
            VALUES (?, ?, ?, 'manager', ?, ?)
            """,
            (
                payload.email,
                payload.username,
                pwd_context.hash(payload.password),
                department,
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        manager_id = int(cursor.lastrowid)
        row = conn.execute(
            "SELECT id, email, username, department FROM users WHERE id = ?",
            (manager_id,),
        ).fetchone()
    finally:
        conn.close()

    return ManagerItem(
        id=int(row["id"]),
        name=row["username"],
        email=row["email"],
        dept=row["department"],
        status="Active",
    )


@router.put("/managers/{manager_id}", response_model=ManagerItem)
def admin_update_manager(manager_id: int, payload: ManagerUpdateRequest, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})

    conn = get_db()
    try:
        row = conn.execute(
            "SELECT id, email, username, department FROM users WHERE id = ? AND role = 'manager'",
            (manager_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Manager not found.")

        updates = []
        params = []
        if payload.email is not None:
            updates.append("email = ?")
            params.append(payload.email)
        if payload.department is not None:
            dept = payload.department.strip()
            if not dept:
                raise HTTPException(status_code=400, detail="Department is required.")
            dept_exists = conn.execute(
                "SELECT id FROM departments WHERE name = ?", (dept,)
            ).fetchone()
            if not dept_exists:
                raise HTTPException(status_code=400, detail="Department does not exist.")
            updates.append("department = ?")
            params.append(dept)
        if updates:
            params.append(manager_id)
            conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()

        updated = conn.execute(
            "SELECT id, email, username, department FROM users WHERE id = ?",
            (manager_id,),
        ).fetchone()
    finally:
        conn.close()

    return ManagerItem(
        id=int(updated["id"]),
        name=updated["username"],
        email=updated["email"],
        dept=updated["department"],
        status="Active",
    )


@router.delete("/managers/{manager_id}")
def admin_delete_manager(manager_id: int, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    conn = get_db()
    try:
        conn.execute("DELETE FROM users WHERE id = ? AND role = 'manager'", (manager_id,))
        conn.commit()
    finally:
        conn.close()
    return {"status": "ok"}


@router.post("/reports/{report_id}/department", response_model=ReportItem)
def admin_update_report_department(report_id: str, payload: DepartmentUpdateRequest, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    department = payload.department.strip()
    if not department:
        raise HTTPException(status_code=400, detail="Department is required.")

    report_pk = int(report_id.split("-", 1)[1]) if report_id.upper().startswith("RPT-") else int(report_id)

    conn = get_db()
    try:
        dept_exists = conn.execute(
            "SELECT id FROM departments WHERE name = ?", (department,)
        ).fetchone()
        if not dept_exists:
            raise HTTPException(status_code=400, detail="Department does not exist.")

        row = conn.execute(
            """
            SELECT id, user_id, title, description, category, location, department, agency, priority, status, created_at
            FROM reports
            WHERE id = ?
            """,
            (report_pk,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Report not found.")

        conn.execute("UPDATE reports SET department = ? WHERE id = ?", (department, report_pk))
        conn.commit()

        updated = conn.execute(
            """
            SELECT id, user_id, title, description, category, location, department, agency, priority, status, created_at
            FROM reports
            WHERE id = ?
            """,
            (report_pk,),
        ).fetchone()
    finally:
        conn.close()

    return format_report_row(updated, include_user=True)


@router.delete("/reports/{report_id}")
def admin_delete_report(report_id: str, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    report_pk = int(report_id.split("-", 1)[1]) if report_id.upper().startswith("RPT-") else int(report_id)
    conn = get_db()
    try:
        conn.execute("DELETE FROM reports WHERE id = ?", (report_pk,))
        conn.commit()
    finally:
        conn.close()
    return {"status": "ok"}


@router.get("/reassign-requests", response_model=list[ReassignRequestItem])
def admin_reassign_requests(authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    conn = get_db()
    try:
        rows = conn.execute(
            """
            SELECT rr.id, rr.report_id, rr.from_department, rr.requested_department,
                   rr.reason, rr.status, rr.created_at
            FROM reassign_requests rr
            ORDER BY rr.id DESC
            """
        ).fetchall()
    finally:
        conn.close()

    items: list[ReassignRequestItem] = []
    for row in rows:
        items.append(
            ReassignRequestItem(
                id=int(row["id"]),
                report_id=f"RPT-{int(row['report_id']):06d}",
                from_department=row["from_department"],
                requested_department=row["requested_department"],
                reason=row["reason"],
                status=row["status"],
                created_at=row["created_at"],
            )
        )
    return items


@router.post("/reassign-requests/{request_id}/approve")
def admin_approve_reassign(request_id: int, payload: DepartmentUpdateRequest, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    department = payload.department.strip() if payload.department else ""

    conn = get_db()
    try:
        req = conn.execute(
            "SELECT report_id, requested_department FROM reassign_requests WHERE id = ?",
            (request_id,),
        ).fetchone()
        if req is None:
            raise HTTPException(status_code=404, detail="Request not found.")

        if not department:
            department = (req["requested_department"] or "").strip()
        if not department:
            raise HTTPException(status_code=400, detail="Department is required.")

        dept_exists = conn.execute(
            "SELECT id FROM departments WHERE name = ?", (department,)
        ).fetchone()
        if not dept_exists:
            raise HTTPException(status_code=400, detail="Department does not exist.")

        conn.execute("UPDATE reports SET department = ? WHERE id = ?", (department, int(req["report_id"])))
        conn.execute(
            "UPDATE reassign_requests SET status = 'Approved', resolved_at = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), request_id),
        )
        conn.commit()
    finally:
        conn.close()
    return {"status": "ok"}


@router.post("/reassign-requests/{request_id}/reject")
def admin_reject_reassign(request_id: int, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    conn = get_db()
    try:
        conn.execute(
            "UPDATE reassign_requests SET status = 'Rejected', resolved_at = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), request_id),
        )
        conn.commit()
    finally:
        conn.close()
    return {"status": "ok"}


@router.get("/departments", response_model=list[DepartmentItem])
def list_departments(authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    conn = get_db()
    try:
        rows = conn.execute("SELECT id, name FROM departments ORDER BY name ASC").fetchall()
    finally:
        conn.close()
    return [DepartmentItem(id=int(row["id"]), name=row["name"]) for row in rows]


@router.post("/departments", response_model=DepartmentItem)
def create_department(payload: DepartmentCreateRequest, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Department name is required.")

    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM departments WHERE name = ?", (name,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Department already exists.")
        cursor = conn.execute(
            "INSERT INTO departments (name, created_at) VALUES (?, ?)",
            (name, datetime.utcnow().isoformat()),
        )
        conn.commit()
        dept_id = int(cursor.lastrowid)
    finally:
        conn.close()
    return DepartmentItem(id=dept_id, name=name)


@router.put("/departments/{department_id}", response_model=DepartmentItem)
def update_department(department_id: int, payload: DepartmentCreateRequest, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Department name is required.")

    conn = get_db()
    try:
        row = conn.execute("SELECT name FROM departments WHERE id = ?", (department_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Department not found.")
        old_name = row["name"]
        conn.execute("UPDATE departments SET name = ? WHERE id = ?", (name, department_id))
        conn.execute("UPDATE users SET department = ? WHERE department = ?", (name, old_name))
        conn.execute("UPDATE reports SET department = ? WHERE department = ?", (name, old_name))
        conn.commit()
    finally:
        conn.close()

    return DepartmentItem(id=department_id, name=name)


@router.delete("/departments/{department_id}")
def delete_department(department_id: int, authorization: str | None = Header(default=None)):
    user = get_user_from_token(authorization)
    require_role(user, {"admin"})

    conn = get_db()
    try:
        row = conn.execute("SELECT name FROM departments WHERE id = ?", (department_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Department not found.")
        name = row["name"]
        if name == "Admin / 311":
            raise HTTPException(status_code=400, detail="Cannot delete Admin / 311 department.")

        conn.execute("DELETE FROM departments WHERE id = ?", (department_id,))
        conn.execute("UPDATE users SET department = ? WHERE department = ?", ("Admin / 311", name))
        conn.execute("UPDATE reports SET department = ? WHERE department = ?", ("Admin / 311", name))
        conn.commit()
    finally:
        conn.close()

    return {"status": "ok"}
