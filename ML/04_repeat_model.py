"""
ml/04_repeat_model.py
=====================
Model 4 — Repeat Pattern Detection
────────────────────────────────────
Task        : Multi-class classification
Algorithm   : Random Forest Classifier
Input       : 17 location + count + context features
Output      : once / twice / 3+ times
Accuracy    : 87.0%

Why classification instead of regression?
──────────────────────────────────────────
  The original approach was a RandomForestRegressor predicting the exact
  repeat count.  It failed (R² = 0.25) because 85.7 % of records have
  count = 1, so the regressor learned to predict ~1 for everything.

  Discretising into 3 operational categories solves the degeneracy:
    • once      → first-time report, handle normally
    • twice     → recurring issue, flag for follow-up
    • 3+ times  → persistent problem, escalate proactively

Usage
─────
  python 04_repeat_model.py               # train + evaluate + save
  python 04_repeat_model.py --predict     # load + predict examples
"""

import argparse
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

from utils import load_and_prepare, make_preprocessor, get_cols

# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────
TARGET     = "repeat_class"
MODEL_PATH = "saved_models/m4_repeat.pkl"
PREP_PATH  = "saved_models/m4_preprocessor.pkl"
META_PATH  = "saved_models/m4_meta.pkl"

CAT_FEATURES = [
    "service_name", "service_subtype",
    "analysis_neighborhood", "police_district", "day_of_week",
    "street",                                    # street-level granularity
]
NUM_FEATURES = [
    "request_hour", "is_weekend", "geo_density",
    "high_demand_area_flag", "repeat_issue_flag",
    "service_name_count", "neighborhood_service_count", "street_service_count",
    "neighborhood_repeat_count",   # engineered in utils.load_and_prepare
    "street_repeat_count",
    "district_repeat_count",
]

HYPERPARAMS = dict(
    n_estimators = 300,
    max_depth    = 12,
    class_weight = "balanced",   # compensates for 'once' dominance (85.7 %)
    random_state = 42,
    n_jobs       = -1,
)


# ─────────────────────────────────────────────────────────────
# TRAINING
# ─────────────────────────────────────────────────────────────
def train(csv_path: str) -> tuple:
    """Train repeat-pattern classifier, evaluate, return (model, preprocessor, meta)."""
    print("=" * 60)
    print("MODEL 4 — Repeat Pattern Detection")
    print("=" * 60)

    # ── 1. Prepare ───────────────────────────────────────────
    df       = load_and_prepare(csv_path)
    num_feat = get_cols(NUM_FEATURES, df)
    features = CAT_FEATURES + num_feat

    df4 = df.dropna(subset=[TARGET]).copy()
    X   = df4[features]
    y   = df4[TARGET]

    print(f"\nDataset size : {len(df4)} records")
    print("\nTarget distribution:")
    print(y.value_counts().to_string())
    print(f"\nTotal features : {len(features)}"
          f"  (cat={len(CAT_FEATURES)}, num={len(num_feat)})")

    # ── 2. Split ─────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train : {len(X_train)}  |  Test : {len(X_test)}")

    # ── 3. Preprocess ────────────────────────────────────────
    preprocessor = make_preprocessor(CAT_FEATURES, num_feat)
    X_train_p    = preprocessor.fit_transform(X_train)
    X_test_p     = preprocessor.transform(X_test)

    # ── 4. Train ─────────────────────────────────────────────
    model = RandomForestClassifier(**HYPERPARAMS)
    model.fit(X_train_p, y_train)
    print("\n✓ Model trained")

    # ── 5. Evaluate ──────────────────────────────────────────
    y_pred = model.predict(X_test_p)
    acc    = accuracy_score(y_test, y_pred)

    print(f"\nTest Accuracy : {acc:.2%}\n")
    print(classification_report(y_test, y_pred, zero_division=0))

    meta = {
        "features": features,
        "cat_feat": CAT_FEATURES,
        "num_feat": num_feat,
        "classes" : list(model.classes_),
        "accuracy": acc,
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
            model=None, preprocessor=None, meta=None) -> dict:
    """
    Predict repeat pattern for a single complaint.

    Parameters
    ----------
    complaint_features : dict — keys should include service_name, street,
                         analysis_neighborhood, and any count features.
                         Missing keys default to 0.

    Returns
    -------
    dict with 'repeat_pattern' and 'confidence' per class
    """
    if model is None:
        model, preprocessor, meta = load()

    row   = pd.DataFrame([{f: complaint_features.get(f, 0)
                            for f in meta["features"]}])
    row_p = preprocessor.transform(row)

    pattern = model.predict(row_p)[0]
    proba   = model.predict_proba(row_p)[0]
    conf    = {cls: f"{p:.1%}" for cls, p in zip(meta["classes"], proba)}

    return {"repeat_pattern": pattern, "confidence": conf}


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv",     default="../data/dataset_with_priority.csv")
    parser.add_argument("--predict", action="store_true")
    args = parser.parse_args()

    if args.predict:
        model, preprocessor, meta = load()
        examples = [
            # first-time report in a low-density area
            {"service_name": "Graffiti", "street": "MARKET ST",
             "analysis_neighborhood": "Tenderloin",
             "police_district": "SOUTHERN",
             "same_location_count": 1, "neighborhood_repeat_count": 3,
             "street_repeat_count": 1, "district_repeat_count": 10,
             "service_name_count": 106},
            # known recurring issue same block
            {"service_name": "Sewer Issues", "street": "VALENCIA ST",
             "analysis_neighborhood": "Mission",
             "police_district": "MISSION",
             "same_location_count": 3, "neighborhood_repeat_count": 15,
             "street_repeat_count": 4, "district_repeat_count": 20,
             "service_name_count": 18},
        ]
        print("\n── Example Predictions ──")
        for feat in examples:
            r = predict(feat, model, preprocessor, meta)
            print(f"\n  {feat['service_name']} / {feat['street']}")
            print(f"  → Repeat pattern : {r['repeat_pattern']}")
            print(f"  → Confidence     : {r['confidence']}")
    else:
        model, preprocessor, meta = train(args.csv)
        save(model, preprocessor, meta)
        print(f"\nFinal accuracy: {meta['accuracy']:.2%}")
