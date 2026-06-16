from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DriverOut(BaseModel):
    id: int
    name: str
    license_number: str
    phone: str
    region: str
    speeding_events: int
    harsh_braking_events: int
    rapid_acceleration_events: int
    idle_minutes: int
    safety_score: float
    risk_score: float

    model_config = ConfigDict(from_attributes=True)


class VehicleOut(BaseModel):
    id: int
    vehicle_id: str
    make: str
    model: str
    year: int
    status: str
    latitude: float
    longitude: float
    location: str
    speed: float
    fuel_level: float
    engine_status: str
    odometer: float
    engine_hours: float
    harsh_braking_events: int
    rapid_acceleration_events: int
    idle_minutes: int
    maintenance_indicator: bool
    maintenance_score: float
    fuel_used_today: float
    distance_today: float
    last_updated: datetime
    driver: DriverOut | None

    model_config = ConfigDict(from_attributes=True)


class RouteOut(BaseModel):
    id: int
    vehicle_id: int
    driver_id: int
    start_location: str
    destination: str
    distance_miles: float
    travel_time_minutes: int
    fuel_used_gallons: float
    status: str
    started_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssetOut(BaseModel):
    id: int
    asset_id: str
    asset_type: str
    serial_number: str
    assigned_user: str
    location: str
    status: str
    purchase_date: date
    last_audit_date: date
    warranty_status: str

    model_config = ConfigDict(from_attributes=True)


class MaintenanceOut(BaseModel):
    id: int
    vehicle_id: int
    last_service_date: date
    mileage: float
    engine_hours: float
    predicted_due_date: date
    service_type: str
    priority: str
    notes: str

    model_config = ConfigDict(from_attributes=True)


class AlertOut(BaseModel):
    id: int
    alert_type: str
    severity: str
    message: str
    vehicle_id: int | None
    driver_id: int | None
    resolved: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    total_vehicles: int
    active_vehicles: int
    idle_vehicles: int
    maintenance_due: int
    high_risk_drivers: int
    total_distance_today: float


class ReportOut(BaseModel):
    fuel_usage: list[dict]
    distance_traveled: list[dict]
    maintenance_risk: list[dict]
    driver_safety: list[dict]
    vehicle_status_distribution: list[dict]


class AssistantQuery(BaseModel):
    question: str


class AssistantAnswer(BaseModel):
    answer: str
    source: str = "FleetIQ demo assistant"
