from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd

from ..core.constants import SERVICE_NAME_FALLBACK, SERVICE_NAME_MAP
from ..schemas import CategoryResponse, ReportRequest

BASE_DIR = Path(__file__).resolve().parents[2]
TRAINING_DATA_PATH = BASE_DIR / "dataset_with_priority.csv"

M1_MODEL_PATH = BASE_DIR / "m1_department.pkl"
M1_PREP_PATH = BASE_DIR / "m1_preprocessor.pkl"
M2_PIPELINE_PATH = BASE_DIR / "m2_priority.pkl"
M3_MODEL_PATH = BASE_DIR / "m3_resolution.pkl"
M3_PREP_PATH = BASE_DIR / "m3_preprocessor.pkl"
M4_MODEL_PATH = BASE_DIR / "m4_repeat.pkl"
M4_PREP_PATH = BASE_DIR / "m4_preprocessor.pkl"
META_PATH = BASE_DIR / "pipeline_meta.pkl"

M1_MODEL = None
M1_PREP = None
M2_PIPELINE = None
M3_MODEL = None
M3_PREP = None
M4_MODEL = None
M4_PREP = None
PIPELINE_META = None
DF_HISTORICAL: pd.DataFrame | None = None
MODEL_LOAD_ERROR: Optional[str] = None

TRAINING_STATS: dict[str, dict] | None = None


def load_models():
    m1 = joblib.load(M1_MODEL_PATH)
    prep1 = joblib.load(M1_PREP_PATH)
    m2 = joblib.load(M2_PIPELINE_PATH)
    m3 = joblib.load(M3_MODEL_PATH)
    prep3 = joblib.load(M3_PREP_PATH)
    m4 = joblib.load(M4_MODEL_PATH)
    prep4 = joblib.load(M4_PREP_PATH)
    meta = joblib.load(META_PATH)
    df_hist = pd.read_csv(TRAINING_DATA_PATH)

    text_cols = [
        "service_name",
        "service_subtype",
        "analysis_neighborhood",
        "street",
        "police_district",
        "day_of_week",
    ]
    for col in text_cols:
        if col in df_hist.columns:
            df_hist[col] = df_hist[col].astype(str).str.strip()

    return m1, prep1, m2, m3, prep3, m4, prep4, meta, df_hist


try:
    (
        M1_MODEL,
        M1_PREP,
        M2_PIPELINE,
        M3_MODEL,
        M3_PREP,
        M4_MODEL,
        M4_PREP,
        PIPELINE_META,
        DF_HISTORICAL,
    ) = load_models()
