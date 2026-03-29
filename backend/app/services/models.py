from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

from ..core.constants import HIGH_RISK_SERVICES, SERVICE_NAME_FALLBACK, SERVICE_NAME_MAP
from ..db import get_db
from ..schemas import ReportRequest, CategoryResponse

BASE_DIR = Path(__file__).resolve().parents[2]
TRAINING_DATA_PATH = BASE_DIR / "sf311_ready_for_modeling.csv"

AGENCY_MODEL_PATH = BASE_DIR / "agency_routing_pipeline_xgb_2025_v2.pkl"
AGENCY_LABEL_PATH = BASE_DIR / "agency_label_encoder_2025_v2.pkl"
PRIORITY_MODEL_PATH = BASE_DIR / "priority_xgb_v2025.pkl"
PRIORITY_LABEL_PATH = BASE_DIR / "priority_encoder.pkl"

TRAINING_STATS: dict[str, dict] | None = None


def load_models():
    if not AGENCY_MODEL_PATH.exists() or not AGENCY_LABEL_PATH.exists():
        raise FileNotFoundError("Agency model files not found in backend directory.")
    if not PRIORITY_MODEL_PATH.exists() or not PRIORITY_LABEL_PATH.exists():
        raise FileNotFoundError("Priority model files not found in backend directory.")

    agency_pipeline = joblib.load(AGENCY_MODEL_PATH)
    agency_label = joblib.load(AGENCY_LABEL_PATH)
    priority_pipeline = joblib.load(PRIORITY_MODEL_PATH)
    priority_label = joblib.load(PRIORITY_LABEL_PATH)
    return agency_pipeline, agency_label, priority_pipeline, priority_label


try:
    AGENCY_PIPELINE, AGENCY_LABEL, PRIORITY_PIPELINE, PRIORITY_LABEL = load_models()
    MODEL_LOAD_ERROR: Optional[str] = None
except Exception as exc:  # noqa: BLE001
    AGENCY_PIPELINE = None
    AGENCY_LABEL = None
    PRIORITY_PIPELINE = None
    PRIORITY_LABEL = None
    MODEL_LOAD_ERROR = str(exc)


@pd.api.extensions.register_dataframe_accessor("safe")
class _SafeAccessor:
    def __init__(self, pandas_obj):
        self._obj = pandas_obj

    def fill_or_default(self, column: str, value):
        if column not in self._obj.columns:
            self._obj[column] = value
        else:
            self._obj[column] = self._obj[column].fillna(value)
        return self._obj


def load_training_stats() -> None:
    global TRAINING_STATS
    if TRAINING_STATS is not None:
        return
    if not TRAINING_DATA_PATH.exists():
        TRAINING_STATS = {}
        return

    df = pd.read_csv(TRAINING_DATA_PATH)
    stats: dict[str, dict] = {}

    numeric_cols = [
        "geo_density",
        "high_demand_area_flag",
        "repeat_issue_flag",
        "service_name_count",
        "neighborhood_service_count",
        "street_service_count",
        "agency_request_count",
    ]

    stats["global"] = df[numeric_cols].median(numeric_only=True).to_dict()
    stats["service_name"] = (
        df.groupby("service_name")[numeric_cols].median(numeric_only=True).to_dict(orient="index")
    )
    if "analysis_neighborhood" in df.columns:
        stats["neighborhood"] = (
            df.groupby("analysis_neighborhood")[numeric_cols].median(numeric_only=True).to_dict(orient="index")
        )
    else:
        stats["neighborhood"] = {}

    TRAINING_STATS = stats


def normalize_category(category: str) -> str:
    key = (category or "").strip().lower()
    return SERVICE_NAME_MAP.get(key, category.strip() or "Other")


def map_service_name(payload: ReportRequest) -> str:
    text = f"{payload.service_subtype or ''} {payload.title} {payload.description}".lower()
    keyword_map = [
        ("graffiti", "Graffiti"),
        ("encamp", "Encampments"),
        ("streetlight", "Streetlights"),
        ("sewer", "Sewer Issues"),
        ("tree", "Tree Maintenance"),
        ("sign", "Sign Repair"),
        ("abandoned vehicle", "Abandoned Vehicle"),
        ("litter", "Litter Receptacles"),
        ("trash", "Litter Receptacles"),
        ("bin", "Litter Receptacles"),
        ("noise", "Noise Report"),
        ("parking", "Parking Enforcement"),
        ("illegal posting", "Illegal Postings"),
        ("damaged property", "Damaged Property"),
    ]
    for keyword, service in keyword_map:
        if keyword in text:
            return service

    key = (payload.category or "").strip().lower()
    return SERVICE_NAME_FALLBACK.get(key, normalize_category(payload.category))


