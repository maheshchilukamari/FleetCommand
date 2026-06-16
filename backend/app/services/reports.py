from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Driver, Vehicle


def build_report(db: Session) -> dict:
    vehicles = db.query(Vehicle).all()
    drivers = db.query(Driver).all()
    status_rows = db.query(Vehicle.status, func.count(Vehicle.id)).group_by(Vehicle.status).all()
    return {
        "fuel_usage": [{"name": v.vehicle_id, "value": round(v.fuel_used_today, 1)} for v in vehicles],
        "distance_traveled": [{"name": v.vehicle_id, "value": round(v.distance_today, 1)} for v in vehicles],
        "maintenance_risk": [{"name": v.vehicle_id, "value": round(v.maintenance_score, 1)} for v in vehicles],
        "driver_safety": [{"name": d.name, "value": round(d.safety_score, 1)} for d in drivers],
        "vehicle_status_distribution": [{"name": status, "value": count} for status, count in status_rows],
    }
