"""
ml/02_priority_model.py
=======================
Model 2 — Priority Prediction
──────────────────────────────
Task        : Multi-class classification (High / Medium / Low)
Algorithm   : Random Forest Classifier + TF-IDF (Hybrid NLP + Structured)
Input       : problem_text (TF-IDF bigrams) + 10 count/context features
Output      : Priority level + confidence scores
Accuracy    : 88%  (test set, stratified 80/20 split)

Why hybrid?
───────────
  • TF-IDF captures WHAT the complaint says        → 85.9% feature importance
  • Count features capture HOW OFTEN / WHERE       → 14.1% feature importance
  Together they outperform either alone.

Priority mapping (domain-informed labels)
─────────────────────────────────────────
  HIGH   : Sewer Issues, Encampments, Tree Maintenance, Street Defects, …
  MEDIUM : Street Cleaning, Parking Enforcement, Noise Report, …
  LOW    : Graffiti, 311 External Request

Usage
─────
  python 02_priority_model.py                 # train + evaluate + save
  python 02_priority_model.py --predict       # load + predict examples
"""

import argparse
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

from utils import load_and_prepare, get_cols

# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────
TEXT_COL   = "problem_text"
TARGET     = "priority"
MODEL_PATH = "saved_models/m2_priority.pkl"

COUNT_FEATURES = [
    "same_location_count",        # exact location repeat count
    "neighborhood_repeat_count",  # neighborhood-level repeat
    "repeat_issue_flag",          # binary: known recurring issue
    "geo_density",                # complaint density in grid cell
    "high_demand_area_flag",      # binary: above-median demand area
    "service_name_count",         # global frequency of this service type
    "neighborhood_service_count",
    "street_service_count",
    "request_hour",
    "is_weekend",
]

HYPERPARAMS = dict(
    n_estimators = 500,
    max_depth    = 15,
    class_weight = "balanced",
    random_state = 42,
    n_jobs       = -1,
)


# ─────────────────────────────────────────────────────────────
# BUILD HYBRID PREPROCESSOR
# ─────────────────────────────────────────────────────────────
def _build_preprocessor(count_feat: list) -> ColumnTransformer:
    """
    Combines:
      - TF-IDF vectorizer on the 'problem_text' column (unigrams + bigrams)
      - Median imputation + StandardScaler on numerical count features
    """
    return ColumnTransformer(transformers=[
        (
            "text",
            TfidfVectorizer(ngram_range=(1, 2), max_features=3000),
            TEXT_COL,
        ),
        (
            "num",
            Pipeline([
                ("imp", SimpleImputer(strategy="median")),
                ("scl", StandardScaler()),
            ]),
            count_feat,
        ),
    ])


# ─────────────────────────────────────────────────────────────
# TRAINING
# ─────────────────────────────────────────────────────────────
def train(csv_path: str) -> tuple:
    """Load data, train priority model, evaluate, return (pipeline, metrics)."""
    print("=" * 60)
    print("MODEL 2 — Priority Prediction  (TF-IDF + Count Features)")
    print("=" * 60)

    # ── 1. Prepare data ──────────────────────────────────────
    df          = load_and_prepare(csv_path)
    count_feat  = get_cols(COUNT_FEATURES, df)
    all_feat    = [TEXT_COL] + count_feat

    df2 = df[all_feat + [TARGET]].dropna().copy()
    X   = df2[all_feat]
    y   = df2[TARGET]

    print(f"\nDataset size : {len(df2)} records")
    print("\nPriority distribution:")
    print(y.value_counts().to_string())
    print(f"\nText feature : '{TEXT_COL}'  (TF-IDF bigrams, max 3000 features)")
    print(f"Count features ({len(count_feat)}) : {count_feat}")

    # ── 2. Split ─────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── 3. Build pipeline: preprocessor + classifier ─────────
    preprocessor = _build_preprocessor(count_feat)
    pipeline = Pipeline([
        ("prep", preprocessor),
        ("clf",  RandomForestClassifier(**HYPERPARAMS)),
    ])

    # ── 4. Train ─────────────────────────────────────────────
    pipeline.fit(X_train, y_train)
    print("\n✓ Model trained")

    # ── 5. Evaluate ──────────────────────────────────────────
    y_pred = pipeline.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)

    print(f"\nTest Accuracy : {acc:.2%}\n")
    print(classification_report(y_test, y_pred, zero_division=0))

    # ── 6. Feature importance breakdown ──────────────────────
    rf           = pipeline.named_steps["clf"]
    prep_fitted  = pipeline.named_steps["prep"]
    n_text       = prep_fitted.named_transformers_["text"].get_feature_names_out().shape[0]
    text_imp     = rf.feature_importances_[:n_text].sum()
    count_imp    = rf.feature_importances_[n_text:].sum()

    print(f"Feature importance breakdown:")
    print(f"  TF-IDF text features : {text_imp:.1%}")
    print(f"  Count features       : {count_imp:.1%}")

    return pipeline, {"accuracy": acc, "text_importance": text_imp}


