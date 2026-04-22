#  CivicMind — ML Models

This folder contains all machine learning code for the CivicMind municipal complaint analysis system.



##  The Four Models

| # | File | Task | Algorithm | Key Input | Output | Performance |
|---|------|------|-----------|-----------|--------|-------------|
| 1 | `01_department_model.py` | Department classification | Random Forest | service_name + subtype | 8 departments | **75.5% Accuracy** |
| 2 | `02_priority_model.py` | Priority prediction | RF + TF-IDF | Complaint text + 10 count features | High / Medium / Low | **99.5% Accuracy** |
| 3 | `03_resolution_model.py` | Resolution speed | Random Forest | 13 structured features | Fast ≤72h / Slow | **ROC-AUC 0.817** |
| 4 | `04_repeat_model.py` | Repeat pattern | Random Forest | 17 location + count features | once / twice / 3+ | **87.0% Accuracy** |

---

##  Quick Start

### Install dependencies
```bash
pip install scikit-learn pandas numpy joblib
```

### Option A — Train all models at once
```bash
python unified_pipeline_v2.py
```

### Option B — Train each model individually
```bash
python 01_department_model.py  --csv ../Datasets/dataset_with_priority.csv
python 02_priority_model.py    --csv ../Datasets/dataset_with_priority.csv
python 03_resolution_model.py  --csv ../Datasets/dataset_with_priority.csv
python 04_repeat_model.py      --csv ../Datasets/dataset_with_priority.csv
```

### Run example predictions (after training)
```bash
python 01_department_model.py  --predict
python 02_priority_model.py    --predict
python 03_resolution_model.py  --predict
python 04_repeat_model.py      --predict
```

---

##  Model Details

### Model 1 — Department Classification

Predicts which of 8 municipal departments should handle a complaint.

**Why only 2 input features?**
`service_name + service_subtype` are highly informative — the type of complaint almost always determines the department. Adding more features didn't improve accuracy.

**Why 75.5% and not higher?**
Some departments (General Municipal Services, Social & Community) have only 30–38 training records. The model fails on data-scarce classes, not on easy ones.

```
Top performing departments:
  Parking Enforcement  → 90% Precision, 100% Recall
  Waste Management     → 90% Precision,  96% Recall
  Public Works         → 95% Precision,  65% Recall

Struggling:
  General Municipal Services → 0% (only 38 records in entire dataset)
```

---

### Model 2 — Priority Prediction

Predicts complaint urgency using a **hybrid NLP + structured features** approach.

**Feature importance breakdown:**
```
TF-IDF text features  → 85.9%  (captures WHAT the complaint is)
Count features        → 14.1%  (captures HOW OFTEN and WHERE)
```

**Why 99.5% accuracy?**
Priority is structurally determined by `service_name` in this dataset — every service type maps to exactly one priority level with 100% consistency. The TF-IDF representation captures this perfectly.

**Count features used:**
```python
same_location_count        # exact location repeat count
neighborhood_repeat_count  # repeat count in the neighborhood
repeat_issue_flag          # binary: known recurring issue
geo_density                # complaint density in grid cell
high_demand_area_flag      # above-median demand area
service_name_count         # global frequency of service type
neighborhood_service_count
street_service_count
request_hour
is_weekend
```

---

### Model 3 — Resolution Speed Prediction

Predicts whether a complaint will be resolved within 72 hours.

**Three fixes applied (vs original version):**
```
1. Scope    : was trained on 1 service type → now ALL service types (1,000 records)
2. Weight   : class_weight="balanced" → {0: 10, 1: 1}  (10× penalty for missing Slow)
3. Threshold: 0.5 → 0.4  (more conservative → catches more Slow complaints)

Result: Slow-class Recall went from 0% → 81%
```

**Why ROC-AUC instead of Accuracy?**
70.4% of complaints resolve fast. A model that predicts "Fast" for everything gets 70.4% accuracy but is completely useless. ROC-AUC = 0.817 means real discriminative power.

---

### Model 4 — Repeat Pattern Detection

Predicts whether a complaint is a first-time report, a recurring issue, or a persistent problem.

**Why Classification instead of Regression?**
```
Original regression R² = 0.25 — the model learned to predict ~1 for everything
because 85.7% of records have count = 1.

Solution: discretise into 3 classes
  once     → 85.7% of data → handle normally
  twice    → 12.2% of data → flag for follow-up
  3+ times →  2.1% of data → escalate proactively
```

---

##  Shared Utilities (`utils.py`)

All models import from `utils.py`:

```python
from utils import load_and_prepare, make_preprocessor, get_cols
```

- **`load_and_prepare(csv_path)`** — loads CSV and engineers all derived columns (repeat counts, is_fast, repeat_class, problem_text)
- **`make_preprocessor(cat_cols, num_cols)`** — builds a ColumnTransformer with OneHotEncoder + StandardScaler
- **`get_cols(cols, df)`** — filters column list to only existing columns

---

## Data

| File | Description |
|------|-------------|
| [`sf_311_dataset (1).csv`](../Datasets/sf_311_dataset%20(1).csv) | Original raw 311 municipal complaints dataset |
| [`The lastest update to the data for modeling.csv`](../Datasets/The%20lastest%20update%20to%20the%20data%20for%20modeling.csv) | Cleaned dataset with engineered features and priority labels |

See [`Datasets/Readme.md`](../Datasets/Readme.md) for full data documentation.
