import pandas as pd
df = pd.read_csv("sf311_ready_for_modeling.csv")
df.head()

"""# **XGBoost Classifier for Agency Prediction**"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, balanced_accuracy_score


# 2. المتغيرات التي سنستخدمها

features = [
    'service_name', 'service_subtype',
    'analysis_neighborhood', 'police_district',
    'request_hour', 'day_of_week', 'is_weekend',
    'request_month',
    'geo_density', 'high_demand_area_flag',
    'repeat_issue_flag',
    'service_name_count', 'neighborhood_service_count',
    'street_service_count', 'agency_request_count'
]

target = 'agency_responsible'


# 3. تنظيف بسيط + إزالة الفئات النادرة جداً

print(df[target].value_counts().tail(12))

# الحد الأدنى لعدد العينات لكل جهة
MIN_SAMPLES_PER_CLASS = 4

agency_counts = df[target].value_counts()
valid_agencies = agency_counts[agency_counts >= MIN_SAMPLES_PER_CLASS].index

# الاحتفاظ فقط بالسجلات التي تنتمي لجهات لها عدد كافٍ من العينات
mask = df[target].isin(valid_agencies) & df[target].notna() & (df[target].str.strip() != '')
X = df.loc[mask, features].copy()
y = df.loc[mask, target].copy()

print(f"\nتم الاحتفاظ بـ {len(X):,} سجل بعد استبعاد الفئات التي لها أقل من {MIN_SAMPLES_PER_CLASS} عينات")
print(f"عدد الجهات المتبقية: {len(valid_agencies)}")

# 4. ترميز الهدف

le = LabelEncoder()
y_encoded = le.fit_transform(y)


# 5. تقسيم البيانات

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.20,
    random_state=42,
    stratify=y_encoded
)

print(f"\nحجم التدريب: {len(X_train):,}    حجم الاختبار: {len(X_test):,}")


# 6. Preprocessing

cat_features = [
    'service_name', 'service_subtype',
    'analysis_neighborhood', 'police_district', 'day_of_week'
]

num_features = [col for col in features if col not in cat_features]

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', Pipeline([
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ]), cat_features),

        ('num', Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ]), num_features)
    ])


# 7. النموذج

xgb_model = XGBClassifier(
    n_estimators       = 600,
    max_depth          = 9,
    learning_rate      = 0.035,
    subsample          = 0.82,
    colsample_bytree   = 0.70,
    reg_alpha          = 0.9,
    reg_lambda         = 1.6,
    random_state       = 42,
    objective          = 'multi:softprob',
    eval_metric        = 'mlogloss',
    n_jobs             = -1,
    tree_method        = 'hist'          # 'gpu_hist' إذا كان لديك GPU
)

pipeline = Pipeline([
    ('prep', preprocessor),
    ('clf', xgb_model)
])


# 8. التدريب


pipeline.fit(X_train, y_train)


# 9. التنبؤ + التقييم

y_pred = pipeline.predict(X_test)

print("\nBalanced Accuracy:", round(balanced_accuracy_score(y_test, y_pred), 4))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred, target_names=le.classes_, digits=3))


# 10. حفظ النموذج والـ encoder

import joblib

joblib.dump(pipeline, 'agency_routing_pipeline_xgb_2025_v2.pkl')
joblib.dump(le, 'agency_label_encoder_2025_v2.pkl')

"""# **AI Model for Municipal Complaint Priority Classification**"""

high_risk_services = [
    'Encampments', 'Graffiti', 'Streetlights', 'Abandoned Vehicle',
    'Damaged Property', 'Sewer Issues', 'Flooding', 'Tree Maintenance'
]

df['high_risk_flag'] = df['service_name'].isin(high_risk_services).astype(int)

df['priority_score'] = (
    40 * df['high_risk_flag'] +
    22 * df['high_demand_area_flag'] +
    18 * df['repeat_issue_flag'] +
    12 * df['geo_density'].clip(1,10)/10 +
    8  * df['is_weekend']
)

