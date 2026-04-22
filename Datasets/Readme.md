# CivicMind — Data

This folder contains the datasets used to train and evaluate the CivicMind AI pipeline.

---

## Files

| File | Records | Columns | Description |
|------|---------|---------|-------------|
| `sf_311_dataset.csv` | ~28,000 | 14 | Original raw 311 complaints dataset |
| `dataset_with_priority.csv` | 1,000 | 35 | Cleaned, engineered, and labeled dataset used for training |

---

## sf_311_dataset.csv — Original Raw Dataset

The source dataset is modeled after San Francisco's public 311 service request data. It contains raw citizen complaints with minimal preprocessing.

**Key columns:**
```
service_request_id    unique complaint ID
requested_datetime    when the complaint was submitted
closed_date           when it was resolved
service_name          primary complaint category
service_subtype       specific issue type
address / street      location (free text)
analysis_neighborhood named neighborhood
police_district       policing jurisdiction
lat / long            GPS coordinates
status_description    current status (e.g. "Closed")
```

**Why this dataset was not used directly for training:**
- Department labels were fragmented, noisy, and heavily imbalanced
- No priority labels existed
- No engineered features (repeat counts, geo density, etc.)
- Some columns had high missing-value rates

---

## dataset_with_priority.csv — Training Dataset

This is the cleaned, restructured, and feature-engineered version used to train all four models.

### What changed from the raw dataset

**1. Department restructuring**
The original dataset had 40+ fragmented department labels. These were manually consolidated into 8 operationally meaningful categories:

| Department | Records |
|-----------|---------|
| Public Works – Cleaning & Infrastructure | 420 |
| Waste Management Services | 240 |
| Parking Enforcement | 95 |
| Urban Services | 73 |
| Transportation Infrastructure Services | 64 |
| General Municipal Services | 38 |
| Social and Community Services | 36 |
| Regulatory and Inspection Services | 34 |

**2. Priority labels added (manual domain labeling)**

Each service type was manually assigned a priority level based on public safety implications:

| Priority | Examples |
|----------|---------|
| **High** | Sewer Issues, Encampments, Tree Maintenance, Street Defects, Streetlights |
| **Medium** | Street Cleaning, Parking Enforcement, Noise Report, Illegal Postings |
| **Low** | Graffiti, 311 External Request |

**3. Engineered columns added**

| Column | Description |
|--------|-------------|
| `resolution_time_hours` | Time to resolve in decimal hours |
| `request_hour` | Hour of day (0–23) |
| `day_of_week` | Weekday name |
| `is_weekend` | 1 if Saturday/Sunday |
| `service_name_count` | Global frequency of this service type |
| `neighborhood_service_count` | Service frequency in this neighborhood |
| `street_service_count` | Service frequency on this street |
| `geo_density` | Complaint density in lat/long grid cell |
| `repeat_issue_flag` | 1 if this is a known recurring issue |
| `high_demand_area_flag` | 1 if neighborhood is above-median demand |
| `avg_resolution_by_service` | Average resolution time for this service type |
| `avg_resolution_by_neighborhood` | Average resolution time for this neighborhood |

**4. Columns computed at training time (not stored in CSV)**

These are computed by `utils.load_and_prepare()` when training:

| Column | How computed |
|--------|-------------|
| `problem_text` | `service_name + ' ' + service_subtype` (for TF-IDF) |
| `same_location_count` | groupby (service, subtype, neighborhood, street) |
| `neighborhood_repeat_count` | groupby (neighborhood, service) |
| `street_repeat_count` | groupby (street, service) |
| `district_repeat_count` | groupby (police_district, service) |
| `is_fast` | `resolution_time_hours <= 72` → 0 or 1 |
| `repeat_class` | `1 → "once"`, `2 → "twice"`, `3+ → "3+ times"` |

---

## Data Split

All models use the same split strategy:

```
Train : 80%   (random_state=42, stratify=y)
Test  : 20%
```

No data is removed or modified from `dataset_with_priority.csv` before training.
