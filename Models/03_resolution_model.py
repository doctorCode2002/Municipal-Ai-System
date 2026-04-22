"""
ml/03_resolution_model.py
=========================
Model 3 — Resolution Speed Prediction
──────────────────────────────────────
Task        : Binary classification
Algorithm   : Random Forest Classifier
Input       : 13 categorical + numerical features (all service types)
Output      : Fast (≤ 72 h) or Slow (> 72 h)
ROC-AUC     : 0.817   |   Slow-class Recall : 81%

Why ROC-AUC instead of Accuracy?
─────────────────────────────────
  Class imbalance: 70.4 % Fast / 29.6 % Slow.
  A trivial "predict Fast always" classifier achieves 70.4 % accuracy —
  meaningless. ROC-AUC measures real discriminative power.

Three fixes applied vs the original version
───────────────────────────────────────────
  1. Trained on ALL service types (not just "Street & Sidewalk Cleaning")
  2. class_weight = {0: 10, 1: 1}  — penalises Slow misclassification 10×
  3. Decision threshold = 0.4       — more conservative → higher Slow Recall
     (Slow Recall improved from 0 % → 81 %)

Usage
─────
  python 03_resolution_model.py                # train + evaluate + save
  python 03_resolution_model.py --predict      # load + predict examples
  python 03_resolution_model.py --threshold 0.35   # custom threshold
"""

import argparse
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, classification_report,
    roc_auc_score, confusion_matrix,
)

from utils import load_and_prepare, make_preprocessor, get_cols

# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────
TARGET     = "is_fast"
MODEL_PATH = "saved_models/m3_resolution.pkl"
PREP_PATH  = "saved_models/m3_preprocessor.pkl"
META_PATH  = "saved_models/m3_meta.pkl"

THRESHOLD  = 0.4   # prob(Fast) must exceed this to be labelled Fast

CAT_FEATURES = [
    "service_name", "service_subtype",
    "analysis_neighborhood", "police_district", "day_of_week",
]
NUM_FEATURES = [
    "request_hour", "is_weekend", "geo_density",
    "high_demand_area_flag", "repeat_issue_flag",
    "service_name_count", "neighborhood_service_count", "street_service_count",
]

HYPERPARAMS = dict(
    n_estimators = 300,
    max_depth    = 15,
    class_weight = {0: 10, 1: 1},   # 10× penalty for missing a Slow complaint
    random_state = 42,
    n_jobs       = -1,
)


# ─────────────────────────────────────────────────────────────
# TRAINING
# ─────────────────────────────────────────────────────────────
def train(csv_path: str, threshold: float = THRESHOLD) -> tuple:
    """Train the resolution-speed classifier and return (model, preprocessor, meta)."""
    print("=" * 60)
    print("MODEL 3 — Resolution Speed Prediction")
    print("=" * 60)

    # ── 1. Prepare ───────────────────────────────────────────
    df       = load_and_prepare(csv_path)
    num_feat = get_cols(NUM_FEATURES, df)
    features = CAT_FEATURES + num_feat

    df3 = df.dropna(subset=CAT_FEATURES).copy()
    X   = df3[features]
    y   = df3[TARGET]

    fast_n = int(y.sum())
    slow_n = int((y == 0).sum())
    print(f"\nDataset size : {len(df3)} records  (all service types)")
    print(f"Class balance: Fast={fast_n} ({fast_n/len(y):.1%})  "
          f"Slow={slow_n} ({slow_n/len(y):.1%})")
    print(f"Decision threshold : {threshold}")

    # ── 2. Split ─────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── 3. Preprocess ────────────────────────────────────────
    preprocessor = make_preprocessor(CAT_FEATURES, num_feat)
    X_train_p    = preprocessor.fit_transform(X_train)
    X_test_p     = preprocessor.transform(X_test)

    # ── 4. Train ─────────────────────────────────────────────
    model = RandomForestClassifier(**HYPERPARAMS)
    model.fit(X_train_p, y_train)
    print("\n✓ Model trained")

    # ── 5. Evaluate with custom threshold ────────────────────
    y_prob = model.predict_proba(X_test_p)[:, 1]   # P(Fast)
    y_pred = (y_prob >= threshold).astype(int)

    auc = roc_auc_score(y_test, y_prob)
    acc = accuracy_score(y_test, y_pred)

    print(f"\nROC-AUC  : {auc:.3f}")
    print(f"Accuracy : {acc:.2%}  (threshold={threshold})\n")
    print(classification_report(
        y_test, y_pred, target_names=["Slow >72h", "Fast ≤72h"], zero_division=0
    ))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    meta = {
        "features"  : features,
        "cat_feat"  : CAT_FEATURES,
        "num_feat"  : num_feat,
        "threshold" : threshold,
        "roc_auc"   : auc,
    }
    return model, preprocessor, meta


