from datetime import date

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler


def predictive_maintenance_score(mileage: float, engine_hours: float, last_service_date: date) -> float:
    days_since_service = max((date.today() - last_service_date).days, 0)
    samples = np.array(
        [
            [12_000, 450, 35],
            [28_000, 900, 120],
            [45_000, 1_550, 210],
            [75_000, 2_700, 340],
            [105_000, 3_800, 460],
        ],
        dtype=float,
    )
    targets = np.array([8, 24, 48, 74, 92], dtype=float)
    model = RandomForestRegressor(n_estimators=30, random_state=42)
    model.fit(samples, targets)
    score = float(model.predict(np.array([[mileage, engine_hours, days_since_service]], dtype=float))[0])
    return round(min(max(score, 0), 100), 1)


def driver_risk_score(speeding: int, harsh_braking: int, rapid_accel: int, idle_minutes: int) -> float:
    raw = np.array([[speeding * 4.5, harsh_braking * 5.5, rapid_accel * 4.2, idle_minutes * 0.18]])
    scaler = MinMaxScaler(feature_range=(0, 100))
    reference = np.array(
        [
            [0, 0, 0, 0],
            [20, 15, 15, 60],
            [55, 45, 35, 240],
            [90, 75, 65, 520],
        ],
        dtype=float,
    )
    scaler.fit(reference)
    normalized = scaler.transform(raw)[0]
    score = normalized.mean()
    return round(min(max(float(score), 0), 100), 1)
