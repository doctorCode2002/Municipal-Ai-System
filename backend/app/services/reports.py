from __future__ import annotations

from typing import Optional
from .models import MODEL_LOAD_ERROR
from ..schemas import MetricsItem, ReportItem


def format_report_row(row, include_user: bool = False) -> ReportItem:
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
        user_id=int(row["user_id"]) if include_user else None,
    )


def build_metrics(total: int, resolved: int, avg_days: Optional[float]) -> list[MetricsItem]:
    avg_text = f"{avg_days:.1f} Days" if avg_days is not None else "--"
    accuracy = "N/A"
    return [
        MetricsItem(
            title="Total Reports",
            value=str(total),
            change="",
            icon="FileText",
            color="text-blue-400",
            bg="bg-blue-500/10",
            border="border-blue-500/20",
        ),
        MetricsItem(
            title="Resolved",
            value=str(resolved),
            change="",
            icon="CheckCircle2",
            color="text-emerald-400",
            bg="bg-emerald-500/10",
            border="border-emerald-500/20",
        ),
        MetricsItem(
            title="Avg. Resolution Time",
            value=avg_text,
            change="",
            icon="Clock",
            color="text-amber-400",
            bg="bg-amber-500/10",
            border="border-amber-500/20",
        ),
        MetricsItem(
            title="AI Accuracy",
            value=accuracy,
            change="",
            icon="Activity",
            color="text-purple-400",
            bg="bg-purple-500/10",
            border="border-purple-500/20",
        ),
    ]
