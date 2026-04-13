"""
=============================================================
UNIFIED MUNICIPAL AI PIPELINE — النسخة النهائية v2
=============================================================

الموديلات الأربعة:
  Model 1 — القسم:     Random Forest (75.5% Accuracy)
  Model 2 — الأولوية: TF-IDF + Count Features RF (99.5% Accuracy)
  Model 3 — الوقت:    Random Forest كل الخدمات (ROC-AUC: 0.817)
  Model 4 — العد:     Random Forest Classification (87.0% Accuracy)

الداتا: نفس الـ CSV الأصلي — لم يتغير شيء
=============================================================
"""

import pandas as pd
import numpy as np
import joblib
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score, classification_report,
    roc_auc_score, confusion_matrix
)


# =============================================================
# 1. LOAD & PREPARE DATA
# =============================================================
def load_and_prepare(csv_path: str) -> pd.DataFrame:
    """
    يحمّل الـ CSV ويحسب الأعمدة المشتقة.
    لا يغيّر أي شيء في الداتا الأصلية.
    """
    df = pd.read_csv(csv_path)

    # تنظيف النصوص
    text_cols = [
        "service_name", "service_subtype", "analysis_neighborhood",
        "street", "police_district", "day_of_week"
    ]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # ── أعمدة الموديل 2 — الأولوية ────────────────────────────
    # عدد نفس البلاغ في نفس الموقع بالزبط
    df["same_location_count"] = df.groupby(
        ["service_name", "service_subtype", "analysis_neighborhood", "street"]
    )["service_name"].transform("count")

    # عدد نفس البلاغ في الحي
    df["neighborhood_repeat_count"] = df.groupby(
        ["analysis_neighborhood", "service_name"]
    )["service_name"].transform("count")

    # عمود النص المدمج للـ TF-IDF
    df["problem_text"] = (
        df["service_name"].astype(str) + " " +
        df["service_subtype"].astype(str)
    )

    # ── أعمدة الموديل 3 — الوقت ───────────────────────────────
    df["is_fast"] = (df["resolution_time_hours"] <= 72).astype(int)

    # ── أعمدة الموديل 4 — العد ────────────────────────────────
    df["street_repeat_count"] = df.groupby(
        ["street", "service_name"]
    )["service_name"].transform("count")

    df["district_repeat_count"] = df.groupby(
        ["police_district", "service_name"]
    )["service_name"].transform("count")

    df["repeat_request_count"] = df["same_location_count"]

    def count_to_class(c):
        if c == 1:   return "مرة واحدة"
        elif c == 2: return "مرتان"
        else:        return "3 مرات+"

    df["repeat_class"] = df["repeat_request_count"].apply(count_to_class)

    return df


# =============================================================
# 2. HELPERS
# =============================================================
def make_preprocessor(cat_cols: list, num_cols: list) -> ColumnTransformer:
    transformers = []
    if cat_cols:
        transformers.append((
            "cat",
            Pipeline([
                ("imp", SimpleImputer(strategy="constant", fill_value="missing")),
                ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
            ]),
            cat_cols
        ))
    if num_cols:
        transformers.append((
            "num",
            Pipeline([
                ("imp", SimpleImputer(strategy="median")),
                ("scl", StandardScaler())
            ]),
            num_cols
        ))
    return ColumnTransformer(transformers=transformers)


def get_cols(cols, df):
    return [c for c in cols if c in df.columns]


