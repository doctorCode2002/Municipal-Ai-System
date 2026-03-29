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

AGENCY_TO_DEPARTMENT = {
    "311 Supervisor Queue": "Admin / 311",
    "Duplicate Case Hold Queue": "Admin / 311",
    "Muni Feedback Received Queue": "Admin / 311",
    "DPW - Bureau of Street Environmental Services - G": "Public Works",
    "DPW BSM Queue": "Public Works",
    "DPW BSSR Queue": "Public Works",
    "DPW Ops Queue": "Public Works",
    "DPT Abandoned Vehicles Work Queue": "Transportation & Parking",
    "DPT Meter_Bike Queue": "Transportation & Parking",
    "DPT SignShop Queue": "Transportation & Parking",
    "DPT Signal Queue": "Transportation & Parking",
    "SFMTA - Access/Mobility Services Received Queue": "Transportation & Parking",
    "SFMTA - Parking Enforcement - G": "Transportation & Parking",
    "Parking Enforcement Dispatch Queue": "Transportation & Parking",
    "Parking Enforcement Review Queue": "Transportation & Parking",
    "PUC - Water - G": "Utilities (Water/Sewer/Streetlights)",
    "PUC Sewer Ops": "Utilities (Water/Sewer/Streetlights)",
    "PUC Streetlights Queue": "Utilities (Water/Sewer/Streetlights)",
    "Recology_Abandoned": "Sanitation / Recology",
    "Recology_Litter": "Sanitation / Recology",
    "Recology_Overflowing": "Sanitation / Recology",
    "RPD Park Service Area 1 Queue": "Parks & Recreation",
    "Noise Report Queue": "Public Safety / Noise",
    "HSOC Queue": "Homeless Services",
    "Clear Channel - Transit Queue": "Transportation & Parking",
    "MUNI Work Queue": "Transportation & Parking",
    "SSP - MTA Feedback Queue": "Transportation & Parking",
    "US Postal Service Maintenance Queue": "External Agencies",
}