def build_features(payload: ReportRequest) -> pd.DataFrame:
    now = datetime.utcnow()
    service_name = map_service_name(payload)

    data = {
        "service_name": service_name,
        "service_subtype": payload.service_subtype or "General",
        "analysis_neighborhood": payload.analysis_neighborhood or "Unknown",
        "police_district": payload.police_district or "Unknown",
        "request_hour": now.hour,
        "day_of_week": now.strftime("%A"),
        "is_weekend": 1 if now.weekday() >= 5 else 0,
        "request_month": now.month,
        "geo_density": payload.geo_density if payload.geo_density is not None else 5.0,
        "high_demand_area_flag": payload.high_demand_area_flag if payload.high_demand_area_flag is not None else 0,
        "repeat_issue_flag": payload.repeat_issue_flag if payload.repeat_issue_flag is not None else 0,
        "service_name_count": payload.service_name_count if payload.service_name_count is not None else 1,
        "neighborhood_service_count": payload.neighborhood_service_count if payload.neighborhood_service_count is not None else 1,
        "street_service_count": payload.street_service_count if payload.street_service_count is not None else 1,
        "agency_request_count": payload.agency_request_count if payload.agency_request_count is not None else 1,
    }

    df = pd.DataFrame([data])
    df.safe.fill_or_default("service_name", "Other")
    return df


def priority_features(base_df: pd.DataFrame) -> pd.DataFrame:
    df = base_df.copy()
    service_name = str(df.loc[0, "service_name"]).strip()
    high_risk_flag = 1 if service_name in HIGH_RISK_SERVICES else 0
    priority_score = (
        40 * high_risk_flag
        + 22 * df.loc[0, "high_demand_area_flag"]
        + 18 * df.loc[0, "repeat_issue_flag"]
        + 12 * np.clip(df.loc[0, "geo_density"], 1, 10) / 10
        + 8 * df.loc[0, "is_weekend"]
    )

    df["high_risk_flag"] = high_risk_flag
    df["priority_score"] = priority_score
    return df


def derive_counts(payload: ReportRequest) -> dict:
    load_training_stats()
    stats = TRAINING_STATS or {}
    global_stats = stats.get("global", {})
    service_stats = stats.get("service_name", {})
    neighborhood_stats = stats.get("neighborhood", {})

    conn = get_db()
    try:
        total = conn.execute("SELECT COUNT(*) AS c FROM reports").fetchone()["c"]
        service_count = conn.execute(
            "SELECT COUNT(*) AS c FROM reports WHERE category = ?",
            (payload.category,),
        ).fetchone()["c"]
        neighborhood_count = 0
        if payload.analysis_neighborhood:
            neighborhood_count = conn.execute(
                """
                SELECT COUNT(*) AS c FROM reports
                WHERE analysis_neighborhood = ? AND category = ?
                """,
                (payload.analysis_neighborhood, payload.category),
            ).fetchone()["c"]

        street_count = 0
        if payload.location:
            street_count = conn.execute(
                "SELECT COUNT(*) AS c FROM reports WHERE location = ?",
                (payload.location,),
            ).fetchone()["c"]

        repeat_flag = 1 if street_count > 0 else 0
        high_demand = 1 if neighborhood_count >= 5 else 0
        geo_density = min(max(neighborhood_count + 1, 1), 10)
    finally:
        conn.close()

    db_size = int(total or 0)
    service_name = normalize_category(payload.category)
    service_prior = service_stats.get(service_name, {})
    neighborhood_prior = neighborhood_stats.get(payload.analysis_neighborhood or "", {})

    def _prior_value(key: str) -> float:
        if key in neighborhood_prior:
            return float(neighborhood_prior[key])
        if key in service_prior:
            return float(service_prior[key])
        return float(global_stats.get(key, 1))

    if db_size < 20:
        service_count = max(service_count, int(_prior_value("service_name_count")))
        neighborhood_count = max(neighborhood_count, int(_prior_value("neighborhood_service_count")))
        street_count = max(street_count, int(_prior_value("street_service_count")))
        total = max(total, int(_prior_value("agency_request_count")))
        if repeat_flag == 0:
            repeat_flag = int(round(_prior_value("repeat_issue_flag")))
        if high_demand == 0:
            high_demand = int(round(_prior_value("high_demand_area_flag")))
        geo_density = float(_prior_value("geo_density"))

    return {
        "service_name_count": int(service_count or 0) + 1,
        "neighborhood_service_count": int(neighborhood_count or 0) + 1,
        "street_service_count": int(street_count or 0) + 1,
        "agency_request_count": int(total or 0) + 1,
        "repeat_issue_flag": repeat_flag,
        "high_demand_area_flag": high_demand,
        "geo_density": float(geo_density),
    }


def predict_category(title: str, description: str) -> CategoryResponse:
    text = f"{title} {description}".lower()
    rules = [
        ("infrastructure", ["pothole", "road", "bridge", "street", "sidewalk", "crack", "sign", "traffic", "asphalt"]),
        ("sanitation", ["garbage", "trash", "waste", "dump", "litter", "bin", "recycling", "sewer", "odor"]),
        ("parks", ["park", "tree", "playground", "grass", "trail", "garden", "bench"]),
        ("safety", ["crime", "police", "unsafe", "assault", "theft", "vandal", "graffiti", "gun", "violence"]),
        ("utilities", ["water", "leak", "pipe", "electric", "power", "light", "streetlight", "gas", "drain"]),
    ]

    for category, keywords in rules:
        if any(keyword in text for keyword in keywords):
            return CategoryResponse(category=category, confidence=0.72)

    return CategoryResponse(category="other", confidence=0.4)
