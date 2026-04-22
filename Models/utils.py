"""
ml/utils.py
===========
Shared helpers used by all four CivicMind models.

  - load_and_prepare : load CSV and engineer all derived columns
  - make_preprocessor: build a ColumnTransformer (OHE + StandardScaler)
  - get_cols         : filter a column list to only those present in df
"""

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder


# ─────────────────────────────────────────────────────────────
# DATA LOADING & FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────
def load_and_prepare(csv_path: str) -> pd.DataFrame:
    """
    Load the raw CSV and compute all derived columns needed
    across the four models.  The original CSV is never modified.

    Derived columns added
    ─────────────────────
    problem_text          : service_name + ' ' + service_subtype  (for TF-IDF)
    same_location_count   : repeat count at exact (service, subtype, neighborhood, street)
    neighborhood_repeat_count : repeat count at (neighborhood, service)
    street_repeat_count   : repeat count at (street, service)
    district_repeat_count : repeat count at (police_district, service)
    repeat_request_count  : alias of same_location_count
    repeat_class          : discretised repeat target → 'once' / 'twice' / '3+ times'
    is_fast               : 1 if resolution_time_hours ≤ 72, else 0
    """
    df = pd.read_csv(csv_path)

    # ── 1. Clean text columns ────────────────────────────────
    text_cols = [
        "service_name", "service_subtype", "analysis_neighborhood",
        "street", "police_district", "day_of_week",
    ]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # ── 2. NLP feature (Model 2) ─────────────────────────────
    df["problem_text"] = (
        df["service_name"].astype(str) + " " + df["service_subtype"].astype(str)
    )

    # ── 3. Repeat / count features (Models 2 & 4) ───────────
    df["same_location_count"] = df.groupby(
        ["service_name", "service_subtype", "analysis_neighborhood", "street"]
    )["service_name"].transform("count")

    df["neighborhood_repeat_count"] = df.groupby(
        ["analysis_neighborhood", "service_name"]
    )["service_name"].transform("count")

    df["street_repeat_count"] = df.groupby(
        ["street", "service_name"]
    )["service_name"].transform("count")

    df["district_repeat_count"] = df.groupby(
        ["police_district", "service_name"]
    )["service_name"].transform("count")

    df["repeat_request_count"] = df["same_location_count"]

    # ── 4. Repeat class target (Model 4) ─────────────────────
    def _count_to_class(c):
        if c == 1:   return "once"
        elif c == 2: return "twice"
        else:        return "3+ times"

    df["repeat_class"] = df["repeat_request_count"].apply(_count_to_class)

    # ── 5. Resolution speed target (Model 3) ─────────────────
    df["is_fast"] = (df["resolution_time_hours"] <= 72).astype(int)

    return df


# ─────────────────────────────────────────────────────────────
# PREPROCESSOR FACTORY
# ─────────────────────────────────────────────────────────────
def make_preprocessor(cat_cols: list, num_cols: list) -> ColumnTransformer:
    """
    Build a ColumnTransformer that:
      - OneHotEncodes categorical columns (unknown categories → ignored)
      - Median-imputes + StandardScales numerical columns

    Parameters
    ----------
    cat_cols : list of str  — categorical feature names
    num_cols : list of str  — numerical  feature names

    Returns
    -------
    ColumnTransformer (not yet fitted)
    """
    transformers = []

    if cat_cols:
        transformers.append((
            "cat",
            Pipeline([
                ("imp", SimpleImputer(strategy="constant", fill_value="missing")),
                ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
            ]),
            cat_cols,
        ))

    if num_cols:
        transformers.append((
            "num",
            Pipeline([
                ("imp", SimpleImputer(strategy="median")),
                ("scl", StandardScaler()),
            ]),
            num_cols,
        ))

    return ColumnTransformer(transformers=transformers)


# ─────────────────────────────────────────────────────────────
# COLUMN FILTER
# ─────────────────────────────────────────────────────────────
def get_cols(cols: list, df: pd.DataFrame) -> list:
    """Return only the column names from `cols` that exist in `df`."""
    return [c for c in cols if c in df.columns]
