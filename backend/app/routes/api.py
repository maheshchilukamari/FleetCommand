from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Alert, Asset, Driver, MaintenanceRecord, Route, Vehicle
from app.schemas.api import (
    AlertOut,
    AssetOut,
    AssistantAnswer,
    AssistantQuery,
    DashboardSummary,
    DriverOut,
    MaintenanceOut,
    ReportOut,
    RouteOut,
    VehicleOut,
)
from app.services.assistant import answer_fleet_question
from app.services.reports import build_report
from app.simulator import simulate_vehicle_tick

router = APIRouter()


VEHICLE_NAMES = [
    "Truck 101",
    "Truck 102",
    "Delivery Van 12",
    "Truck 104",
    "Service Van 05",
    "Reefer Truck 106",
    "Truck 107",
    "Delivery Van 18",
    "Yard Tractor 09",
    "Truck 110",
]

ASSET_NAMES = [
    "Dell Latitude 5550",
    "Honeywell CT60 Scanner",
    "Samsung Tab Active5",
    "Trailer Unit 12",
    "Liftgate Assembly 04",
    "Tool Kit 21",
]


def vehicle_name(vehicle: Vehicle | int) -> str:
    index = vehicle.id if isinstance(vehicle, Vehicle) else vehicle
    return VEHICLE_NAMES[(index - 1) % len(VEHICLE_NAMES)]


def enrich_vehicle(db: Session, vehicle: Vehicle) -> dict:
    alerts = db.query(Alert).filter(Alert.vehicle_id == vehicle.id, Alert.resolved.is_(False)).all()
    route = db.query(Route).filter(Route.vehicle_id == vehicle.id).order_by(Route.started_at.desc()).first()
    return {
        "id": vehicle.id,
        "vehicle_id": vehicle.vehicle_id,
        "internal_id": vehicle.vehicle_id,
        "friendly_name": vehicle_name(vehicle),
        "type": f"{vehicle.make} {vehicle.model}",
        "make": vehicle.make,
        "model": vehicle.model,
        "year": vehicle.year,
        "status": vehicle.status,
        "latitude": vehicle.latitude,
        "longitude": vehicle.longitude,
        "location": vehicle.location,
        "speed": vehicle.speed,
        "average_speed": round(max(vehicle.speed * 0.82, 12), 1) if vehicle.status == "Active" else 0,
        "fuel_level": vehicle.fuel_level,
        "engine_status": vehicle.engine_status,
        "odometer": vehicle.odometer,
        "mileage": vehicle.odometer,
        "engine_hours": vehicle.engine_hours,
        "idle_minutes": vehicle.idle_minutes,
        "harsh_braking_events": vehicle.harsh_braking_events,
        "rapid_acceleration_events": vehicle.rapid_acceleration_events,
        "overspeeding_events": len([a for a in alerts if a.alert_type == "Overspeeding"]),
        "maintenance_indicator": vehicle.maintenance_indicator,
        "maintenance_score": vehicle.maintenance_score,
        "fuel_used_today": vehicle.fuel_used_today,
        "distance_today": vehicle.distance_today,
        "gps_accuracy": round(4.2 + (vehicle.id % 4) * 1.1, 1),
        "signal_strength": max(52, 96 - vehicle.id * 4) if vehicle.status != "Offline" else 0,
        "last_signal_timestamp": vehicle.last_updated.isoformat(),
        "last_updated": vehicle.last_updated,
        "current_route": f"{route.start_location} to {route.destination}" if route else "No active route",
        "eta": (datetime.utcnow() + timedelta(minutes=35 + vehicle.id * 4)).isoformat(),
        "alert_count": len(alerts),
        "active_alerts": [a.message for a in alerts[:4]],
        "driver": {
            "id": vehicle.driver.id,
            "name": vehicle.driver.name,
            "license_number": vehicle.driver.license_number,
            "phone": vehicle.driver.phone,
            "region": vehicle.driver.region,
            "speeding_events": vehicle.driver.speeding_events,
            "harsh_braking_events": vehicle.driver.harsh_braking_events,
            "rapid_acceleration_events": vehicle.driver.rapid_acceleration_events,
            "idle_minutes": vehicle.driver.idle_minutes,
            "safety_score": vehicle.driver.safety_score,
            "risk_score": vehicle.driver.risk_score,
        } if vehicle.driver else None,
    }


