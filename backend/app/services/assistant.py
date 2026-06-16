from sqlalchemy.orm import Session

from app.models import Driver, Vehicle


def answer_fleet_question(db: Session, question: str) -> str:
    q = question.lower().strip()
    vehicles = db.query(Vehicle).all()
    drivers = db.query(Driver).all()

    if "maintenance" in q:
        due = [v.vehicle_id for v in vehicles if v.maintenance_indicator or v.maintenance_score >= 70]
        return f"Vehicles needing maintenance attention: {', '.join(due) if due else 'none right now'}."
    if "highest risk" in q or "high risk" in q or "driver" in q and "risk" in q:
        driver = max(drivers, key=lambda d: d.risk_score)
        return f"{driver.name} has the highest driver risk score at {driver.risk_score}."
    if "most fuel" in q or "fuel" in q:
        vehicle = max(vehicles, key=lambda v: v.fuel_used_today)
        return f"{vehicle.vehicle_id} used the most fuel today at {vehicle.fuel_used_today:.1f} gallons."
    if "active" in q:
        count = sum(1 for v in vehicles if v.status == "Active")
        return f"{count} vehicles are currently active."
    if "offline" in q:
        offline = [v.vehicle_id for v in vehicles if v.status == "Offline"]
        return f"Offline vehicles: {', '.join(offline) if offline else 'none'}."
    return (
        "I can answer demo fleet questions about maintenance, highest-risk drivers, fuel use, active vehicles, "
        "and offline vehicles. The OpenAI API hook is isolated so a live LLM can be added with OPENAI_API_KEY."
    )
