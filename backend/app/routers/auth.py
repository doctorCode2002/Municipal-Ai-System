from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Header, HTTPException

from ..core.security import pwd_context
from ..db import get_db
from ..schemas import AuthResponse, AuthUser, SignInRequest, SignUpRequest
from ..services.auth import create_session, get_user_from_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest):
    conn = get_db()
    try:
        exists = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (payload.username, payload.email),
        ).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="Username or email already exists.")

        hashed = pwd_context.hash(payload.password)
        cursor = conn.execute(
            """
            INSERT INTO users (email, username, password_hash, role, department, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (payload.email, payload.username, hashed, "citizen", None, datetime.utcnow().isoformat()),
        )
        user_id = int(cursor.lastrowid)
        conn.commit()
    finally:
        conn.close()

    token = create_session(user_id)
    user = AuthUser(id=user_id, email=payload.email, username=payload.username, role="citizen", department=None)
    return AuthResponse(token=token, user=user)


@router.post("/signin", response_model=AuthResponse)
def signin(payload: SignInRequest):
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (payload.username,),
        ).fetchone()
    finally:
        conn.close()

    if row is None or not pwd_context.verify(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_session(int(row["id"]))
    user = AuthUser(
        id=int(row["id"]),
        email=row["email"],
        username=row["username"],
        role=row["role"],
        department=row["department"],
    )
    return AuthResponse(token=token, user=user)


@router.get("/me", response_model=AuthUser)
def auth_me(authorization: str | None = Header(default=None)):
    row = get_user_from_token(authorization)
    return AuthUser(
        id=int(row["id"]),
        email=row["email"],
        username=row["username"],
        role=row["role"],
        department=row["department"],
    )


@router.post("/logout")
def logout(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header.")
    token = authorization.split(" ", 1)[1].strip()
    conn = get_db()
    try:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()
    return {"status": "ok"}