def priority_label(score):
    if score >= 65: return 'High'
    if score >= 35: return 'Medium'
    return 'Low'

df['priority'] = df['priority_score'].apply(priority_label)


#  النموذج


features_pri = features + ['high_risk_flag', 'priority_score']

X_p = df[features_pri].copy()
y_p = df['priority'].copy()

le_pri = LabelEncoder()
y_p_enc = le_pri.fit_transform(y_p)

X_tr_p, X_te_p, y_tr_p, y_te_p = train_test_split(
    X_p, y_p_enc, test_size=0.20, stratify=y_p_enc, random_state=42
)

pri_pipeline = Pipeline([
    ('prep', preprocessor),   # نفس preprocessor السابق
    ('clf', XGBClassifier(
        n_estimators=350,
        max_depth=7,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.78,
        reg_alpha=0.6,
        random_state=42,
        eval_metric='mlogloss'
    ))
])

pri_pipeline.fit(X_tr_p, y_tr_p)

y_pred_p = pri_pipeline.predict(X_te_p)
print(classification_report(y_te_p, y_pred_p, target_names=le_pri.classes_))

joblib.dump(pri_pipeline, 'priority_xgb_v2025.pkl')
joblib.dump(le_pri, 'priority_encoder.pkl')

# ===== Save Priority Model Objects =====
priority_pipeline = pri_pipeline
priority_encoder = le_pri
priority_features = features_pri.copy()

"""# **Fast vs Slow Service Resolution Classification Model**"""

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# اختر خدمة رئيسية
main_service = "Street and Sidewalk Cleaning"
df_main = df[df["service_name"] == main_service]

print("Number of records:", len(df_main))


# الهدف: هل تم حل البلاغ خلال 72 ساعة
df_main["is_fast"] = (df_main["resolution_time_hours"] <= 72).astype(int)


# الأعمدة المستخدمة
features = [
    "service_subtype",
    "analysis_neighborhood",
    "police_district",
    "request_hour",
    "day_of_week",
    "is_weekend",
    "request_month",
    "geo_density",
    "high_demand_area_flag",
    "repeat_issue_flag",
    "service_name_count",
    "neighborhood_service_count",
    "street_service_count",
    "agency_request_count"
]

X = df_main[features]
y = df_main["is_fast"]


# الأعمدة النصية
cat_features = [
    "service_subtype",
    "analysis_neighborhood",
    "police_district",
    "day_of_week"
]

# الأعمدة الرقمية
num_features = [col for col in features if col not in cat_features]


# preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        (
            "cat",
            Pipeline([
                ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
                ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
            ]),
            cat_features
        ),
        (
            "num",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ]),
            num_features
        )
    ]
)


# تقسيم البيانات
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# تجهيز البيانات
X_train_prep = preprocessor.fit_transform(X_train)
X_test_prep = preprocessor.transform(X_test)


# موديل Random Forest
rf = RandomForestClassifier(
    n_estimators=800,
    max_depth=12,
    min_samples_split=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)


# تدريب
rf.fit(X_train_prep, y_train)


# التنبؤ
y_pred = rf.predict(X_test_prep)


# التقييم
print("Accuracy:", accuracy_score(y_test, y_pred))

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=["Slow (>72 hours)", "Fast (<=72 hours)"]
    )
)


# Confusion Matrix
cm = pd.DataFrame(
    confusion_matrix(y_test, y_pred),
    index=["Actual Slow", "Actual Fast"],
    columns=["Predicted Slow", "Predicted Fast"]
)

print("\nConfusion Matrix:")
print(cm)

# Save the resolution speed model and preprocessor
import joblib
joblib.dump(rf, 'speed_rf_model.pkl')
joblib.dump(preprocessor, 'speed_preprocessor.pkl')

"""# **Repeated Complaint Count Prediction**"""

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Clean text columns
text_cols = ["service_name","service_subtype","analysis_neighborhood","street","police_district","day_of_week"]

