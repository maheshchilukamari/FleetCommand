CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  license_number VARCHAR(40) UNIQUE NOT NULL,
  phone VARCHAR(40) NOT NULL,
  region VARCHAR(80) NOT NULL,
  speeding_events INTEGER DEFAULT 0,
  harsh_braking_events INTEGER DEFAULT 0,
  rapid_acceleration_events INTEGER DEFAULT 0,
  idle_minutes INTEGER DEFAULT 0,
  safety_score DOUBLE PRECISION DEFAULT 95,
  risk_score DOUBLE PRECISION DEFAULT 8
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(40) UNIQUE NOT NULL,
  make VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL,
  driver_id INTEGER REFERENCES drivers(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location VARCHAR(120) NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,
  fuel_level DOUBLE PRECISION DEFAULT 100,
  engine_status VARCHAR(30) DEFAULT 'On',
  odometer DOUBLE PRECISION DEFAULT 0,
  engine_hours DOUBLE PRECISION DEFAULT 0,
  harsh_braking_events INTEGER DEFAULT 0,
  rapid_acceleration_events INTEGER DEFAULT 0,
  idle_minutes INTEGER DEFAULT 0,
  maintenance_indicator BOOLEAN DEFAULT FALSE,
  maintenance_score DOUBLE PRECISION DEFAULT 15,
  fuel_used_today DOUBLE PRECISION DEFAULT 0,
  distance_today DOUBLE PRECISION DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  driver_id INTEGER NOT NULL REFERENCES drivers(id),
  start_location VARCHAR(120) NOT NULL,
  destination VARCHAR(120) NOT NULL,
  distance_miles DOUBLE PRECISION NOT NULL,
  travel_time_minutes INTEGER NOT NULL,
  fuel_used_gallons DOUBLE PRECISION NOT NULL,
  status VARCHAR(30) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(40) UNIQUE NOT NULL,
  asset_type VARCHAR(80) NOT NULL,
  serial_number VARCHAR(80) UNIQUE NOT NULL,
  assigned_user VARCHAR(120) NOT NULL,
  location VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL,
  purchase_date DATE NOT NULL,
  last_audit_date DATE NOT NULL,
  warranty_status VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  last_service_date DATE NOT NULL,
  mileage DOUBLE PRECISION NOT NULL,
  engine_hours DOUBLE PRECISION NOT NULL,
  predicted_due_date DATE NOT NULL,
  service_type VARCHAR(80) NOT NULL,
  priority VARCHAR(30) NOT NULL,
  notes VARCHAR(240) NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(60) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message VARCHAR(240) NOT NULL,
  vehicle_id INTEGER REFERENCES vehicles(id),
  driver_id INTEGER REFERENCES drivers(id),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO drivers (name, license_number, phone, region, speeding_events, harsh_braking_events, rapid_acceleration_events, idle_minutes, safety_score, risk_score)
SELECT
  names.name,
  'DRV-2026' || LPAD(gs::text, 3, '0'),
  '555-010' || gs,
  (ARRAY['Austin','Dallas','Houston','San Antonio'])[1 + (gs % 4)],
  (gs * 2) % 11,
  (gs * 3) % 8,
  (gs * 4) % 7,
  18 + gs * 9,
  94 - gs * 2.7,
  10 + gs * 6.3
FROM generate_series(1, 10) AS gs
JOIN (
  VALUES
    (1, 'Ava Patel'), (2, 'Marcus Reed'), (3, 'Nina Brooks'), (4, 'Owen Carter'), (5, 'Sophia Nguyen'),
    (6, 'Liam Flores'), (7, 'Maya Johnson'), (8, 'Ethan Clark'), (9, 'Isla Turner'), (10, 'Noah Bennett')
) AS names(id, name) ON names.id = gs
ON CONFLICT (license_number) DO NOTHING;

INSERT INTO vehicles (vehicle_id, make, model, year, status, driver_id, latitude, longitude, location, speed, fuel_level, odometer, engine_hours, harsh_braking_events, rapid_acceleration_events, idle_minutes, maintenance_indicator, maintenance_score, fuel_used_today, distance_today)
SELECT
  'FL-' || (1000 + gs),
  (ARRAY['Ford','Freightliner','Mercedes','Ram'])[1 + (gs % 4)],
  (ARRAY['Transit','Sprinter','M2','ProMaster'])[1 + (gs % 4)],
  2020 + (gs % 5),
  (ARRAY['Active','Active','Idle','Active','Maintenance','Offline','Active','Idle','Active','Active'])[gs],
  gs,
  30.18 + gs * 0.025,
  -97.86 + gs * 0.018,
  (ARRAY['Austin Depot','Mueller District','South Congress','Domain Northside','Buda Service Yard','Round Rock Hub','Downtown Austin','Oak Hill','North Lamar','Circle C Ranch'])[gs],
  CASE WHEN gs IN (3,5,6,8) THEN 0 ELSE 34 + gs END,
  92 - gs * 6,
  18000 + gs * 9250,
  450 + gs * 210,
  gs % 5,
  (gs + 2) % 5,
  12 + gs * 4,
  gs IN (5,9,10),
  12 + gs * 8.2,
  ROUND((2.2 + gs * 0.85)::numeric, 1),
  ROUND((18 + gs * 12.4)::numeric, 1)
FROM generate_series(1, 10) AS gs
ON CONFLICT (vehicle_id) DO NOTHING;

INSERT INTO routes (vehicle_id, driver_id, start_location, destination, distance_miles, travel_time_minutes, fuel_used_gallons, status, started_at)
SELECT
  1 + ((gs - 1) % 10),
  1 + ((gs - 1) % 10),
  (ARRAY['Austin Depot','Dallas Hub','Houston DC','San Antonio Yard'])[1 + (gs % 4)],
  (ARRAY['Waco','Round Rock','Killeen','College Station','Temple'])[1 + (gs % 5)],
  ROUND((34 + gs * 6.7)::numeric, 1),
  45 + gs * 8,
  ROUND((4.2 + gs * 0.7)::numeric, 1),
  (ARRAY['Completed','In Progress','Delayed','Completed'])[1 + (gs % 4)],
  NOW() - (gs || ' hours')::interval
FROM generate_series(1, 20) AS gs;

INSERT INTO assets (asset_id, asset_type, serial_number, assigned_user, location, status, purchase_date, last_audit_date, warranty_status)
SELECT
  'AST-' || (3000 + gs),
  (ARRAY['Trailer','Laptop','Tablet','Liftgate','Scanner','Tool Kit'])[1 + (gs % 6)],
  'SN-FIQ-' || LPAD(gs::text, 5, '0'),
  (SELECT name FROM drivers WHERE id = 1 + (gs % 10)),
  (ARRAY['Austin Depot','Dallas Hub','Houston DC','Mobile Unit'])[1 + (gs % 4)],
  (ARRAY['Assigned','Available','In Audit','Repair'])[1 + (gs % 4)],
  CURRENT_DATE - (380 + gs * 19),
  CURRENT_DATE - (12 + gs * 3),
  (ARRAY['Active','Expiring Soon','Expired'])[1 + (gs % 3)]
FROM generate_series(1, 30) AS gs
ON CONFLICT (asset_id) DO NOTHING;

INSERT INTO maintenance_records (vehicle_id, last_service_date, mileage, engine_hours, predicted_due_date, service_type, priority, notes)
SELECT
  1 + ((gs - 1) % 10),
  CURRENT_DATE - (30 + gs * 17),
  18000 + gs * 9250,
  450 + gs * 210,
  CURRENT_DATE + GREATEST(4, 80 - gs * 5),
  (ARRAY['Oil Change','Brake Inspection','Tire Rotation','Engine Diagnostics'])[1 + (gs % 4)],
  (ARRAY['Low','Medium','High'])[1 + (gs % 3)],
  'Generated from FleetIQ predictive maintenance scoring.'
FROM generate_series(1, 30) AS gs;

INSERT INTO alerts (alert_type, severity, message, vehicle_id, driver_id, resolved, created_at)
SELECT
  alert_type,
  (ARRAY['Low','Medium','High','Critical'])[1 + (gs % 4)],
  alert_type || ' detected for FL-' || (1000 + (1 + ((gs - 1) % 10))) || '.',
  1 + ((gs - 1) % 10),
  1 + ((gs - 1) % 10),
  gs % 6 = 0,
  NOW() - (gs * 11 || ' minutes')::interval
FROM generate_series(1, 50) AS gs
CROSS JOIN LATERAL (
  SELECT (ARRAY['Overspeeding','Low Fuel','Maintenance Due','Vehicle Offline','High Driver Risk'])[1 + (gs % 5)] AS alert_type
) AS alert_data;
