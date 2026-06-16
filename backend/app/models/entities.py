from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    license_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    region: Mapped[str] = mapped_column(String(80), nullable=False)
    speeding_events: Mapped[int] = mapped_column(Integer, default=0)
    harsh_braking_events: Mapped[int] = mapped_column(Integer, default=0)
    rapid_acceleration_events: Mapped[int] = mapped_column(Integer, default=0)
    idle_minutes: Mapped[int] = mapped_column(Integer, default=0)
    safety_score: Mapped[float] = mapped_column(Float, default=95)
    risk_score: Mapped[float] = mapped_column(Float, default=8)

    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="driver")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    make: Mapped[str] = mapped_column(String(80), nullable=False)
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Active")
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=False)
    speed: Mapped[float] = mapped_column(Float, default=0)
    fuel_level: Mapped[float] = mapped_column(Float, default=100)
    engine_status: Mapped[str] = mapped_column(String(30), default="On")
    odometer: Mapped[float] = mapped_column(Float, default=0)
    engine_hours: Mapped[float] = mapped_column(Float, default=0)
    harsh_braking_events: Mapped[int] = mapped_column(Integer, default=0)
    rapid_acceleration_events: Mapped[int] = mapped_column(Integer, default=0)
    idle_minutes: Mapped[int] = mapped_column(Integer, default=0)
    maintenance_indicator: Mapped[bool] = mapped_column(Boolean, default=False)
    maintenance_score: Mapped[float] = mapped_column(Float, default=15)
    fuel_used_today: Mapped[float] = mapped_column(Float, default=0)
    distance_today: Mapped[float] = mapped_column(Float, default=0)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    driver: Mapped[Driver | None] = relationship(back_populates="vehicles")
    maintenance_records: Mapped[list["MaintenanceRecord"]] = relationship(back_populates="vehicle")


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=False)
    start_location: Mapped[str] = mapped_column(String(120), nullable=False)
    destination: Mapped[str] = mapped_column(String(120), nullable=False)
    distance_miles: Mapped[float] = mapped_column(Float, nullable=False)
    travel_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    fuel_used_gallons: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    asset_id: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    asset_type: Mapped[str] = mapped_column(String(80), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    assigned_user: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False)
    last_audit_date: Mapped[date] = mapped_column(Date, nullable=False)
    warranty_status: Mapped[str] = mapped_column(String(40), nullable=False)


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    last_service_date: Mapped[date] = mapped_column(Date, nullable=False)
    mileage: Mapped[float] = mapped_column(Float, nullable=False)
    engine_hours: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_due_date: Mapped[date] = mapped_column(Date, nullable=False)
    service_type: Mapped[str] = mapped_column(String(80), nullable=False)
    priority: Mapped[str] = mapped_column(String(30), nullable=False)
    notes: Mapped[str] = mapped_column(String(240), nullable=False)

    vehicle: Mapped[Vehicle] = relationship(back_populates="maintenance_records")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alert_type: Mapped[str] = mapped_column(String(60), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(String(240), nullable=False)
    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id"))
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"))
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