# =============================================================
# 3. TRAIN ALL 4 MODELS
# =============================================================
def train_all_models(df: pd.DataFrame) -> dict:

    # ── الأعمدة المشتركة ──────────────────────────────────────
    CAT_BASE = [
        "service_name", "service_subtype",
        "analysis_neighborhood", "police_district", "day_of_week"
    ]
    NUM_BASE = [
        "request_hour", "is_weekend", "geo_density",
        "high_demand_area_flag", "repeat_issue_flag",
        "service_name_count", "neighborhood_service_count", "street_service_count"
    ]
    num_base = get_cols(NUM_BASE, df)

    # =========================================================
    # MODEL 1 — تحديد القسم
    # المدخلات: service_name + service_subtype
    # المخرج:   اسم القسم (8 أقسام)
    # الخوارزمية: Random Forest 300 شجرة
    # =========================================================
    print("\n" + "="*60)
    print("MODEL 1 — تحديد القسم")
    print("="*60)

    feat1 = ["service_name", "service_subtype"]
    df1 = df.dropna(subset=feat1 + ["department"])
    X1, y1 = df1[feat1], df1["department"]

    Xtr1, Xte1, ytr1, yte1 = train_test_split(
        X1, y1, test_size=0.2, random_state=42, stratify=y1
    )

    prep1 = make_preprocessor(["service_name", "service_subtype"], [])
    Xtr1p = prep1.fit_transform(Xtr1)
    Xte1p = prep1.transform(Xte1)

    m1 = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    m1.fit(Xtr1p, ytr1)
    y1_pred = m1.predict(Xte1p)
    acc1 = accuracy_score(yte1, y1_pred)

    print(f"Accuracy: {acc1*100:.1f}%")
    print(classification_report(yte1, y1_pred))

    # =========================================================
    # MODEL 2 — تحديد الأولوية
    # المدخلات: نص البلاغ (TF-IDF) + 10 ميزات رقمية تشمل العدد
    # المخرج:   High / Medium / Low
    # الخوارزمية: Random Forest 500 شجرة + TF-IDF bigrams
    # =========================================================
    print("\n" + "="*60)
    print("MODEL 2 — تحديد الأولوية (TF-IDF + Count)")
    print("="*60)

    text_col = "problem_text"
    count_feat = get_cols([
        "same_location_count",       # التكرار بنفس الموقع بالزبط
        "neighborhood_repeat_count", # التكرار بالحي
        "repeat_issue_flag",         # علم التكرار
        "geo_density",               # الكثافة الجغرافية
        "high_demand_area_flag",     # منطقة طلب عالي
        "service_name_count",        # عدد نفس الخدمة في الداتا
        "neighborhood_service_count",
        "street_service_count",
        "request_hour",
        "is_weekend"
    ], df)

    df2 = df[[text_col] + count_feat + ["priority"]].dropna()
    X2, y2 = df2[[text_col] + count_feat], df2["priority"]

    Xtr2, Xte2, ytr2, yte2 = train_test_split(
        X2, y2, test_size=0.2, random_state=42, stratify=y2
    )

    # Hybrid preprocessor: TF-IDF للنص + StandardScaler للأرقام
    prep2 = ColumnTransformer(transformers=[
        (
            "text",
            TfidfVectorizer(
                ngram_range=(1, 2),   # unigrams + bigrams
                max_features=3000
            ),
            text_col
        ),
        (
            "num",
            Pipeline([
                ("imp", SimpleImputer(strategy="median")),
                ("scl", StandardScaler())
            ]),
            count_feat
        )
    ])

    m2 = Pipeline([
        ("prep", prep2),
        ("clf", RandomForestClassifier(
            n_estimators=500,
            max_depth=15,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        ))
    ])

    m2.fit(Xtr2, ytr2)
    y2_pred = m2.predict(Xte2)
    acc2 = accuracy_score(yte2, y2_pred)

    print(f"Accuracy: {acc2*100:.1f}%")
    print(f"Features: TF-IDF ({3000}) + Count ({len(count_feat)})")
    print(classification_report(yte2, y2_pred))

    # =========================================================
    # MODEL 3 — تحديد وقت الحل
    # المدخلات: 13 عمود (نص + رقم + موقع)
    # المخرج:   Fast (<=72h) / Slow (>72h)
    # الخوارزمية: Random Forest 300 شجرة
    # الإصلاح:  كل الخدمات + class_weight={0:10,1:1} + threshold=0.4
    # =========================================================
    print("\n" + "="*60)
    print("MODEL 3 — تحديد وقت الحل (كل الخدمات)")
    print("="*60)

    feat3 = CAT_BASE + num_base
    df3 = df.dropna(subset=CAT_BASE)
    X3, y3 = df3[feat3], df3["is_fast"]

    print(f"Class distribution — Fast: {y3.sum()}, Slow: {(y3==0).sum()}")

    Xtr3, Xte3, ytr3, yte3 = train_test_split(
        X3, y3, test_size=0.2, random_state=42, stratify=y3
    )

    prep3 = make_preprocessor(CAT_BASE, num_base)
    Xtr3p = prep3.fit_transform(Xtr3)
    Xte3p = prep3.transform(Xte3)

    m3 = RandomForestClassifier(
        n_estimators=300,
        max_depth=15,
        class_weight={0: 10, 1: 1},  # ← الإصلاح: عقوبة 10x للـ Slow
        random_state=42,
        n_jobs=-1
    )
    m3.fit(Xtr3p, ytr3)

    y3_prob = m3.predict_proba(Xte3p)[:, 1]
    y3_pred = (y3_prob >= 0.4).astype(int)  # ← threshold منخفض لصيد الـ Slow

    auc3 = roc_auc_score(yte3, y3_prob)
    print(f"ROC-AUC: {auc3:.3f}")
    print(classification_report(yte3, y3_pred, target_names=["Slow >72h", "Fast <=72h"]))
    print("Confusion Matrix:")
    print(confusion_matrix(yte3, y3_pred))

    # =========================================================
    # MODEL 4 — تحديد نمط التكرار
    # المدخلات: 17 عمود
    # المخرج:   مرة واحدة / مرتان / 3 مرات+
    # الخوارزمية: Random Forest 300 شجرة (Classification بدل Regression)
    # =========================================================
    print("\n" + "="*60)
    print("MODEL 4 — تحديد نمط التكرار (Classification)")
    print("="*60)

    cat4 = CAT_BASE + ["street"]
    num4 = get_cols(
        num_base + ["neighborhood_repeat_count", "street_repeat_count", "district_repeat_count"],
        df
    )
    feat4 = cat4 + num4

    df4 = df.dropna(subset=["repeat_class"])
    X4, y4 = df4[feat4], df4["repeat_class"]

    print(f"Class distribution:")
    print(y4.value_counts().to_string())

    Xtr4, Xte4, ytr4, yte4 = train_test_split(
        X4, y4, test_size=0.2, random_state=42, stratify=y4
    )

    prep4 = make_preprocessor(cat4, num4)
    Xtr4p = prep4.fit_transform(Xtr4)
    Xte4p = prep4.transform(Xte4)

    m4 = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    m4.fit(Xtr4p, ytr4)
    y4_pred = m4.predict(Xte4p)
    acc4 = accuracy_score(yte4, y4_pred)

    print(f"\nAccuracy: {acc4*100:.1f}%")
    print(classification_report(yte4, y4_pred))

    return {
        # الموديلات
        "model1": m1, "prep1": prep1,
        "model2": m2,
        "model3": m3, "prep3": prep3,
        "model4": m4, "prep4": prep4,
        # الأعمدة
        "feat1": feat1,
        "feat2_text": text_col,
        "feat2_count": count_feat,
        "feat3": feat3, "cat3": CAT_BASE, "num3": num_base,
        "feat4": feat4, "cat4": cat4, "num4": num4,
        # النتائج
        "scores": {
            "model1_acc": acc1,
            "model2_acc": acc2,
            "model3_roc": auc3,
            "model4_acc": acc4,
        }
    }