def enrich_driver(db: Session, driver: Driver) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).first()
    alerts = db.query(Alert).filter(Alert.driver_id == driver.id, Alert.resolved.is_(False)).count()
    return {
        "id": driver.id,
        "name": driver.name,
        "license_number": driver.license_number,
        "phone": driver.phone,
        "region": driver.region,
        "assigned_vehicle_id": vehicle.id if vehicle else None,
        "assigned_vehicle": vehicle_name(vehicle) if vehicle else "Unassigned",
        "status": "Needs Coaching" if driver.risk_score >= 55 else "Available",
        "speeding_events": driver.speeding_events,
        "harsh_braking_events": driver.harsh_braking_events,
        "rapid_acceleration_events": driver.rapid_acceleration_events,
        "idle_minutes": driver.idle_minutes,
        "safety_score": driver.safety_score,
        "risk_score": driver.risk_score,
        "recent_alerts": alerts,
        "monthly_safety_trend": [
            {"month": "Jan", "score": max(50, driver.safety_score - 7)},
            {"month": "Feb", "score": max(50, driver.safety_score - 4)},
            {"month": "Mar", "score": driver.safety_score},
        ],
        "coaching_recommendation": "Review speeding and following distance." if driver.risk_score >= 55 else "Maintain current driving habits.",
    }


def route_path(route: Route) -> list[list[float]]:
    start = [-97.86 + route.id * 0.012, 30.18 + route.id * 0.008]
    mid = [-97.78 + route.id * 0.006, 30.26 + route.id * 0.006]
    end = [-97.62 + route.id * 0.004, 30.34 + route.id * 0.004]
    return [start, mid, end]


