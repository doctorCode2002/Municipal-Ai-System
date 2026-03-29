from __future__ import annotations

import secrets
from datetime import datetime
from typing import Optional
import sqlite3

from fastapi import HTTPException

from ..db import get_db


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO sessions (user_id, token, created_at) VALUES (?, ?, ?)",
            (user_id, token, datetime.utcnow().isoformat()),
        )
        conn.commit()
    finally:
        conn.close()
    return token


def get_user_from_token(auth_header: Optional[str]) -> sqlite3.Row:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header.")
    token = auth_header.split(" ", 1)[1].strip()
    conn = get_db()
    try:
        row = conn.execute(
            """
            SELECT users.*
            FROM sessions
            JOIN users ON sessions.user_id = users.id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=401, detail="Invalid session token.")
        return row
    finally:
        conn.close()


def require_role(user: sqlite3.Row, roles: set[str]) -> None:
    if user["role"] not in roles:
        raise HTTPException(status_code=403, detail="Forbidden for this role.")