for col in text_cols:
    if col in df.columns:
        df[col] = df[col].astype(str).str.strip()


# Target: number of repeated complaints in same context
group_cols = ["service_name","service_subtype","analysis_neighborhood","street"]

df["repeat_request_count"] = df.groupby(group_cols)["service_name"].transform("count")


# Location history features
df["neighborhood_repeat_count"] = df.groupby(
    ["analysis_neighborhood","service_name"]
)["service_name"].transform("count")

df["street_repeat_count"] = df.groupby(
    ["street","service_name"]
)["service_name"].transform("count")

df["district_repeat_count"] = df.groupby(
    ["police_district","service_name"]
)["service_name"].transform("count")

df["neighborhood_street_variety"] = df.groupby(
    ["analysis_neighborhood","service_name"]
)["street"].transform("nunique")


# Features
features = [
    "service_name",
    "service_subtype",
    "analysis_neighborhood",
    "police_district",
    "street",
    "request_hour",
    "day_of_week",
    "is_weekend",
    "request_month",
    "geo_density",
    "high_demand_area_flag",
    "neighborhood_repeat_count",
    "street_repeat_count",
    "district_repeat_count",
    "neighborhood_street_variety",
    "service_name_count",
    "neighborhood_service_count",
    "street_service_count",
    "agency_request_count"
]

target = "repeat_request_count"


# Dataset
df_model = df[features + [target]]
df_model = df_model.dropna(subset=[target])

X = df_model[features]
y = df_model[target]


# Categorical vs numerical
cat_features = [
    "service_name",
    "service_subtype",
    "analysis_neighborhood",
    "police_district",
    "street",
    "day_of_week"
]

num_features = [col for col in features if col not in cat_features]


# Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        (
            "cat",
            Pipeline([
                ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
                ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
            ]),
            cat_features
        ),
        (
            "num",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ]),
            num_features
        )
    ]
)


# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)


# Apply preprocessing
X_train_prep = preprocessor.fit_transform(X_train)
X_test_prep = preprocessor.transform(X_test)