def enrich_route(db: Session, route: Route) -> dict:
    vehicle = db.get(Vehicle, route.vehicle_id)
    driver = db.get(Driver, route.driver_id)
    path = route_path(route)
    return {
        "id": route.id,
        "trip_id": f"TRIP-{route.id:04d}",
        "vehicle_id": route.vehicle_id,
        "friendly_vehicle_name": vehicle_name(vehicle) if vehicle else f"Vehicle {route.vehicle_id}",
        "driver_id": route.driver_id,
        "driver_name": driver.name if driver else "Unassigned",
        "start_location": route.start_location,
        "destination": route.destination,
        "start_time": route.started_at.isoformat(),
        "end_time": (route.started_at + timedelta(minutes=route.travel_time_minutes)).isoformat() if route.status == "Completed" else None,
        "eta": (datetime.utcnow() + timedelta(minutes=max(8, route.travel_time_minutes // 3))).isoformat(),
        "distance_miles": route.distance_miles,
        "travel_time_minutes": route.travel_time_minutes,
        "fuel_used_gallons": route.fuel_used_gallons,
        "average_speed": round(route.distance_miles / max(route.travel_time_minutes / 60, 0.25), 1),
        "status": route.status,
        "deviation_status": "On Route" if route.id % 5 else "Minor Deviation",
        "deviation_distance": 0 if route.id % 5 else 1.8,
        "completed_path": path[:2],
        "remaining_path": path[1:],
        "stops": [{"name": f"Stop {idx}", "lng": point[0], "lat": point[1]} for idx, point in enumerate(path, start=1)],
    }


def enrich_asset(asset: Asset) -> dict:
    warranty_expiration = asset.purchase_date + timedelta(days=1095)
    return {
        "id": asset.id,
        "asset_id": asset.asset_id,
        "asset_name": f"{ASSET_NAMES[asset.id % len(ASSET_NAMES)]}",
        "asset_type": asset.asset_type,
        "type": asset.asset_type,
        "serial_number": asset.serial_number,
        "assigned_user": asset.assigned_user,
        "location": asset.location,
        "status": asset.status,
        "purchase_date": asset.purchase_date,
        "last_audit_date": asset.last_audit_date,
        "last_audit": asset.last_audit_date,
        "warranty_status": asset.warranty_status,
        "warranty_expiration": warranty_expiration,
        "audit_history": ["Quarterly audit completed", "Condition verified", "Barcode scan matched"],
        "assignment_history": [f"Assigned to {asset.assigned_user}", "Transferred from central depot"],
        "transfer_history": ["Austin Depot to mobile unit"],
        "service_notes": "No open asset service issues.",
    }


def enrich_maintenance(db: Session, row: MaintenanceRecord) -> dict:
    vehicle = db.get(Vehicle, row.vehicle_id)
    return {
        "id": row.id,
        "vehicle_id": row.vehicle_id,
        "friendly_vehicle_name": vehicle_name(vehicle) if vehicle else f"Vehicle {row.vehicle_id}",
        "vehicle_internal_id": vehicle.vehicle_id if vehicle else str(row.vehicle_id),
        "assigned_driver": vehicle.driver.name if vehicle and vehicle.driver else "Unassigned",
        "status": vehicle.status if vehicle else "Unknown",
        "depot": ["Austin Depot", "Dallas Hub", "Houston DC"][row.id % 3],
        "last_service_date": row.last_service_date,
        "mileage": row.mileage,
        "engine_hours": row.engine_hours,
        "predicted_due_date": row.predicted_due_date,
        "service_type": row.service_type,
        "priority": row.priority,
        "risk_score": vehicle.maintenance_score if vehicle else 50,
        "notes": row.notes,
        "completed_history": ["Oil change", "Tire rotation", "Brake inspection", "Engine diagnostics"],
        "upcoming_services": ["Battery inspection", "Transmission check"],
        "open_issues": ["Inspection scheduled"] if row.priority == "High" else [],
        "service_notes": row.notes,
    }


def enrich_alert(db: Session, alert: Alert) -> dict:
    vehicle = db.get(Vehicle, alert.vehicle_id) if alert.vehicle_id else None
    driver = db.get(Driver, alert.driver_id) if alert.driver_id else None
    return {
        "id": alert.id,
        "alert_id": f"AL-{alert.id:05d}",
        "alert_type": alert.alert_type,
        "type": alert.alert_type,
        "severity": alert.severity,
        "message": alert.message,
        "description": alert.message,
        "vehicle_id": alert.vehicle_id,
        "vehicle_name": vehicle_name(vehicle) if vehicle else "Unassigned vehicle",
        "driver_id": alert.driver_id,
        "driver_name": driver.name if driver else "Unassigned driver",
        "status": "Resolved" if alert.resolved else "Needs Review",
        "resolved": alert.resolved,
        "created_at": alert.created_at,
        "timestamp": alert.created_at.isoformat(),
        "location": vehicle.location if vehicle else "Unknown",
        "recorded_speed": round((vehicle.speed if vehicle else 0) + 8, 1),
        "speed_limit": 55,
        "recommended_action": "Review event, contact driver, and document resolution.",
        "audit_trail": ["Created", "Risk classified"] + (["Resolved"] if alert.resolved else []),
        "related_alerts": [f"AL-{max(1, alert.id - 1):05d}", f"AL-{alert.id + 1:05d}"],
    }


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/demo")
def demo_login() -> dict[str, str]:
    return {"token": "demo-token", "user": "demo@fleetiq.local"}


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(db: Session = Depends(get_db)) -> DashboardSummary:
    vehicles = db.query(Vehicle).all()
    return DashboardSummary(
        total_vehicles=len(vehicles),
        active_vehicles=sum(1 for v in vehicles if v.status == "Active"),
        idle_vehicles=sum(1 for v in vehicles if v.status == "Idle"),
        maintenance_due=sum(1 for v in vehicles if v.maintenance_indicator),
        high_risk_drivers=db.query(Driver).filter(Driver.risk_score >= 50).count(),
        total_distance_today=round(sum(v.distance_today for v in vehicles), 1),
    )


@router.get("/vehicles")
def vehicles(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.query(Vehicle).options(joinedload(Vehicle.driver)).order_by(Vehicle.vehicle_id).all()
    return [enrich_vehicle(db, row) for row in rows]


@router.get("/vehicles/live")
def vehicles_live(db: Session = Depends(get_db)) -> list[dict]:
    simulate_vehicle_tick(db)
    rows = db.query(Vehicle).options(joinedload(Vehicle.driver)).order_by(Vehicle.vehicle_id).all()
    return [enrich_vehicle(db, row) for row in rows]


@router.get("/vehicles/{vehicle_id}")
def vehicle_detail(vehicle_id: int, db: Session = Depends(get_db)) -> dict:
    vehicle = db.query(Vehicle).options(joinedload(Vehicle.driver)).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return enrich_vehicle(db, vehicle)


@router.patch("/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, db: Session = Depends(get_db)) -> dict:
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle.last_updated = datetime.utcnow()
    db.commit()
    return enrich_vehicle(db, vehicle)


@router.get("/drivers")
def drivers(db: Session = Depends(get_db)) -> list[dict]:
    return [enrich_driver(db, row) for row in db.query(Driver).order_by(Driver.risk_score.desc()).all()]


@router.get("/drivers/{driver_id}")
def driver_detail(driver_id: int, db: Session = Depends(get_db)) -> dict:
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return enrich_driver(db, driver)


@router.get("/routes")
def routes(db: Session = Depends(get_db)) -> list[dict]:
    return [enrich_route(db, row) for row in db.query(Route).order_by(Route.started_at.desc()).all()]


@router.get("/routes/{trip_id}/replay")
def route_replay(trip_id: str, db: Session = Depends(get_db)) -> dict:
    route_id = int(trip_id.replace("TRIP-", "")) if trip_id.startswith("TRIP-") else int(trip_id)
    route = db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    path = route_path(route)
    replay = []
    for index in range(18):
        start = path[0 if index < 9 else 1]
        end = path[1 if index < 9 else 2]
        progress = (index % 9) / 8
        replay.append(
            {
                "t": index,
                "lng": round(start[0] + (end[0] - start[0]) * progress, 6),
                "lat": round(start[1] + (end[1] - start[1]) * progress, 6),
            }
        )
    return {"trip_id": f"TRIP-{route.id:04d}", "points": replay}


@router.get("/routes/{trip_id}")
def route_detail(trip_id: str, db: Session = Depends(get_db)) -> dict:
    route_id = int(trip_id.replace("TRIP-", "")) if trip_id.startswith("TRIP-") else int(trip_id)
    route = db.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return enrich_route(db, route)


@router.get("/assets")
def assets(db: Session = Depends(get_db)) -> list[dict]:
    return [enrich_asset(row) for row in db.query(Asset).order_by(Asset.asset_id).all()]


@router.get("/assets/{asset_id}")
def asset_detail(asset_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.get(Asset, asset_id)
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    return enrich_asset(row)


@router.patch("/assets/{asset_id}")
def update_asset(asset_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.get(Asset, asset_id)
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    row.last_audit_date = datetime.utcnow().date()
    db.commit()
    return enrich_asset(row)


@router.get("/maintenance")
def maintenance(db: Session = Depends(get_db)) -> list[dict]:
    return [enrich_maintenance(db, row) for row in db.query(MaintenanceRecord).order_by(MaintenanceRecord.predicted_due_date).all()]


@router.get("/maintenance/{maintenance_id}")
def maintenance_detail(maintenance_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.get(MaintenanceRecord, maintenance_id)
    if not row:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    return enrich_maintenance(db, row)


@router.post("/maintenance/{maintenance_id}/schedule")
def schedule_maintenance(maintenance_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.get(MaintenanceRecord, maintenance_id)
    if not row:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    row.notes = "Service scheduled with Austin Depot."
    db.commit()
    return enrich_maintenance(db, row)


@router.post("/maintenance/{maintenance_id}/complete")
def complete_maintenance(maintenance_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.get(MaintenanceRecord, maintenance_id)
    if not row:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    row.last_service_date = datetime.utcnow().date()
    row.predicted_due_date = datetime.utcnow().date() + timedelta(days=90)
    row.priority = "Low"
    row.notes = "Maintenance completed and next service window recalculated."
    db.commit()
    return enrich_maintenance(db, row)


@router.post("/maintenance/{maintenance_id}/notes")
def add_maintenance_note(maintenance_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.get(MaintenanceRecord, maintenance_id)
    if not row:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    row.notes = "Technician note added: monitor brake wear at next inspection."
    db.commit()
    return enrich_maintenance(db, row)


@router.get("/alerts")
def alerts(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.query(Alert).order_by(Alert.resolved, Alert.created_at.desc()).limit(150).all()
    return [enrich_alert(db, row) for row in rows]


@router.get("/alerts/grouped")
def grouped_alerts(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.query(Alert).filter(Alert.resolved.is_(False)).all()
    grouped: dict[int, dict] = {}
    for alert in rows:
        key = alert.vehicle_id or 0
        item = grouped.setdefault(
            key,
            {
                "vehicle_id": key,
                "vehicle_name": vehicle_name(key) if key else "Unknown Vehicle",
                "assigned_driver": "",
                "risk_score": 0,
                "status": "Needs Review",
                "last_event": alert.created_at.isoformat(),
                "counts": {},
                "severity": alert.severity,
            },
        )
        item["counts"][alert.alert_type] = item["counts"].get(alert.alert_type, 0) + 1
        driver = db.get(Driver, alert.driver_id) if alert.driver_id else None
        item["assigned_driver"] = driver.name if driver else "Unassigned"
        item["risk_score"] = driver.risk_score if driver else 0
    return list(grouped.values())


@router.get("/alerts/{alert_id}")
def alert_detail(alert_id: int, db: Session = Depends(get_db)) -> dict:
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return enrich_alert(db, alert)


@router.patch("/alerts/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)) -> Alert:
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)) -> dict:
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.message = f"{alert.message} Acknowledged by operations."
    db.commit()
    return enrich_alert(db, alert)


@router.post("/alerts/{alert_id}/assign")
def assign_alert(alert_id: int, db: Session = Depends(get_db)) -> dict:
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.message = f"{alert.message} Assigned to fleet supervisor."
    db.commit()
    return enrich_alert(db, alert)


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert_post(alert_id: int, db: Session = Depends(get_db)) -> dict:
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    db.commit()
    return enrich_alert(db, alert)


@router.post("/alerts/{alert_id}/reopen")
def reopen_alert(alert_id: int, db: Session = Depends(get_db)) -> dict:
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = False
    db.commit()
    return enrich_alert(db, alert)


@router.get("/reports", response_model=ReportOut)
def reports(db: Session = Depends(get_db)) -> dict:
    return build_report(db)


@router.get("/reports/summary")
def report_summary(db: Session = Depends(get_db)) -> dict:
    vehicles = [enrich_vehicle(db, v) for v in db.query(Vehicle).all()]
    drivers = [enrich_driver(db, d) for d in db.query(Driver).all()]
    alerts_count = db.query(Alert).filter(Alert.resolved.is_(False), Alert.severity.in_(["High", "Critical"])).count()
    utilization = round(sum(1 for v in vehicles if v["status"] == "Active") / max(len(vehicles), 1) * 100, 1)
    fuel_cost = round(sum(v["fuel_used_today"] for v in vehicles) * 4.12, 2)
    return {
        "fleet_health_score": round(100 - alerts_count * 2.4 - sum(v["maintenance_score"] for v in vehicles) / max(len(vehicles), 1) * 0.25, 1),
        "fleet_utilization": utilization,
        "fuel_cost_today": fuel_cost,
        "cost_per_mile": round(fuel_cost / max(sum(v["distance_today"] for v in vehicles), 1), 2),
        "maintenance_due_this_week": sum(1 for v in vehicles if v["maintenance_indicator"]),
        "critical_alerts": alerts_count,
        "high_risk_drivers": sum(1 for d in drivers if d["risk_score"] >= 55),
        "operational_summary": "Fleet utilization is stable today. Fuel cost is concentrated in the top three active trucks. Maintenance risk remains elevated for vehicles with high mileage and older service dates.",
    }


@router.get("/reports/fuel")
def report_fuel(db: Session = Depends(get_db)) -> dict:
    return build_report(db)


@router.get("/reports/maintenance")
def report_maintenance(db: Session = Depends(get_db)) -> list[dict]:
    return maintenance(db)


@router.get("/reports/drivers")
def report_drivers(db: Session = Depends(get_db)) -> list[dict]:
    return drivers(db)


@router.get("/reports/routes")
def report_routes(db: Session = Depends(get_db)) -> list[dict]:
    return routes(db)


@router.get("/reports/export")
def report_export() -> dict:
    return {"status": "ready", "formats": ["CSV", "PDF placeholder", "Excel placeholder"]}


@router.post("/assistant/query", response_model=AssistantAnswer)
def assistant_query(payload: AssistantQuery, db: Session = Depends(get_db)) -> AssistantAnswer:
    return AssistantAnswer(answer=answer_fleet_question(db, payload.question))


@router.post("/copilot/query")
def copilot_query(payload: AssistantQuery, db: Session = Depends(get_db)) -> dict:
    answer = answer_fleet_question(db, payload.question)
    vehicle = db.query(Vehicle).order_by(Vehicle.maintenance_score.desc()).first()
    return {
        "answer": answer,
        "why": [
            f"{vehicle_name(vehicle)} has maintenance risk {vehicle.maintenance_score:.1f}%" if vehicle else "No vehicle risk available",
            "Risk considers mileage, engine hours, open alerts, and last service window.",
        ],
    }


@router.post("/copilot/quick-action")
def copilot_quick_action(payload: AssistantQuery, db: Session = Depends(get_db)) -> dict:
    action = payload.question.lower()
    if "driver" in action:
        top = db.query(Driver).order_by(Driver.risk_score.desc()).first()
        return {"answer": f"Driver performance focus: {top.name} needs coaching. Risk score {top.risk_score}.", "why": ["Highest risk score", "Recent safety events above fleet average"]}
    if "route" in action:
        route = db.query(Route).order_by(Route.fuel_used_gallons.desc()).first()
        return {"answer": f"Route optimizer: {route.start_location} to {route.destination} has the highest fuel use.", "why": ["Fuel used exceeds route cohort", "Review stop sequence and idle time"]}
    if "fuel" in action:
        vehicle = db.query(Vehicle).order_by(Vehicle.fuel_used_today.desc()).first()
        return {"answer": f"Fuel analytics: {vehicle_name(vehicle)} is today's top fuel consumer.", "why": [f"{vehicle.fuel_used_today:.1f} gallons used today", f"{vehicle.distance_today:.1f} miles traveled"]}
    vehicle = db.query(Vehicle).order_by(Vehicle.maintenance_score.desc()).first()
    return {"answer": f"Vehicle health: schedule {vehicle_name(vehicle)} for service review.", "why": [f"Maintenance risk {vehicle.maintenance_score:.1f}%", f"Odometer {vehicle.odometer:,.0f} miles"]}


@router.get("/monitoring/health")
def monitoring_health(db: Session = Depends(get_db)) -> dict:
    vehicle_count = db.query(Vehicle).count()
    offline = db.query(Vehicle).filter(Vehicle.status == "Offline").count()
    return {
        "system_health_score": 96 - offline * 4,
        "gps_accuracy": "6.4 m avg",
        "api_uptime": "99.98%",
        "database_health": "Healthy",
        "connectivity_health": f"{vehicle_count - offline}/{vehicle_count} vehicles online",
        "active_data_streams": vehicle_count * 8,
        "events_processed_today": 18420,
    }


@router.get("/monitoring/events")
def monitoring_events(db: Session = Depends(get_db)) -> list[dict]:
    vehicles = db.query(Vehicle).order_by(Vehicle.id).limit(10).all()
    now = datetime.utcnow()
    event_types = ["location updated", "speed updated", "fuel reading received", "maintenance score recalculated", "driver safety event processed"]
    return [
        {"timestamp": (now - timedelta(seconds=i * 3)).strftime("%H:%M:%S"), "message": f"{vehicle_name(v)} {event_types[i % len(event_types)]}"}
        for i, v in enumerate(vehicles)
    ]


@router.get("/monitoring/layers/{layer}")
def monitoring_layer(layer: str, db: Session = Depends(get_db)) -> dict:
    layer = layer.lower()
    vehicles = db.query(Vehicle).all()
    if "gps" in layer or "device" in layer:
        return {"title": "Vehicle GPS/IoT Device", "metrics": {"vehicle_signal_status": "9 healthy, 1 offline", "current_coordinates": "Live per vehicle", "gps_accuracy": "4-8 m", "last_signal": "Under 10 seconds", "signal_strength": "84% avg"}}
    if "cell" in layer or "network" in layer:
        return {"title": "Cellular Network", "metrics": {"connected_vehicles": len([v for v in vehicles if v.status != "Offline"]), "offline_vehicles": len([v for v in vehicles if v.status == "Offline"]), "weak_signal_vehicles": 2, "average_latency": "82 ms", "data_transmitted_today": "1.8 GB"}}
    if "api" in layer:
        return {"title": "Backend API", "metrics": {"api_health": "Healthy", "requests_today": 12480, "average_response_time": "74 ms", "failed_requests": 3, "uptime": "99.98%"}}
    if "database" in layer:
        return {"title": "PostgreSQL Database", "metrics": {"database_status": "Healthy", "records_count": 430, "vehicle_records": len(vehicles), "trip_records": db.query(Route).count(), "alert_records": db.query(Alert).count(), "query_response_time": "18 ms"}}
    return {"title": "Live Dashboard", "metrics": {"gps_updates_per_hour": 14400, "speed_updates_per_hour": 14400, "fuel_readings_per_hour": 3600, "maintenance_events_per_day": 84, "driver_events_per_day": 126}}
