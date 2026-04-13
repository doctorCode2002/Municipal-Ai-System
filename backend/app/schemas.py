from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ReportRequest(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    category: str
    location: str
    service_subtype: Optional[str] = None
    analysis_neighborhood: Optional[str] = None
    police_district: Optional[str] = None
    geo_density: Optional[float] = None
    high_demand_area_flag: Optional[int] = None
    repeat_issue_flag: Optional[int] = None
    service_name_count: Optional[int] = None
    neighborhood_service_count: Optional[int] = None
    street_service_count: Optional[int] = None
    agency_request_count: Optional[int] = None


class ReportResponse(BaseModel):
    report_id: str
    agency: str
    priority: str
    status: str
    department: Optional[str] = None
    resolution_speed: Optional[str] = None
    repeat_pattern: Optional[str] = None


class AuthUser(BaseModel):
    id: int
    email: Optional[str] = None
    username: str
    role: str
    department: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: AuthUser


class SignUpRequest(BaseModel):
    email: str
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class SignInRequest(BaseModel):
    username: str
    password: str


class ReportItem(BaseModel):
    id: int
    report_id: str
    title: str
    description: str
    category: str
    location: str
    department: Optional[str] = None
    agency: str
    priority: str
    status: str
    created_at: str
    user_id: Optional[int] = None
    resolution_speed: Optional[str] = None
    repeat_pattern: Optional[str] = None


class MetricsItem(BaseModel):
    title: str
    value: str
    change: str
    color: str
    bg: str
    border: str
    icon: str


class ManagerItem(BaseModel):
    id: int
    name: str
    email: Optional[str]
    dept: Optional[str]
    status: str


class StatusUpdateRequest(BaseModel):
    status: str


class DepartmentUpdateRequest(BaseModel):
    department: str


class DepartmentCreateRequest(BaseModel):
    name: str


class DepartmentItem(BaseModel):
    id: int
    name: str


class ReassignRequestCreate(BaseModel):
    reason: str
    requested_department: Optional[str] = None


class ReassignRequestItem(BaseModel):
    id: int
    report_id: str
    from_department: str
    requested_department: Optional[str]
    reason: str
    status: str
    created_at: str


class ManagerCreateRequest(BaseModel):
    username: str = Field(..., min_length=3)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    department: str


class ManagerUpdateRequest(BaseModel):
    email: Optional[str] = None
    department: Optional[str] = None


class CategoryRequest(BaseModel):
    title: str
    description: str


class CategoryResponse(BaseModel):
    category: str
    confidence: float