except Exception as exc:  # noqa: BLE001
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
    ]
    numeric_cols = [col for col in numeric_cols if col in df.columns]

    stats["global"] = df[numeric_cols].median(numeric_only=True).to_dict()
    stats["service_name"] = (
        df.groupby("service_name")[numeric_cols].median(numeric_only=True).to_dict(orient="index")
        if numeric_cols and "service_name" in df.columns
        else {}
    )
    if "analysis_neighborhood" in df.columns and numeric_cols:
        stats["neighborhood"] = (
            df.groupby("analysis_neighborhood")[numeric_cols]
            .median(numeric_only=True)
            .to_dict(orient="index")
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


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def predict_all(payload: ReportRequest) -> dict:
    if MODEL_LOAD_ERROR is not None:
        raise RuntimeError(MODEL_LOAD_ERROR)

    now = datetime.utcnow()
    service_name = map_service_name(payload)
    service_subtype = (payload.service_subtype or "General").strip() or "General"
    neighborhood = (payload.analysis_neighborhood or "Unknown").strip() or "Unknown"
    police_district = (payload.police_district or "Unknown").strip() or "Unknown"
    street = (payload.location or "Unknown").strip() or "Unknown"
    hour = now.hour
    day_of_week = now.strftime("%A")
    is_weekend = 1 if now.weekday() >= 5 else 0

    if DF_HISTORICAL is not None and not DF_HISTORICAL.empty:
        dh = DF_HISTORICAL

        sn_count = int(dh[dh["service_name"] == service_name].shape[0])
        nb_count = int(
            dh[
                (dh["analysis_neighborhood"] == neighborhood)
                & (dh["service_name"] == service_name)
            ].shape[0]
        )
        st_count = int(
            dh[
                (dh["street"] == street)
                & (dh["service_name"] == service_name)
            ].shape[0]
        )
        dist_count = int(
            dh[
                (dh["police_district"] == police_district)
                & (dh["service_name"] == service_name)
            ].shape[0]
        )
        same_loc = int(
            dh[
                (dh["service_name"] == service_name)
                & (dh["service_subtype"] == service_subtype)
                & (dh["analysis_neighborhood"] == neighborhood)
                & (dh["street"] == street)
            ].shape[0]
        )

        nb_mask = dh["analysis_neighborhood"] == neighborhood
        geo_density = (
            _safe_float(dh.loc[nb_mask, "geo_density"].median(), 1.0)
            if nb_mask.any() and "geo_density" in dh.columns
            else 1.0
        )
        nb_svc_median = (
            _safe_float(dh["neighborhood_service_count"].median(), 0.0)
            if "neighborhood_service_count" in dh.columns
            else 0.0
        )

        high_demand = 1 if nb_count > nb_svc_median else 0
        repeat_flag = 1 if st_count > 1 else 0
    else:
        sn_count = _safe_int(payload.service_name_count, 1)
        nb_count = _safe_int(payload.neighborhood_service_count, 1)
        st_count = _safe_int(payload.street_service_count, 1)
        dist_count = _safe_int(payload.street_service_count, 1)
        same_loc = max(st_count, 1)
        geo_density = _safe_float(payload.geo_density, 1.0)
        high_demand = (
            _safe_int(payload.high_demand_area_flag, 0)
            if payload.high_demand_area_flag is not None
            else (1 if nb_count >= 5 else 0)
        )
        repeat_flag = (
            _safe_int(payload.repeat_issue_flag, 0)
            if payload.repeat_issue_flag is not None
            else (1 if st_count > 1 else 0)
        )

    shared = {
        "service_name": service_name,
        "service_subtype": service_subtype,
        "analysis_neighborhood": neighborhood,
        "police_district": police_district,
        "day_of_week": day_of_week,
        "street": street,
        "request_hour": hour,
        "is_weekend": is_weekend,
        "geo_density": geo_density,
        "high_demand_area_flag": high_demand,
        "repeat_issue_flag": repeat_flag,
        "service_name_count": sn_count,
        "neighborhood_service_count": nb_count,
        "street_service_count": st_count,
        "same_location_count": same_loc,
        "neighborhood_repeat_count": nb_count,
        "street_repeat_count": st_count,
        "district_repeat_count": dist_count,
    }

    r1 = pd.DataFrame(
        [{"service_name": service_name, "service_subtype": service_subtype}],
        columns=["service_name", "service_subtype"],
    )
    department = M1_MODEL.predict(M1_PREP.transform(r1))[0]

    feat2_text = str(PIPELINE_META.get("feat2_text", "problem_text"))
    feat2_count = list(PIPELINE_META.get("feat2_count", []))
    row2 = {feat2_text: f"{service_name} {service_subtype}"}
    row2.update({f: shared.get(f, 0) for f in feat2_count})
    r2 = pd.DataFrame([row2])
    priority = M2_PIPELINE.predict(r2)[0]
    priority_proba = M2_PIPELINE.predict_proba(r2)[0]
    priority_classes = M2_PIPELINE.classes_
    priority_conf = {c: f"{round(float(p) * 100)}%" for c, p in zip(priority_classes, priority_proba)}

    r3 = pd.DataFrame([{f: shared.get(f, 0) for f in PIPELINE_META["feat3"]}])
    prob_fast = float(M3_MODEL.predict_proba(M3_PREP.transform(r3))[0][1])
    is_fast = prob_fast >= 0.4
    resolution_speed = "Fast (≤72h)" if is_fast else "Slow (>72h)"

    r4 = pd.DataFrame([{f: shared.get(f, 0) for f in PIPELINE_META["feat4"]}])
    repeat_pattern = M4_MODEL.predict(M4_PREP.transform(r4))[0]

    return {
        "department": department,
        "priority": priority,
        "priority_conf": priority_conf,
        "resolution_speed": resolution_speed,
        "prob_fast_pct": f"{prob_fast * 100:.0f}%",
        "repeat_pattern": repeat_pattern,
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
