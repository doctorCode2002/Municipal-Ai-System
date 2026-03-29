from __future__ import annotations

from datetime import datetime
from pathlib import Path
import re
import sqlite3

from .core.constants import AGENCY_TO_DEPARTMENT
from .core.security import pwd_context

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "municipal.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT,
                username TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                department TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                location TEXT NOT NULL,
                department TEXT,
                service_subtype TEXT,
                analysis_neighborhood TEXT,
                police_district TEXT,
                geo_density REAL,
                high_demand_area_flag INTEGER,
                repeat_issue_flag INTEGER,
                agency TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reassign_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                manager_id INTEGER NOT NULL,
                from_department TEXT NOT NULL,
                requested_department TEXT,
                reason TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                resolved_at TEXT,
                FOREIGN KEY(report_id) REFERENCES reports(id),
                FOREIGN KEY(manager_id) REFERENCES users(id)
            )
            """
        )

        columns = {row["name"] for row in conn.execute("PRAGMA table_info(reports)").fetchall()}
        migrations = [
            ("department", "TEXT"),
            ("service_subtype", "TEXT"),
            ("analysis_neighborhood", "TEXT"),
            ("police_district", "TEXT"),
            ("geo_density", "REAL"),
            ("high_demand_area_flag", "INTEGER"),
            ("repeat_issue_flag", "INTEGER"),
        ]
        for name, col_type in migrations:
            if name not in columns:
                conn.execute(f"ALTER TABLE reports ADD COLUMN {name} {col_type}")
        conn.commit()
    finally:
        conn.close()


def ensure_demo_users() -> None:
    demo_users = [
        {"username": "admin", "password": "Admin@12345", "role": "admin", "department": "Admin / 311"},
        {"username": "citizen_ali", "password": "Citizen@123", "role": "citizen", "department": None},
        {"username": "citizen_sara", "password": "Citizen@456", "role": "citizen", "department": None},
    ]
    conn = get_db()
    try:
        for user in demo_users:
            existing = conn.execute(
                "SELECT id FROM users WHERE username = ?",
                (user["username"],),
            ).fetchone()
            if existing:
                continue
            conn.execute(
                """
                INSERT INTO users (email, username, password_hash, role, department, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    None,
                    user["username"],
                    pwd_context.hash(user["password"]),
                    user["role"],
                    user["department"],
                    datetime.utcnow().isoformat(),
                ),
            )
        conn.commit()
    finally:
        conn.close()


def ensure_departments() -> None:
    default_departments = sorted(set(AGENCY_TO_DEPARTMENT.values()))
    conn = get_db()
    try:
        for name in default_departments:
            existing = conn.execute(
                "SELECT id FROM departments WHERE name = ?",
                (name,),
            ).fetchone()
            if existing:
                continue
            conn.execute(
                "INSERT INTO departments (name, created_at) VALUES (?, ?)",
                (name, datetime.utcnow().isoformat()),
            )
        conn.commit()
    finally:
        conn.close()


def fix_department_names() -> None:
    fixes = {
        "Admin / 311d": "Admin / 311",
    }
    conn = get_db()
    try:
        for old, new in fixes.items():
            existing = conn.execute(
                "SELECT id FROM departments WHERE name = ?",
                (new,),
            ).fetchone()
            if existing:
                conn.execute("DELETE FROM departments WHERE name = ?", (old,))
            else:
                conn.execute("UPDATE departments SET name = ? WHERE name = ?", (new, old))
            conn.execute("UPDATE users SET department = ? WHERE department = ?", (new, old))
            conn.execute("UPDATE reports SET department = ? WHERE department = ?", (new, old))
        conn.commit()
    finally:
        conn.close()


def cleanup_legacy_managers() -> None:
    legacy_usernames = ("transport_mgr", "publicworks_mgr", "sanitation_mgr")
    conn = get_db()
    try:
        conn.execute(
            f"DELETE FROM users WHERE role = 'manager' AND username IN ({','.join(['?']*len(legacy_usernames))})",
            legacy_usernames,
        )
        conn.commit()
    finally:
        conn.close()


def ensure_manager_accounts() -> None:
    conn = get_db()
    try:
        departments = conn.execute("SELECT name FROM departments ORDER BY name ASC").fetchall()
        for row in departments:
            name = row["name"]
            if name == "Admin / 311":
                continue
            slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
            username = f"mgr_{slug}"
            password = f"{name.split()[0]}@2026"
            exists = conn.execute(
                "SELECT id FROM users WHERE username = ?",
                (username,),
            ).fetchone()
            if exists:
                continue
            conn.execute(
                """
                INSERT INTO users (email, username, password_hash, role, department, created_at)
                VALUES (?, ?, ?, 'manager', ?, ?)
                """,
                (
                    None,
                    username,
                    pwd_context.hash(password),
                    name,
                    datetime.utcnow().isoformat(),
                ),
            )
        conn.commit()
    finally:
        conn.close()


def backfill_user_departments() -> None:
    department_map = {
        "Administration": "Admin / 311",
        "Transportation": "Transportation & Parking",
        "Sanitation": "Sanitation / Recology",
        "Admin / 311d": "Admin / 311",
    }
    conn = get_db()
    try:
        for old, new in department_map.items():
            conn.execute(
                "UPDATE users SET department = ? WHERE department = ?",
                (new, old),
            )
        conn.commit()
    finally:
        conn.close()


def backfill_departments() -> None:
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT id, agency FROM reports WHERE department IS NULL"
        ).fetchall()
        for row in rows:
            agency = row["agency"]
            department = AGENCY_TO_DEPARTMENT.get(str(agency), "Admin / 311")
            conn.execute(
                "UPDATE reports SET department = ? WHERE id = ?",
                (department, int(row["id"])),
            )
        conn.commit()
    finally:
        conn.close()


def startup() -> None:
    init_db()
    ensure_departments()
    fix_department_names()
    backfill_user_departments()
    backfill_departments()