# =============================================================
# 4. SAVE MODELS
# =============================================================
def save_models(models: dict, path_prefix: str = "./"):
    joblib.dump(models["model1"],  path_prefix + "m1_department.pkl")
    joblib.dump(models["prep1"],   path_prefix + "m1_preprocessor.pkl")
    joblib.dump(models["model2"],  path_prefix + "m2_priority.pkl")
    joblib.dump(models["model3"],  path_prefix + "m3_resolution.pkl")
    joblib.dump(models["prep3"],   path_prefix + "m3_preprocessor.pkl")
    joblib.dump(models["model4"],  path_prefix + "m4_repeat.pkl")
    joblib.dump(models["prep4"],   path_prefix + "m4_preprocessor.pkl")

    meta = {
        "feat1":       models["feat1"],
        "feat2_text":  models["feat2_text"],
        "feat2_count": models["feat2_count"],
        "feat3":       models["feat3"],
        "cat3":        models["cat3"],
        "num3":        models["num3"],
        "feat4":       models["feat4"],
        "cat4":        models["cat4"],
        "num4":        models["num4"],
        "scores":      models["scores"],
    }
    joblib.dump(meta, path_prefix + "pipeline_meta.pkl")
    print("\nAll models saved:")
    for k, v in models["scores"].items():
        print(f"  {k}: {v:.4f}")