# ─────────────────────────────────────────────────────────────
# SAVE / LOAD
# ─────────────────────────────────────────────────────────────
def save(model, preprocessor, meta):
    import os
    os.makedirs("saved_models", exist_ok=True)
    joblib.dump(model,        MODEL_PATH)
    joblib.dump(preprocessor, PREP_PATH)
    joblib.dump(meta,         META_PATH)
    print(f"\n✓ Saved → {MODEL_PATH}")
    print(f"✓ Saved → {PREP_PATH}")
    print(f"✓ Saved → {META_PATH}")


def load():
    model        = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREP_PATH)
    meta         = joblib.load(META_PATH)
    return model, preprocessor, meta


# ─────────────────────────────────────────────────────────────
# PREDICT
# ─────────────────────────────────────────────────────────────
def predict(complaint_features: dict,
            model=None, preprocessor=None, meta=None,
            threshold: float = None) -> dict:
    """
    Predict resolution speed for a single complaint.

    Parameters
    ----------
    complaint_features : dict with keys matching CAT_FEATURES + NUM_FEATURES
                         (missing keys default to 0 / 'missing')
    threshold          : override the saved threshold if needed

    Returns
    -------
    dict with 'resolution', 'prob_fast', and 'label'
    """
    if model is None:
        model, preprocessor, meta = load()

    thr = threshold if threshold is not None else meta["threshold"]

    row   = pd.DataFrame([{f: complaint_features.get(f, 0)
                            for f in meta["features"]}])
    row_p = preprocessor.transform(row)

    prob_fast = float(model.predict_proba(row_p)[0][1])
    is_fast   = prob_fast >= thr
    label     = f"Fast ≤72h  ✓" if is_fast else "Slow >72h  ⚠"

    return {
        "resolution" : label,
        "prob_fast"  : f"{prob_fast:.1%}",
        "is_fast"    : bool(is_fast),
    }


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv",       default="../data/dataset_with_priority.csv")
    parser.add_argument("--predict",   action="store_true")
    parser.add_argument("--threshold", type=float, default=THRESHOLD)
    args = parser.parse_args()

    if args.predict:
        model, preprocessor, meta = load()
        examples = [
            {"service_name": "Sewer Issues",                "analysis_neighborhood": "Mission",
             "police_district": "MISSION", "request_hour": 10, "is_weekend": 0,
             "geo_density": 2, "repeat_issue_flag": 0},
            {"service_name": "Street and Sidewalk Cleaning","analysis_neighborhood": "Nob Hill",
             "police_district": "CENTRAL", "request_hour": 8,  "is_weekend": 1,
             "geo_density": 1, "repeat_issue_flag": 1},
            {"service_name": "Graffiti",                    "analysis_neighborhood": "Tenderloin",
             "police_district": "SOUTHERN","request_hour": 14, "is_weekend": 1,
             "geo_density": 1, "repeat_issue_flag": 0},
        ]
        print("\n── Example Predictions ──")
        for feat in examples:
            r = predict(feat, model, preprocessor, meta, args.threshold)
            print(f"\n  {feat['service_name']} / {feat['analysis_neighborhood']}")
            print(f"  → {r['resolution']}  (P(fast)={r['prob_fast']})")
    else:
        model, preprocessor, meta = train(args.csv, args.threshold)
        save(model, preprocessor, meta)
        print(f"\nROC-AUC: {meta['roc_auc']:.3f}")
