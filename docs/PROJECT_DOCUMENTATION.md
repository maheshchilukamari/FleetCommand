# FleetCommand Project Documentation

## Overview

FleetCommand is an intelligent fleet and asset operations platform. It is built as a full-stack portfolio project with a React frontend, FastAPI backend, PostgreSQL database, simulated telematics pipeline, predictive scoring, operational dashboards, route intelligence, asset governance, grouped alerts, executive reports, and a rule-based LLM-ready Copilot.

The app supports two operating modes:

- **Full-stack local mode:** Docker Compose runs React, FastAPI, and PostgreSQL.
- **GitHub Pages demo mode:** The frontend runs as a static app using realistic in-browser demo data.

## Core User Flow

1. User opens FleetCommand.
2. User clicks **Demo user login**.
3. The protected app shell opens.
4. User navigates through Dashboard, Live Tracking, Routes, Drivers, Assets, Maintenance, Alerts, Reports, Copilot, and Telematics.
5. Interactive controls update filters, sorting, selected records, detail panels, and local UI state.

## Authentication

Authentication is intentionally demo-friendly:

- `POST /auth/demo` returns a demo token.
- The frontend stores the token in `localStorage`.
- Protected routes redirect unauthenticated users to `/login`.

This can later be replaced with OAuth/OIDC, JWT refresh tokens, and role-based access control.

## Dashboard

The dashboard is the executive operations landing view.

Functions:

- Fleet Health Score
- Total Vehicles
- Active Vehicles
- Idle Vehicles
- Offline Vehicles
- Maintenance Due
- Critical Alerts
- High-Risk Drivers
- Distance Today
- Estimated Fuel Cost Today
- Fleet Utilization

Interactive behavior:

- Active vehicle KPI opens live tracking.
- Maintenance KPI opens maintenance.
- Critical alert KPI opens alerts.
- High-risk driver KPI opens drivers.
- Dashboard lists top risk vehicles, top risk drivers, maintenance candidates, active alerts, fuel cost summary, and recent system events.

## Live Tracking

Live Tracking is the dispatch-style vehicle command center.

Functions:

- Real road map using Mapbox when `VITE_MAPBOX_TOKEN` is set.
- Leaflet/OpenStreetMap fallback when Mapbox is not configured.
- Colored vehicle markers:
  - Green: Active
  - Yellow: Idle
  - Blue: Maintenance
  - Red: Offline
- Search by vehicle, ID, driver, location, or status.
- Filter by status.
- Sort by speed, fuel, mileage, status, or alert count.
- Vehicle click centers the map and opens detail information.

Vehicle detail panel shows:

- Friendly vehicle name
- Internal vehicle ID
- Assigned driver
- Current speed
- Average speed
- Fuel level
- Engine status
- Odometer
- Engine hours
- Current location
- Current route
- ETA
- Distance today
- Last updated timestamp
- Active alerts
- GPS accuracy
- Signal strength

## Telematics Simulation

The backend simulator produces realistic demo telematics.

Signals:

- GPS latitude and longitude
- Current speed
- Fuel level
- Engine status
- Odometer and mileage
- Engine hours
- Idle time
- Harsh braking
- Rapid acceleration
- Overspeeding
- Maintenance indicators
- GPS accuracy
- Signal strength
- Last signal timestamp

Behavior:

- Active vehicles accelerate and decelerate gradually.
- Idle vehicles remain near 0 mph while engine hours can increase.
- Offline vehicles stop sending updates.
- Fuel decreases based on movement and idle time.
- Mileage increases based on speed and elapsed simulation ticks.
- Alerts are generated from low fuel and overspeeding conditions.

## Routes

The Routes page is the route intelligence module.

Functions:

- Real map view.
- Trip history table.
- Route details panel.
- Completed path and remaining path.
- Start, checkpoint, and destination markers.
- Route replay controls:
  - Play
  - Pause
  - Reset
  - 1x, 2x, 4x speed
- Deviation status and deviation distance.

Trip table includes:

- Trip ID
- Friendly vehicle name
- Driver
- Start location
- Destination
- Distance
- Travel time
- Fuel used
- Average speed
- Route status
- Deviation status

## Drivers

The Drivers module focuses on safety and coaching.

Functions:

- Search by driver, vehicle, region, and status.
- Filter by region and risk level.
- Sort by risk score, safety score, speeding, harsh braking, rapid acceleration, and idle minutes.
- Default view prioritizes highest-risk drivers.
- Detail panel shows safety trend and coaching recommendation.

Driver detail includes:

- Driver name
- Assigned vehicle
- Region
- Safety score
- Risk score
- Speeding events
- Harsh braking
- Rapid acceleration
- Idle time
- Recent alerts
- Monthly safety trend
- Coaching recommendation

## Assets

The Assets module tracks operational assets beyond vehicles.

Functions:

- Friendly asset names.
- Search across ID, name, type, serial number, assigned user, location, and warranty status.
- Filter by asset type and warranty status.
- Sortable table columns.
- Detail panel for selected asset.
- Run Audit action updates audit state.
- CSV export.
- PDF placeholder.

Asset detail includes:

