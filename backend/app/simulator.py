from datetime import datetime
from random import choice, random, uniform

from sqlalchemy.orm import Session

from app.models import Alert, Vehicle
from app.services.ml import predictive_maintenance_score


def simulate_vehicle_tick(db: Session) -> list[Vehicle]:
    vehicles = db.query(Vehicle).all()
    for vehicle in vehicles:
        road_type = _road_type(vehicle)
        traffic = _traffic_condition(vehicle)
        if vehicle.status == "Offline":
            vehicle.speed = 0
            vehicle.engine_status = "Off"
        elif vehicle.status == "Maintenance":
            vehicle.speed = 0
            vehicle.engine_status = "Service"
        else:
            vehicle.latitude += uniform(-0.0009, 0.0011)
            vehicle.longitude += uniform(-0.0011, 0.0009)
            if vehicle.status == "Idle":
                vehicle.speed = _approach(vehicle.speed, uniform(0, 4), uniform(0.6, 1.4))
                vehicle.idle_minutes += 1
                vehicle.fuel_level = round(max(vehicle.fuel_level - 0.015, 0), 1)
                vehicle.engine_hours = round(vehicle.engine_hours + 0.015, 2)
            else:
                low, high = _speed_range(road_type, traffic)
                target_speed = uniform(low, high)
                vehicle.speed = _approach(vehicle.speed, target_speed, uniform(2.5, 5.5))
                vehicle.distance_today = round(vehicle.distance_today + vehicle.speed / 120, 1)
                vehicle.odometer = round(vehicle.odometer + vehicle.speed / 120, 1)
                vehicle.fuel_used_today = round(vehicle.fuel_used_today + vehicle.speed / 900, 2)
                vehicle.fuel_level = round(max(vehicle.fuel_level - max(vehicle.speed, 1) / 2500, 0), 1)
                vehicle.engine_hours = round(vehicle.engine_hours + 0.02, 2)
                if vehicle.speed < 8 and random() > 0.8:
                    vehicle.idle_minutes += 1
                if random() > 0.965:
                    vehicle.harsh_braking_events += 1
                if random() > 0.965:
                    vehicle.rapid_acceleration_events += 1

        vehicle.maintenance_score = predictive_maintenance_score(
            vehicle.odometer,
            vehicle.engine_hours,
            datetime.utcnow().date(),
        )
        vehicle.maintenance_indicator = vehicle.maintenance_indicator or vehicle.maintenance_score > 78
        vehicle.last_updated = datetime.utcnow()

        if vehicle.fuel_level < 15 and random() > 0.85:
            db.add(
                Alert(
                    alert_type="Low Fuel",
                    severity="High",
                    message=f"{vehicle.vehicle_id} fuel level is below 15%.",
                    vehicle_id=vehicle.id,
                    driver_id=vehicle.driver_id,
                )
            )
        if vehicle.speed > 68 and random() > 0.88:
            db.add(
                Alert(
                    alert_type="Overspeeding",
                    severity="Medium",
                    message=f"{vehicle.vehicle_id} exceeded fleet speed policy.",
                    vehicle_id=vehicle.id,
                    driver_id=vehicle.driver_id,
                )
            )
    db.commit()
    return vehicles


def _approach(current: float, target: float, rate: float) -> float:
    if current < target:
        return round(min(current + rate, target), 1)
    return round(max(current - rate, target), 1)


def _road_type(vehicle: Vehicle) -> str:
    if "Depot" in vehicle.location or "Yard" in vehicle.location:
        return "Depot"
    if vehicle.id % 4 == 0:
        return "Highway"
    if vehicle.id % 5 == 0:
        return "Stop"
    return choice(["City", "City", "Highway"])


def _traffic_condition(vehicle: Vehicle) -> str:
    if vehicle.idle_minutes > 45 or vehicle.id % 3 == 0:
        return "Heavy"
    return choice(["Light", "Moderate", "Moderate"])


def _speed_range(road_type: str, traffic: str) -> tuple[int, int]:
    if road_type == "Stop":
        return (0, 0)
    if road_type == "Depot":
        return (0, 15)
    if traffic == "Heavy":
        return (5, 25)
    if road_type == "Highway":
        return (55, 75)
    return (20, 45)