# Model
repeat_model = RandomForestRegressor(
    n_estimators=500,
    max_depth=14,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

repeat_model.fit(X_train_prep, y_train)


# Prediction
y_pred = repeat_model.predict(X_test_prep)


# Evaluation
print("MAE:", mean_absolute_error(y_test, y_pred))
print("RMSE:", np.sqrt(mean_squared_error(y_test, y_pred)))
print("R2 Score:", r2_score(y_test, y_pred))


# Example predictions
results = X_test.copy()
results["actual_repeat_count"] = y_test
results["predicted_repeat_count"] = np.round(y_pred).astype(int)

print(results[[
    "service_name",
    "analysis_neighborhood",
    "street",
    "actual_repeat_count",
    "predicted_repeat_count"
]].head(20))

# Save the repeat model and preprocessor
import joblib
joblib.dump(repeat_model, 'repeat_rf_model.pkl')
joblib.dump(preprocessor, 'repeat_preprocessor.pkl')

# ===== Save Repeat Model Objects =====
repeat_regressor = repeat_model
repeat_preprocessor = preprocessor
repeat_features = features.copy()

import joblib
joblib.dump(repeat_features, 'repeat_features.pkl')

"""# **Complaint Handling Priority Score Model**"""

# =====================================================
# Model 5: Smart Complaint Scheduling Score
# =====================================================

# Convert priority to numeric weight
priority_map = {
    "Low":1,
    "Medium":2,
    "High":3
}

if "priority" in df.columns:
    df["priority_weight"] = df["priority"].map(priority_map).fillna(1)
else:
    df["priority_weight"] = 1


# Normalize important numeric signals
df["repeat_norm"] = df["repeat_request_count"] / (df["repeat_request_count"].max() + 1)
df["density_norm"] = df["geo_density"] / (df["geo_density"].max() + 1)
df["agency_load_norm"] = df["agency_request_count"] / (df["agency_request_count"].max() + 1)


# Weekend effect
df["weekend_weight"] = df["is_weekend"].astype(int)


# Demand flag
df["demand_weight"] = df["high_demand_area_flag"].astype(int)


# Final scheduling score
df["scheduling_score"] = (
      3 * df["priority_weight"]
    + 2 * df["repeat_norm"]
    + 1.5 * df["density_norm"]
    + 1 * df["demand_weight"]
    + 0.5 * df["weekend_weight"]
    - 1 * df["agency_load_norm"]
)


# Rank complaints by urgency
df["task_rank"] = df["scheduling_score"].rank(ascending=False)


# Show top complaints to handle first
schedule_view = df.sort_values("scheduling_score", ascending=False)

print(schedule_view[[
    "service_name",
    "analysis_neighborhood",
    "street",
    "priority_weight",
    "repeat_request_count",
    "geo_density",
    "scheduling_score",
    "task_rank"
]].head(20))

"""# **Unified prediction function for one complaint**"""

import pandas as pd
import numpy as np
import joblib
import os

print("Loading saved models and components...\n")

# 1. Agency model + encoder
agency_pipeline = joblib.load('agency_routing_pipeline_xgb_2025_v2.pkl')
agency_encoder  = joblib.load('agency_label_encoder_2025_v2.pkl')
print("✓ Agency model & encoder loaded")

# 2. Priority model + encoder
priority_pipeline = joblib.load('priority_xgb_v2025.pkl')
priority_encoder  = joblib.load('priority_encoder.pkl')
print("✓ Priority model & encoder loaded")

# 3. Resolution speed model + preprocessor
speed_model        = joblib.load('speed_rf_model.pkl')
speed_preprocessor = joblib.load('speed_preprocessor.pkl')
print("✓ Speed classification model & preprocessor loaded")

# 4. Repeat count prediction model + preprocessor
repeat_regressor = joblib.load('repeat_rf_model.pkl') # Load the regressor
repeat_preprocessor = joblib.load('repeat_preprocessor.pkl') # Load the preprocessor
print("✓ Repeat count prediction model & preprocessor loaded")

print("\nAll core models loaded successfully.")

agency_features = [
    'service_name', 'service_subtype',
    'analysis_neighborhood', 'police_district',
    'request_hour', 'day_of_week', 'is_weekend',
    'request_month',
    'geo_density', 'high_demand_area_flag',
    'repeat_issue_flag',
    'service_name_count', 'neighborhood_service_count',
    'street_service_count', 'agency_request_count'
]

priority_features = agency_features + ['high_risk_flag', 'priority_score']

speed_features = [
    "service_subtype", "analysis_neighborhood", "police_district",
    "request_hour", "day_of_week", "is_weekend", "request_month",
    "geo_density", "high_demand_area_flag", "repeat_issue_flag",
    "service_name_count", "neighborhood_service_count",
    "street_service_count", "agency_request_count"
]

repeat_features = joblib.load('repeat_features.pkl')   # ← we saved this list earlier

print("Feature lists prepared.")
print(f"• Agency features   : {len(agency_features)} columns")
print(f"• Priority features : {len(priority_features)} columns")
print(f"• Speed features    : {len(speed_features)} columns")
print(f"• Repeat features   : {len(repeat_features)} columns")

def predict_complaint(service_name, service_subtype,
                      analysis_neighborhood, police_district, street,
                      request_hour, day_of_week, is_weekend, request_month,
                      geo_density, high_demand_area_flag, repeat_issue_flag,
                      service_name_count, neighborhood_service_count,
                      street_service_count, agency_request_count):

    # 1. Prediction for Agency
    agency_input_df = pd.DataFrame([[service_name, service_subtype,
                                     analysis_neighborhood, police_district,
                                     request_hour, day_of_week, is_weekend,
                                     request_month, geo_density, high_demand_area_flag,
                                     repeat_issue_flag, service_name_count,
                                     neighborhood_service_count, street_service_count,
                                     agency_request_count]], columns=agency_features)
    agency_pred_encoded = agency_pipeline.predict(agency_input_df)
    predicted_agency = agency_encoder.inverse_transform(agency_pred_encoded)[0]

    # 2. Prediction for Priority (Requires 'high_risk_flag' and 'priority_score' for its features)
    # First, calculate high_risk_flag based on service_name
    high_risk_services = [
        'Encampments', 'Graffiti', 'Streetlights', 'Abandoned Vehicle',
        'Damaged Property', 'Sewer Issues', 'Flooding', 'Tree Maintenance'
    ]
    high_risk_flag = 1 if service_name in high_risk_services else 0

    # Then calculate priority_score (using a simplified version as in original notebook)
    # Note: df is not available here, so using provided input for calculation
    priority_score = (
        40 * high_risk_flag +
        22 * high_demand_area_flag +
        18 * repeat_issue_flag +
        12 * geo_density +
        8  * is_weekend
    )

    priority_input_data = [service_name, service_subtype,
                           analysis_neighborhood, police_district,
                           request_hour, day_of_week, is_weekend,
                           request_month, geo_density, high_demand_area_flag,
                           repeat_issue_flag, service_name_count,
                           neighborhood_service_count, street_service_count,
                           agency_request_count, high_risk_flag, priority_score]

    priority_input_df = pd.DataFrame([priority_input_data], columns=priority_features)
    priority_pred_encoded = priority_pipeline.predict(priority_input_df)
    predicted_priority = priority_encoder.inverse_transform(priority_pred_encoded)[0]

    # 3. Prediction for Resolution Speed
    speed_input_df = pd.DataFrame([[service_subtype, analysis_neighborhood, police_district,
                                    request_hour, day_of_week, is_weekend, request_month,
                                    geo_density, high_demand_area_flag, repeat_issue_flag,
                                    service_name_count, neighborhood_service_count,
                                    street_service_count, agency_request_count]], columns=speed_features)

    speed_input_prep = speed_preprocessor.transform(speed_input_df)
    predicted_speed_label = speed_model.predict(speed_input_prep)[0]
    predicted_speed = "Fast (<=72 hours)" if predicted_speed_label == 1 else "Slow (>72 hours)"

    # 4. Prediction for Repeat Complaint Count
    repeat_input_df = pd.DataFrame([{
        "service_name": service_name,
        "service_subtype": service_subtype,
        "analysis_neighborhood": analysis_neighborhood,
        "police_district": police_district,
        "street": street,
        "request_hour": request_hour,
        "day_of_week": day_of_week,
        "is_weekend": is_weekend,
        "request_month": request_month,
        "geo_density": geo_density,
        "high_demand_area_flag": high_demand_area_flag,
        "neighborhood_repeat_count": neighborhood_service_count, # Using existing for example
        "street_repeat_count": street_service_count, # Using existing for example
        "district_repeat_count": agency_request_count, # Using existing for example
        "neighborhood_street_variety": 1, # Placeholder
        "service_name_count": service_name_count,
        "neighborhood_service_count": neighborhood_service_count,
        "street_service_count": street_service_count,
        "agency_request_count": agency_request_count
    }], columns=repeat_features)

    # Impute missing values for numeric features for repeat_preprocessor
    # This part is crucial as 'repeat_features' can have different imputers
    # The preprocessor pipeline handles this automatically.
    repeat_input_prep = repeat_preprocessor.transform(repeat_input_df)
    predicted_repeat_count = int(np.round(repeat_regressor.predict(repeat_input_prep)[0]))
    if predicted_repeat_count < 0:
      predicted_repeat_count = 0

    return {
        "predicted_agency": predicted_agency,
        "predicted_priority": predicted_priority,
        "predicted_speed": predicted_speed,
        "predicted_repeat_count": predicted_repeat_count
    }