# =============================================================
# 5. LOAD MODELS
# =============================================================
def load_models(path_prefix: str = "./") -> dict:
    meta = joblib.load(path_prefix + "pipeline_meta.pkl")
    return {
        "model1": joblib.load(path_prefix + "m1_department.pkl"),
        "prep1":  joblib.load(path_prefix + "m1_preprocessor.pkl"),
        "model2": joblib.load(path_prefix + "m2_priority.pkl"),
        "model3": joblib.load(path_prefix + "m3_resolution.pkl"),
        "prep3":  joblib.load(path_prefix + "m3_preprocessor.pkl"),
        "model4": joblib.load(path_prefix + "m4_repeat.pkl"),
        "prep4":  joblib.load(path_prefix + "m4_preprocessor.pkl"),
        **meta
    }


# =============================================================
# 6. UNIFIED PREDICTION FUNCTION
# =============================================================
def predict_report(
    service_name: str,
    service_subtype: str,
    neighborhood: str,
    police_district: str,
    street: str,
    hour: int,
    day_of_week: str,
    is_weekend: int,
    df_historical: pd.DataFrame,
    models: dict,
    threshold: float = 0.4
) -> dict:
    """
    يأخذ تفاصيل البلاغ ويرجع تنبؤات الأربعة موديلات.

    المدخلات:
        service_name    : نوع الخدمة  (مثل "Sewer Issues")
        service_subtype : النوع الفرعي (مثل "Sewer_backup")
        neighborhood    : الحي         (مثل "Mission")
        police_district : المنطقة الأمنية
        street          : اسم الشارع
        hour            : ساعة الإبلاغ (0-23)
        day_of_week     : يوم الأسبوع  (مثل "Monday")
        is_weekend      : 1 إذا كان عطلة، وإلا 0
        df_historical   : DataFrame البيانات التاريخية
        models          : dict الموديلات المحمّلة
        threshold       : حد الموديل 3 (default 0.4)

    المخرجات: dict
        department      : القسم المختص
        priority        : الأولوية (High/Medium/Low) + الاحتمالات
        resolution      : توقع وقت الحل
        prob_fast_pct   : احتمال الحل خلال 72 ساعة
        repeat_pattern  : نمط التكرار
    """
    dh = df_historical

    # ── حساب الميزات من البيانات التاريخية ──────────────────
    sn_count = int(dh[dh["service_name"] == service_name].shape[0])

    nb_count = int(dh[
        (dh["analysis_neighborhood"] == neighborhood) &
        (dh["service_name"] == service_name)
    ].shape[0])

    st_count = int(dh[
        (dh["street"] == street) &
        (dh["service_name"] == service_name)
    ].shape[0])

    dist_count = int(dh[
        (dh["police_district"] == police_district) &
        (dh["service_name"] == service_name)
    ].shape[0])

    # same_location_count: نفس الخدمة + subtype + neighborhood + street
    same_loc = int(dh[
        (dh["service_name"] == service_name) &
        (dh["service_subtype"] == service_subtype) &
        (dh["analysis_neighborhood"] == neighborhood) &
        (dh["street"] == street)
    ].shape[0])

    nb_mask = dh["analysis_neighborhood"] == neighborhood
    geo_density = float(dh.loc[nb_mask, "geo_density"].median()) \
        if nb_mask.any() else 1.0

    nb_svc_median = float(dh["neighborhood_service_count"].median())
    high_demand = int(nb_count > nb_svc_median)
    repeat_flag = int(st_count > 1)

    # قاموس الميزات المشتركة
    shared = {
        "service_name":              service_name,
        "service_subtype":           service_subtype,
        "analysis_neighborhood":     neighborhood,
        "police_district":           police_district,
        "day_of_week":               day_of_week,
        "street":                    street,
        "request_hour":              hour,
        "is_weekend":                is_weekend,
        "geo_density":               geo_density,
        "high_demand_area_flag":     high_demand,
        "repeat_issue_flag":         repeat_flag,
        "service_name_count":        sn_count,
        "neighborhood_service_count": nb_count,
        "street_service_count":      st_count,
        "same_location_count":       same_loc,
        "neighborhood_repeat_count": nb_count,
        "street_repeat_count":       st_count,
        "district_repeat_count":     dist_count,
        "problem_text":              f"{service_name} {service_subtype}",
    }

    # ── Model 1: القسم ────────────────────────────────────────
    r1 = pd.DataFrame([[service_name, service_subtype]],
                       columns=models["feat1"])
    department = models["model1"].predict(
        models["prep1"].transform(r1)
    )[0]

    # ── Model 2: الأولوية (TF-IDF + Count) ───────────────────
    feat2 = [models["feat2_text"]] + models["feat2_count"]
    r2 = pd.DataFrame([{f: shared.get(f, 0) for f in feat2}])
    priority = models["model2"].predict(r2)[0]
    priority_proba = models["model2"].predict_proba(r2)[0]
    priority_classes = models["model2"].classes_
    priority_conf = {
        c: f"{round(p * 100)}%"
        for c, p in zip(priority_classes, priority_proba)
    }

    # ── Model 3: وقت الحل ────────────────────────────────────
    r3 = pd.DataFrame([{f: shared.get(f, 0) for f in models["feat3"]}])
    prob_fast = float(
        models["model3"].predict_proba(
            models["prep3"].transform(r3)
        )[0][1]
    )
    is_fast = prob_fast >= threshold
    resolution_label = (
        "سيُحل خلال 72 ساعة ✓" if is_fast
        else "قد يتأخر أكثر من 72 ساعة ⚠"
    )

    # ── Model 4: نمط التكرار ─────────────────────────────────
    r4 = pd.DataFrame([{f: shared.get(f, 0) for f in models["feat4"]}])
    repeat_pattern = models["model4"].predict(
        models["prep4"].transform(r4)
    )[0]

    return {
        "department":     department,
        "priority":       priority,
        "priority_conf":  priority_conf,
        "resolution":     resolution_label,
        "prob_fast_pct":  f"{prob_fast * 100:.0f}%",
        "repeat_pattern": repeat_pattern,
    }