- Asset name
- Asset ID
- Serial number
- Type
- Assigned user
- Location
- Purchase date
- Warranty status
- Warranty expiration
- Last audit date
- Audit history
- Assignment history
- Transfer history
- Service notes

## Maintenance

The Maintenance module is a predictive service planner.

Functions:

- Search by vehicle, driver, service type, priority, and depot.
- Filter by priority.
- Sort by maintenance risk.
- Detail panel per row.
- Action buttons:
  - Schedule Service
  - Mark Completed
  - Add Service Note
  - Export CSV

Maintenance detail includes:

- Vehicle name
- Internal vehicle ID
- Assigned driver
- Mileage
- Engine hours
- Last service
- Next predicted service
- Priority
- Risk score
- Completed history
- Upcoming services
- Open issues
- Service notes

## Alerts

The Alerts module groups repeated operational events into meaningful incidents.

Functions:

- Summary cards for open alerts, critical alerts, vehicles requiring attention, drivers needing coaching, most alerted vehicle, and fleet health.
- Grouped alert cards by vehicle.
- Search and filter by severity.
- Sort by severity, newest, or oldest.
- Detail panel for selected alert.
- Actions:
  - Acknowledge
  - Assign
  - Resolve
  - Reopen

Alert detail includes:

- Alert ID
- Vehicle
- Driver
- Type
- Severity
- Location
- Timestamp
- Speed limit
- Recorded speed
- Current status
- Related alerts
- Recommended action
- Audit trail

## Reports

Reports are designed for executive and operational review.

Functions:

- Date range selector.
- Executive summary.
- Fleet health score.
- Fleet utilization.
- Fuel cost today.
- Cost per mile.
- Maintenance due.
- Critical alerts.
- High-risk drivers.
- Top fuel consumers.
- Cost per mile by vehicle.
- Vehicle health ranking.
- Driver safety ranking.
- Fuel trend.
- Alert trend.
- Vehicle status breakdown.
- Drill-down panel.
- CSV export.
- PDF placeholder.

## FleetCommand Copilot

FleetCommand Copilot is a rule-based, LLM-ready assistant.

Functions:

- Fleet Summary
- Smart Recommendations
- Quick Action Cards
- Recent Insights through chat responses
- Chat interface
- Explainability bullets

Example questions:

- Which vehicles need maintenance?
- Which driver has the highest risk score?
- Which vehicle used the most fuel?
- Which vehicle has the most alerts?
- Show offline vehicles.
- Summarize fleet health today.

Future integration:

- Add OpenAI API-backed responses with `OPENAI_API_KEY`.
- Add retrieval over database records and telemetry history.

## System Monitoring & Telematics Center

Monitoring explains the system architecture and telemetry health.

Functions:

- System Health Score
- GPS Accuracy
- API Uptime
- Database Health
- Connectivity Health
- Active Data Streams
- Events Processed Today
- Clickable architecture components
- Demo vs real-world toggle
- Real-time telemetry event stream

Clickable layers:

- Vehicle GPS/IoT Device
- Cellular Network
- Backend API
- Database
- Live Dashboard

## Backend API

The FastAPI backend serves fleet data and simulator updates.

Important endpoints:

- `POST /auth/demo`
- `GET /dashboard`
- `GET /vehicles`
- `GET /vehicles/{id}`
- `GET /vehicles/live`
- `GET /drivers`
- `GET /drivers/{id}`
- `GET /routes`
- `GET /routes/{trip_id}`
- `GET /routes/{trip_id}/replay`
- `GET /assets`
- `GET /assets/{id}`
- `PATCH /assets/{id}`
- `GET /maintenance`
- `POST /maintenance/{id}/schedule`
- `POST /maintenance/{id}/complete`
- `POST /maintenance/{id}/notes`
- `GET /alerts`
- `GET /alerts/grouped`
- `POST /alerts/{id}/acknowledge`
- `POST /alerts/{id}/assign`
- `POST /alerts/{id}/resolve`
- `POST /alerts/{id}/reopen`
- `GET /reports`
- `GET /reports/summary`
- `POST /copilot/query`
- `POST /copilot/quick-action`
- `GET /monitoring/health`
- `GET /monitoring/events`
- `GET /monitoring/layers/{layer}`

## Database

PostgreSQL stores:

- Vehicles
- Drivers
- Routes
- Assets
- Maintenance records
- Alerts

Fresh seed data includes:

- 10 vehicles
- 10 drivers
- 20+ routes
- 30+ assets
- 30+ maintenance records
- 50+ alerts

## Deployment Modes

### Docker Full Stack

Use this for the complete application:

```bash
docker compose up --build
```

### GitHub Pages Static Demo

Use this for a public portfolio link:

- Runs frontend only.
- Uses in-browser demo data.
- Does not require FastAPI or PostgreSQL.
- Real backend can be added later with `VITE_API_URL`.

## Known Production Next Steps

- Add authentication provider and role-based access.
- Add real telemetry ingestion service.
- Add WebSocket live updates.
- Add telemetry history tables.
- Add backend tests.
- Add frontend E2E tests.
- Add PDF/Excel report generation.
- Deploy backend to Render, Railway, Fly.io, Azure, AWS, or GCP.
