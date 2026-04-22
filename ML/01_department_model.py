"""
ml/01_department_model.py
=========================
Model 1 — Department Classification
────────────────────────────────────
Task        : Multi-class classification (8 departments)
Algorithm   : Random Forest Classifier
Input       : service_name + service_subtype
Output      : Responsible municipal department
Accuracy    : 75.5%  (test set, stratified 80/20 split)

The 8 departments
─────────────────
  1. Public Works - Cleaning & Infrastructure
  2. Waste Management Services
  3. Parking Enforcement
  4. Urban Services
  5. Transportation Infrastructure Services
  6. General Municipal Services
  7. Social and Community Services
  8. Regulatory and Inspection Services

Usage
─────
  python 01_department_model.py               # train + evaluate + save
  python 01_department_model.py --predict     # load saved model + predict examples
"""

import argparse
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from utils import load_and_prepare, make_preprocessor

# ─────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────
FEATURES   = ["service_name", "service_subtype"]
TARGET     = "department"
MODEL_PATH = "saved_models/m1_department.pkl"
PREP_PATH  = "saved_models/m1_preprocessor.pkl"

HYPERPARAMS = dict(
    n_estimators     = 300,
    max_depth        = 20,
    min_samples_split= 5,
    min_samples_leaf = 2,
    class_weight     = "balanced",   # compensates for minority departments
    random_state     = 42,
    n_jobs           = -1,
)


# ─────────────────────────────────────────────────────────────
# TRAINING
# ─────────────────────────────────────────────────────────────
def train(csv_path: str) -> tuple:
    """
    Load data, train the department classifier, evaluate, and return
    (model, preprocessor, test_results_dict).
    """
    print("=" * 60)
    print("MODEL 1 — Department Classification")
    print("=" * 60)

    # ── 1. Prepare data ──────────────────────────────────────
    df = load_and_prepare(csv_path)

    df_m = df[FEATURES + [TARGET]].dropna().copy()
    X    = df_m[FEATURES]
    y    = df_m[TARGET]

    print(f"\nDataset size : {len(df_m)} records")
    print("\nDepartment distribution:")
    print(y.value_counts().to_string())

    # ── 2. Split ─────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain : {len(X_train)}  |  Test : {len(X_test)}")

    # ── 3. Preprocessor ──────────────────────────────────────
    preprocessor = make_preprocessor(FEATURES, [])
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
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred, labels=model.classes_))

    # ── 6. Cross-validation ──────────────────────────────────
    cv     = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(model, X_train_p, y_train, cv=cv, scoring="accuracy")
    print(f"\n5-Fold CV :  {scores.mean():.2%} ± {scores.std():.2%}")
    print(f"Fold scores: {[f'{s:.2%}' for s in scores]}")

    return model, preprocessor, {"accuracy": acc, "cv_mean": scores.mean()}


# ─────────────────────────────────────────────────────────────
# SAVE
# ─────────────────────────────────────────────────────────────
def save(model, preprocessor):
    import os
    os.makedirs("saved_models", exist_ok=True)
    joblib.dump(model,        MODEL_PATH)
    joblib.dump(preprocessor, PREP_PATH)
    print(f"\n✓ Saved → {MODEL_PATH}")
    print(f"✓ Saved → {PREP_PATH}")


# ─────────────────────────────────────────────────────────────
# LOAD + PREDICT
# ─────────────────────────────────────────────────────────────
def load():
    model        = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREP_PATH)
    return model, preprocessor


def predict(service_name: str, service_subtype: str,
            model=None, preprocessor=None) -> dict:
    """
    Predict the responsible department for a single complaint.

    Parameters
    ----------
    service_name    : e.g. "Graffiti"
    service_subtype : e.g. "Graffiti on Building_commercial"

    Returns
    -------
    dict with 'department' and top-3 probabilities
    """
    if model is None:
        model, preprocessor = load()

    row       = pd.DataFrame([[service_name, service_subtype]], columns=FEATURES)
    row_p     = preprocessor.transform(row)
    dept      = model.predict(row_p)[0]
    proba     = model.predict_proba(row_p)[0]
    top3      = sorted(zip(model.classes_, proba), key=lambda x: -x[1])[:3]

    return {
        "department"  : dept,
        "top3_proba"  : {cls: f"{p:.1%}" for cls, p in top3},
    }


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv",     default="../data/dataset_with_priority.csv")
    parser.add_argument("--predict", action="store_true",
                        help="Load saved model and run example predictions")
    args = parser.parse_args()

    if args.predict:
        model, preprocessor = load()
        examples = [
            ("Graffiti",                    "Graffiti on Building_commercial"),
            ("Sewer Issues",                "Sewer_backup"),
            ("Street and Sidewalk Cleaning","Bulky Items"),
            ("Encampments",                 "Encampment Reports"),
            ("Parking Enforcement",         "Other_Illegal_Parking"),
        ]
        print("\n── Example Predictions ──")
        for svc, sub in examples:
            result = predict(svc, sub, model, preprocessor)
            print(f"\n  {svc} / {sub}")
            print(f"  → Department : {result['department']}")
            print(f"  → Top 3      : {result['top3_proba']}")
    else:
        model, preprocessor, metrics = train(args.csv)
        save(model, preprocessor)
        print(f"\nFinal accuracy: {metrics['accuracy']:.2%}")
