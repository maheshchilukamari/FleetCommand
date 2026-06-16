from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Alert, Asset, Driver, MaintenanceRecord, Route, Vehicle
from app.services.ml import driver_risk_score, predictive_maintenance_score


NAMES = [
    "Ava Patel",
    "Marcus Reed",
    "Nina Brooks",
    "Owen Carter",
    "Sophia Nguyen",
    "Liam Flores",
    "Maya Johnson",
    "Ethan Clark",
    "Isla Turner",
    "Noah Bennett",
]


def seed_database(db: Session) -> None:
    if db.query(Vehicle).count() > 0:
        return

    drivers: list[Driver] = []
    for index, name in enumerate(NAMES, start=1):
        speeding = (index * 2) % 11
        braking = (index * 3) % 8
        accel = (index * 4) % 7
        idle = 18 + index * 9
        risk = driver_risk_score(speeding, braking, accel, idle)
        drivers.append(
            Driver(
                name=name,
                license_number=f"DRV-{2026}{index:03d}",
                phone=f"555-010{index}",
                region=["Austin", "Dallas", "Houston", "San Antonio"][index % 4],
                speeding_events=speeding,
                harsh_braking_events=braking,
                rapid_acceleration_events=accel,
                idle_minutes=idle,
                risk_score=risk,
                safety_score=round(100 - risk * 0.72, 1),
            )
        )
    db.add_all(drivers)
    db.flush()

    statuses = ["Active", "Active", "Idle", "Active", "Maintenance", "Offline", "Active", "Idle", "Active", "Active"]
    coords = [
        (30.2672, -97.7431, "Austin Depot"),
        (30.3019, -97.6980, "Mueller District"),
        (30.2266, -97.7666, "South Congress"),
        (30.4014, -97.7227, "Domain Northside"),
        (30.1575, -97.7920, "Buda Service Yard"),
        (30.5083, -97.6789, "Round Rock Hub"),
        (30.2747, -97.7404, "Downtown Austin"),
        (30.2297, -97.8091, "Oak Hill"),
        (30.3511, -97.7158, "North Lamar"),
        (30.1985, -97.8446, "Circle C Ranch"),
    ]
    vehicles: list[Vehicle] = []
    for index, (lat, lng, location) in enumerate(coords, start=1):
        mileage = 18_000 + index * 9_250
        hours = 450 + index * 210
        last_service = date.today() - timedelta(days=25 + index * 23)
        maintenance_score = predictive_maintenance_score(mileage, hours, last_service)
        vehicles.append(
            Vehicle(
                vehicle_id=f"FL-{1000 + index}",
                make=["Ford", "Freightliner", "Mercedes", "Ram"][index % 4],
                model=["Transit", "Sprinter", "M2", "ProMaster"][index % 4],
                year=2020 + (index % 5),
                status=statuses[index - 1],
                driver_id=drivers[index - 1].id,
                latitude=lat,
                longitude=lng,
                location=location,
                speed=0 if statuses[index - 1] in ["Idle", "Maintenance", "Offline"] else 34 + index,
                fuel_level=max(15, 92 - index * 6),
                engine_status="Off" if statuses[index - 1] == "Offline" else "On",
                odometer=mileage,
                engine_hours=hours,
                harsh_braking_events=index % 5,
                rapid_acceleration_events=(index + 2) % 5,
                idle_minutes=12 + index * 4,
                maintenance_indicator=maintenance_score >= 70 or statuses[index - 1] == "Maintenance",
                maintenance_score=maintenance_score,
                fuel_used_today=round(2.2 + index * 0.85, 1),
                distance_today=round(18 + index * 12.4, 1),
                last_updated=datetime.utcnow(),
            )
        )
    db.add_all(vehicles)
    db.flush()

    route_statuses = ["Completed", "In Progress", "Delayed", "Completed"]
    routes = []
    for index in range(1, 21):
        vehicle = vehicles[(index - 1) % len(vehicles)]
        routes.append(
            Route(
                vehicle_id=vehicle.id,
                driver_id=vehicle.driver_id or drivers[0].id,
                start_location=["Austin Depot", "Dallas Hub", "Houston DC", "San Antonio Yard"][index % 4],
                destination=["Waco", "Round Rock", "Killeen", "College Station", "Temple"][index % 5],
                distance_miles=round(34 + index * 6.7, 1),
                travel_time_minutes=45 + index * 8,
                fuel_used_gallons=round(4.2 + index * 0.7, 1),
                status=route_statuses[index % 4],
                started_at=datetime.utcnow() - timedelta(hours=index * 3),
            )
        )
    db.add_all(routes)

    asset_types = ["Trailer", "Laptop", "Tablet", "Liftgate", "Scanner", "Tool Kit"]
    assets = []
    for index in range(1, 31):
        assets.append(
            Asset(
                asset_id=f"AST-{3000 + index}",
                asset_type=asset_types[index % len(asset_types)],
                serial_number=f"SN-FIQ-{index:05d}",
                assigned_user=NAMES[index % len(NAMES)],
                location=["Austin Depot", "Dallas Hub", "Houston DC", "Mobile Unit"][index % 4],
                status=["Assigned", "Available", "In Audit", "Repair"][index % 4],
                purchase_date=date.today() - timedelta(days=380 + index * 19),
                last_audit_date=date.today() - timedelta(days=12 + index * 3),
                warranty_status=["Active", "Expiring Soon", "Expired"][index % 3],
            )
        )
    db.add_all(assets)

    maintenance = []
    for index in range(1, 31):
        vehicle = vehicles[(index - 1) % len(vehicles)]
        last_service = date.today() - timedelta(days=30 + index * 17)
        due = date.today() + timedelta(days=max(4, 80 - index * 5))
        maintenance.append(
            MaintenanceRecord(
                vehicle_id=vehicle.id,
                last_service_date=last_service,
                mileage=vehicle.odometer,
                engine_hours=vehicle.engine_hours,
                predicted_due_date=due,
                service_type=["Oil Change", "Brake Inspection", "Tire Rotation", "Engine Diagnostics"][index % 4],
                priority=["Low", "Medium", "High"][index % 3],
                notes="Generated from FleetIQ predictive maintenance scoring.",
            )
        )
    db.add_all(maintenance)

    alert_types = ["Overspeeding", "Low Fuel", "Maintenance Due", "Vehicle Offline", "High Driver Risk"]
    alerts = []
    for index in range(1, 51):
        vehicle = vehicles[(index - 1) % len(vehicles)]
        driver = drivers[(index - 1) % len(drivers)]
        alert_type = alert_types[index % len(alert_types)]
        alerts.append(
            Alert(
                alert_type=alert_type,
                severity=["Low", "Medium", "High", "Critical"][index % 4],
                message=f"{alert_type} detected for {vehicle.vehicle_id}.",
                vehicle_id=vehicle.id,
                driver_id=driver.id,
                resolved=index % 6 == 0,
                created_at=datetime.utcnow() - timedelta(minutes=index * 11),
            )
        )
    db.add_all(alerts)
    db.commit()