# ─────────────────────────────────────────────────────────────
# SAVE / LOAD
# ─────────────────────────────────────────────────────────────
def save(pipeline):
    import os
    os.makedirs("saved_models", exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\n✓ Saved → {MODEL_PATH}")


def load():
    return joblib.load(MODEL_PATH)


# ─────────────────────────────────────────────────────────────
# PREDICT
# ─────────────────────────────────────────────────────────────
def predict(service_name: str, service_subtype: str,
            same_location_count: int = 1,
            neighborhood_repeat_count: int = 1,
            pipeline=None, **kwargs) -> dict:
    """
    Predict priority for a single complaint.

    Parameters
    ----------
    service_name            : e.g. "Sewer Issues"
    service_subtype         : e.g. "Sewer_backup"
    same_location_count     : how many times this exact issue was reported here
    neighborhood_repeat_count: repeat count at neighborhood level
    **kwargs                : any additional count features (use 0 as default)

    Returns
    -------
    dict with 'priority' and 'confidence' for each class
    """
    if pipeline is None:
        pipeline = load()

    count_feat = [t[2] for t in pipeline.named_steps["prep"].transformers
                  if t[0] == "num"][0]

    row_data = {
        "problem_text"             : f"{service_name} {service_subtype}",
        "same_location_count"      : same_location_count,
        "neighborhood_repeat_count": neighborhood_repeat_count,
    }
    for feat in count_feat:
        row_data.setdefault(feat, kwargs.get(feat, 0))

    row    = pd.DataFrame([row_data])
    prio   = pipeline.predict(row)[0]
    proba  = pipeline.predict_proba(row)[0]
    conf   = {cls: f"{p:.1%}" for cls, p in zip(pipeline.classes_, proba)}

    return {"priority": prio, "confidence": conf}


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv",     default="../data/dataset_with_priority.csv")
    parser.add_argument("--predict", action="store_true")
    args = parser.parse_args()

    if args.predict:
        pipeline = load()
        examples = [
            ("Sewer Issues",                "Sewer_backup",                   5),
            ("Graffiti",                    "Graffiti on Building_commercial", 1),
            ("Street and Sidewalk Cleaning","Bulky Items",                     3),
            ("Encampments",                 "Encampment Reports",              8),
            ("Noise Report",                "noise_complaint",                 2),
        ]
        print("\n── Example Predictions ──")
        for svc, sub, cnt in examples:
            r = predict(svc, sub, same_location_count=cnt, pipeline=pipeline)
            print(f"\n  {svc} / {sub}  (count={cnt})")
            print(f"  → Priority   : {r['priority']}")
            print(f"  → Confidence : {r['confidence']}")
    else:
        pipeline, metrics = train(args.csv)
        save(pipeline)
        print(f"\nFinal accuracy: {metrics['accuracy']:.2%}")