# =============================================================
# 7. FastAPI INTEGRATION EXAMPLE
# =============================================================
FASTAPI_CODE = '''
# main.py — مثال على تكامل مع FastAPI

from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from unified_pipeline_v2 import load_models, predict_report

app = FastAPI(title="Municipal AI API")

# تحميل الموديلات مرة واحدة عند بدء السيرفر
models = load_models(path_prefix="./models/")
df_hist = pd.read_csv("dataset_with_priority.csv")

class ReportRequest(BaseModel):
    service_name: str
    service_subtype: str
    neighborhood: str
    police_district: str
    street: str
    hour: int
    day_of_week: str
    is_weekend: int

@app.post("/predict")
def predict(req: ReportRequest):
    """يتنبأ بالقسم والأولوية والوقت والتكرار لبلاغ جديد"""
    result = predict_report(
        service_name    = req.service_name,
        service_subtype = req.service_subtype,
        neighborhood    = req.neighborhood,
        police_district = req.police_district,
        street          = req.street,
        hour            = req.hour,
        day_of_week     = req.day_of_week,
        is_weekend      = req.is_weekend,
        df_historical   = df_hist,
        models          = models
    )
    return result

# مثال على الاستجابة:
# {
#   "department":     "Public Works - Cleaning & Infrastructure",
#   "priority":       "High",
#   "priority_conf":  {"High": "82%", "Low": "1%", "Medium": "17%"},
#   "resolution":     "قد يتأخر أكثر من 72 ساعة ⚠",
#   "prob_fast_pct":  "8%",
#   "repeat_pattern": "مرة واحدة"
# }
'''


