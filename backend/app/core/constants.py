from __future__ import annotations

HIGH_RISK_SERVICES = {
    "Encampments",
    "Graffiti",
    "Streetlights",
    "Abandoned Vehicle",
    "Damaged Property",
    "Sewer Issues",
    "Flooding",
    "Tree Maintenance",
}

SERVICE_NAME_MAP = {
    "infrastructure": "Roads & Infrastructure",
    "sanitation": "Sanitation & Waste",
    "parks": "Parks & Recreation",
    "safety": "Public Safety",
    "utilities": "Water & Utilities",
    "other": "Other",
}

SERVICE_NAME_FALLBACK = {
    "infrastructure": "General Request - PUBLIC WORKS",
    "sanitation": "Street and Sidewalk Cleaning",
    "parks": "Tree Maintenance",
    "safety": "Noise Report",
    "utilities": "Sewer Issues",
    "other": "MUNI Feedback",
}