# =============================================================
# 8. MAIN
# =============================================================
if __name__ == "__main__":
    import os

    CSV_PATH = "dataset_with_priority.csv"
    SAVE_DIR = "./"

    print("Loading and preparing data...")
    df = load_and_prepare(CSV_PATH)
    print(f"Data shape: {df.shape}")

    print("\nTraining all 4 models...")
    models = train_all_models(df)

    print("\nSaving models...")
    save_models(models, SAVE_DIR)

    print("\n" + "="*60)
    print("FINAL SCORES")
    print("="*60)
    s = models["scores"]
    print(f"  Model 1 — القسم     (8 أقسام):   {s['model1_acc']*100:.1f}%  Accuracy")
    print(f"  Model 2 — الأولوية (TF-IDF+Count): {s['model2_acc']*100:.1f}%  Accuracy")
    print(f"  Model 3 — الوقت    (كل الخدمات): ROC-AUC = {s['model3_roc']:.3f}")
    print(f"  Model 4 — العد     (3 فئات):       {s['model4_acc']*100:.1f}%  Accuracy")

    print("\n" + "="*60)
    print("END-TO-END TESTS")
    print("="*60)

    test_cases = [
        # (service_name, service_subtype, neighborhood, police_district, street, hour, day, weekend)
        ("Sewer Issues",               "Sewer_backup",                   "Mission",              "MISSION",  "VALENCIA ST",  10, "Monday",    0),
        ("Graffiti",                   "Graffiti on Building_commercial", "Tenderloin",           "SOUTHERN", "MARKET ST",    14, "Friday",    1),
        ("Street and Sidewalk Cleaning","Bulky Items",                    "Nob Hill",             "CENTRAL",  "JONES ST",      8, "Saturday",  1),
        ("Encampments",                "Encampment Reports",              "Castro/Upper Market",  "MISSION",  "18TH ST",       9, "Tuesday",   0),
        ("Tree Maintenance",           "Trees - Damaged_Tree",            "Mission",              "MISSION",  "GUERRERO ST",  11, "Wednesday", 0),
        ("Noise Report",               "noise_complaint",                 "South of Market",      "SOUTHERN", "HOWARD ST",    23, "Saturday",  1),
    ]

    for tc in test_cases:
        r = predict_report(*tc, df, models)
        print(f"\nبلاغ: {tc[0]:35s} | {tc[2]}")
        print(f"  القسم:      {r['department']}")
        print(f"  الأولوية:   {r['priority']}  ← {r['priority_conf']}")
        print(f"  الوقت:      {r['resolution']} ({r['prob_fast_pct']})")
        print(f"  التكرار:    {r['repeat_pattern']}")

    print("\n" + "="*60)
    print("FastAPI Integration Example:")
    print(FASTAPI_CODE)
