import type {
  Alert,
  Asset,
  DashboardSummary,
  Driver,
  GroupedAlert,
  MaintenanceRecord,
  MonitoringHealth,
  Report,
  ReportSummary,
  RouteRecord,
  Vehicle,
} from "./types";

const names = ["Ava Patel", "Marcus Reed", "Nina Brooks", "Owen Carter", "Sophia Nguyen", "Liam Flores", "Maya Johnson", "Ethan Clark", "Isla Turner", "Noah Bennett"];
const vehicleNames = ["Truck 101", "Truck 102", "Delivery Van 12", "Truck 104", "Service Van 05", "Reefer Truck 106", "Truck 107", "Delivery Van 18", "Yard Tractor 09", "Truck 110"];
const statuses: Vehicle["status"][] = ["Active", "Active", "Idle", "Active", "Maintenance", "Offline", "Active", "Idle", "Active", "Active"];

let drivers: Driver[] = names.map((name, index) => {
  const risk = Math.round(18 + index * 6.4);
  return {
    id: index + 1,
    name,
    license_number: `DRV-2026${String(index + 1).padStart(3, "0")}`,
    phone: `555-010${index + 1}`,
    region: ["Austin", "Dallas", "Houston", "San Antonio"][index % 4],
    assigned_vehicle: vehicleNames[index],
    assigned_vehicle_id: index + 1,
    status: risk > 55 ? "Needs Coaching" : "Available",
    speeding_events: (index * 2 + 1) % 12,
    harsh_braking_events: (index * 3 + 2) % 9,
    rapid_acceleration_events: (index * 4 + 1) % 8,
    idle_minutes: 18 + index * 11,
    safety_score: Math.max(62, Math.round(96 - risk * 0.55)),
    risk_score: risk,
    recent_alerts: index % 4,
    coaching_recommendation: risk > 55 ? "Review speeding events and schedule coaching before next long-haul route." : "Maintain current driving habits.",
    monthly_safety_trend: [
      { month: "Jan", score: Math.max(55, 88 - index) },
      { month: "Feb", score: Math.max(58, 90 - index) },
      { month: "Mar", score: Math.max(60, 92 - index) },
    ],
  };
});

let vehicles: Vehicle[] = vehicleNames.map((friendlyName, index) => {
  const status = statuses[index];
  const speed = status === "Active" ? 34 + index * 3 : status === "Idle" ? 0 : 0;
  const driver = drivers[index];
  return {
    id: index + 1,
    vehicle_id: `FL-${1001 + index}`,
    internal_id: `FL-${1001 + index}`,
    friendly_name: friendlyName,
    type: ["Ford Transit", "Freightliner M2", "Mercedes Sprinter", "Ram ProMaster"][index % 4],
    make: ["Ford", "Freightliner", "Mercedes", "Ram"][index % 4],
    model: ["Transit", "M2", "Sprinter", "ProMaster"][index % 4],
    year: 2020 + (index % 5),
    status,
    latitude: 30.19 + index * 0.025,
    longitude: -97.86 + index * 0.018,
    location: ["Austin Depot", "Mueller District", "South Congress", "Domain Northside", "Buda Service Yard", "Round Rock Hub", "Downtown Austin", "Oak Hill", "North Lamar", "Circle C Ranch"][index],
    speed,
    average_speed: status === "Active" ? Math.round(speed * 0.84) : 0,
    fuel_level: Math.max(18, 92 - index * 6),
    engine_status: status === "Offline" ? "Off" : status === "Maintenance" ? "Service" : "On",
    odometer: 18000 + (index + 1) * 9250,
    mileage: 18000 + (index + 1) * 9250,
    engine_hours: 450 + (index + 1) * 210,
    harsh_braking_events: index % 5,
    rapid_acceleration_events: (index + 2) % 5,
    overspeeding_events: index % 4,
    idle_minutes: 12 + index * 5,
    maintenance_indicator: status === "Maintenance" || index > 7,
    maintenance_score: Math.round(18 + index * 8.2),
    fuel_used_today: Number((2.2 + index * 0.85).toFixed(1)),
    distance_today: Number((18 + index * 12.4).toFixed(1)),
    gps_accuracy: 4.4 + (index % 4),
    signal_strength: status === "Offline" ? 0 : 94 - index * 4,
    last_signal_timestamp: new Date().toISOString(),
    current_route: `${["Austin Depot", "Dallas Hub", "Houston DC"][index % 3]} to ${["Waco", "Round Rock", "Killeen"][index % 3]}`,
    eta: new Date(Date.now() + (25 + index * 5) * 60_000).toISOString(),
    alert_count: index % 4,
    active_alerts: index % 3 === 0 ? [`${friendlyName} requires operations review.`] : [],
    last_updated: new Date().toISOString(),
    driver,
  };
});

let routes: RouteRecord[] = Array.from({ length: 22 }, (_, index) => {
  const vehicle = vehicles[index % vehicles.length];
  const start = [-97.86 + index * 0.01, 30.18 + index * 0.006];
  const mid = [-97.76 + index * 0.007, 30.26 + index * 0.005];
  const end = [-97.62 + index * 0.004, 30.34 + index * 0.003];
  return {
    id: index + 1,
    trip_id: `TRIP-${String(index + 1).padStart(4, "0")}`,
    vehicle_id: vehicle.id,
    friendly_vehicle_name: vehicle.friendly_name,
    driver_id: vehicle.driver?.id || 1,
    driver_name: vehicle.driver?.name || "Unassigned",
    start_location: ["Austin Depot", "Dallas Hub", "Houston DC", "San Antonio Yard"][index % 4],
    destination: ["Waco", "Round Rock", "Killeen", "College Station", "Temple"][index % 5],
    start_time: new Date(Date.now() - index * 2 * 60 * 60_000).toISOString(),
    end_time: index % 4 === 0 ? null : new Date(Date.now() - index * 70 * 60_000).toISOString(),
    eta: new Date(Date.now() + (25 + index * 4) * 60_000).toISOString(),
    distance_miles: Number((34 + index * 6.7).toFixed(1)),
    travel_time_minutes: 45 + index * 7,
    fuel_used_gallons: Number((4.2 + index * 0.7).toFixed(1)),
    average_speed: Math.round(38 + index * 0.9),
    status: ["Completed", "In Progress", "Delayed", "Completed"][index % 4],
    deviation_status: index % 5 === 0 ? "Minor Deviation" : "On Route",
    deviation_distance: index % 5 === 0 ? 1.8 : 0,
    completed_path: [start, mid],
    remaining_path: [mid, end],
    stops: [
      { name: "Start", lng: start[0], lat: start[1] },
      { name: "Checkpoint", lng: mid[0], lat: mid[1] },
      { name: "Destination", lng: end[0], lat: end[1] },
    ],
  };
});

let assets: Asset[] = Array.from({ length: 32 }, (_, index) => ({
  id: index + 1,
  asset_id: `AST-${3001 + index}`,
  asset_name: ["Dell Latitude 5550", "Honeywell CT60 Scanner", "Samsung Tab Active5", "Trailer Unit 12", "Liftgate Assembly 04", "Tool Kit 21"][index % 6],
  asset_type: ["Laptop", "Scanner", "Tablet", "Trailer", "Liftgate", "Tool Kit"][index % 6],
  type: ["Laptop", "Scanner", "Tablet", "Trailer", "Liftgate", "Tool Kit"][index % 6],
  serial_number: `SN-FCMD-${String(index + 1).padStart(5, "0")}`,
  assigned_user: names[index % names.length],
  location: ["Austin Depot", "Dallas Hub", "Houston DC", "Mobile Unit"][index % 4],
  status: ["Assigned", "Available", "In Audit", "Repair"][index % 4],
  purchase_date: "2024-05-10",
  last_audit_date: "2026-05-24",
  last_audit: "2026-05-24",
  warranty_status: ["Active", "Expiring Soon", "Expired"][index % 3],
  warranty_expiration: "2027-05-10",
  audit_history: ["Quarterly audit completed", "Barcode scan matched"],
  assignment_history: [`Assigned to ${names[index % names.length]}`],
  transfer_history: ["Central depot to field unit"],
  service_notes: "No open service issues.",
}));

let maintenance: MaintenanceRecord[] = Array.from({ length: 30 }, (_, index) => {
  const vehicle = vehicles[index % vehicles.length];
  return {
    id: index + 1,
    vehicle_id: vehicle.id,
    friendly_vehicle_name: vehicle.friendly_name,
    vehicle_internal_id: vehicle.internal_id,
    assigned_driver: vehicle.driver?.name,
    status: vehicle.status,
    depot: ["Austin Depot", "Dallas Hub", "Houston DC"][index % 3],
    last_service_date: "2026-03-15",
    mileage: vehicle.odometer,
    engine_hours: vehicle.engine_hours,
    predicted_due_date: "2026-06-22",
    service_type: ["Oil Change", "Brake Inspection", "Tire Rotation", "Engine Diagnostics"][index % 4],
    priority: ["Low", "Medium", "High"][index % 3],
    risk_score: vehicle.maintenance_score,
    notes: "Generated from FleetCommand predictive maintenance scoring.",
    completed_history: ["Oil change", "Tire rotation", "Brake inspection"],
    upcoming_services: ["Battery inspection", "Transmission check"],
    open_issues: index % 3 === 2 ? ["Inspection scheduled"] : [],
    service_notes: "Monitor at next depot check.",
  };
});

let alerts: Alert[] = Array.from({ length: 52 }, (_, index) => {
  const vehicle = vehicles[index % vehicles.length];
  const driver = vehicle.driver;
  const type = ["Overspeeding", "Low Fuel", "Maintenance Due", "Vehicle Offline", "High Driver Risk"][index % 5];
  return {
    id: index + 1,
    alert_id: `AL-${String(index + 1).padStart(5, "0")}`,
    alert_type: type,
    type,
    severity: ["Low", "Medium", "High", "Critical"][index % 4] as Alert["severity"],
    message: `${type} detected for ${vehicle.friendly_name}.`,
    description: `${type} detected for ${vehicle.friendly_name}.`,
    vehicle_id: vehicle.id,
    vehicle_name: vehicle.friendly_name,
    driver_id: driver?.id || null,
    driver_name: driver?.name,
    status: index % 6 === 0 ? "Resolved" : "Needs Review",
    resolved: index % 6 === 0,
    created_at: new Date(Date.now() - index * 11 * 60_000).toISOString(),
    timestamp: new Date(Date.now() - index * 11 * 60_000).toISOString(),
    location: vehicle.location,
    recorded_speed: vehicle.speed + 8,
    speed_limit: 55,
    recommended_action: "Review event, contact driver, and document resolution.",
    audit_trail: ["Created", "Risk classified"],
    related_alerts: [`AL-${String(Math.max(1, index)).padStart(5, "0")}`],
  };
});

export async function demoRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();

  if (path === "/auth/demo") return { token: "demo-token", user: "demo@fleetcommand.local" } as T;
  if (path === "/dashboard") return dashboard() as T;
  if (path === "/vehicles/live") {
    tickVehicles();
    return vehicles as T;
  }
  if (path === "/vehicles") return vehicles as T;
  if (path.startsWith("/vehicles/")) return vehicles.find((v) => v.id === Number(path.split("/")[2])) as T;
  if (path === "/drivers") return drivers as T;
  if (path.startsWith("/drivers/")) return drivers.find((d) => d.id === Number(path.split("/")[2])) as T;
  if (path === "/routes") return routes as T;
  if (path.includes("/routes/") && path.endsWith("/replay")) return replay(path.split("/")[2]) as T;
  if (path.startsWith("/routes/")) return routes.find((r) => r.trip_id === path.split("/")[2] || String(r.id) === path.split("/")[2]) as T;
  if (path === "/assets") return assets as T;
  if (path.startsWith("/assets/") && method === "PATCH") return patchAsset(Number(path.split("/")[2])) as T;
  if (path === "/maintenance") return maintenance as T;
  if (path.includes("/maintenance/")) return patchMaintenance(path) as T;
  if (path === "/alerts/grouped") return groupedAlerts() as T;
  if (path === "/alerts") return alerts as T;
  if (path.includes("/alerts/")) return patchAlert(path) as T;
  if (path === "/reports" || path === "/reports/fuel") return reports() as T;
  if (path === "/reports/summary") return reportSummary() as T;
  if (path === "/reports/maintenance") return maintenance as T;
  if (path === "/reports/drivers") return drivers as T;
  if (path === "/reports/routes") return routes as T;
  if (path === "/reports/export") return { status: "ready", formats: ["CSV", "PDF placeholder", "Excel placeholder"] } as T;
  if (path === "/assistant/query" || path === "/copilot/query") return copilot(options) as T;
  if (path === "/copilot/quick-action") return quickAction(options) as T;
  if (path === "/monitoring/health") return monitoringHealth() as T;
  if (path === "/monitoring/events") return monitoringEvents() as T;
  if (path.startsWith("/monitoring/layers/")) return monitoringLayer(path.split("/").pop() || "dashboard") as T;
  throw new Error(`Demo endpoint not implemented: ${path}`);
}

function dashboard(): DashboardSummary {
  return {
    total_vehicles: vehicles.length,
    active_vehicles: vehicles.filter((v) => v.status === "Active").length,
    idle_vehicles: vehicles.filter((v) => v.status === "Idle").length,
    maintenance_due: vehicles.filter((v) => v.maintenance_indicator).length,
    high_risk_drivers: drivers.filter((d) => d.risk_score >= 55).length,
    total_distance_today: Number(vehicles.reduce((sum, v) => sum + v.distance_today, 0).toFixed(1)),
  };
}

function tickVehicles() {
  vehicles = vehicles.map((vehicle) => {
    if (vehicle.status !== "Active") return { ...vehicle, last_updated: new Date().toISOString() };
    const nextSpeed = Math.max(18, Math.min(72, vehicle.speed + (vehicle.id % 2 ? 2.4 : -1.2)));
    const distance = Number((vehicle.distance_today + nextSpeed / 120).toFixed(1));
    return {
      ...vehicle,
      speed: Number(nextSpeed.toFixed(1)),
      average_speed: Math.round(nextSpeed * 0.84),
      latitude: Number((vehicle.latitude + 0.0007).toFixed(6)),
      longitude: Number((vehicle.longitude + 0.0005).toFixed(6)),
      distance_today: distance,
      odometer: Number((vehicle.odometer + nextSpeed / 120).toFixed(1)),
      mileage: Number((vehicle.odometer + nextSpeed / 120).toFixed(1)),
      fuel_used_today: Number((vehicle.fuel_used_today + nextSpeed / 900).toFixed(2)),
      fuel_level: Number(Math.max(0, vehicle.fuel_level - nextSpeed / 2500).toFixed(1)),
      last_updated: new Date().toISOString(),
    };
  });
}

function replay(tripId: string) {
  const route = routes.find((r) => r.trip_id === tripId || String(r.id) === tripId) || routes[0];
  const points = [...(route.completed_path || []), ...(route.remaining_path || [])];
  return { trip_id: route.trip_id || "TRIP-0001", points: points.map(([lng, lat], t) => ({ t, lng, lat })) };
}

function patchAsset(id: number) {
  assets = assets.map((asset) => (asset.id === id ? { ...asset, last_audit: new Date().toISOString().slice(0, 10), last_audit_date: new Date().toISOString().slice(0, 10), status: "Assigned" } : asset));
  return assets.find((asset) => asset.id === id);
}

function patchMaintenance(path: string) {
  const id = Number(path.split("/")[2]);
  maintenance = maintenance.map((row) => {
    if (row.id !== id) return row;
    if (path.endsWith("/complete")) return { ...row, priority: "Low", notes: "Maintenance completed and next service window recalculated." };
    if (path.endsWith("/notes")) return { ...row, notes: "Technician note added: monitor brake wear at next inspection." };
    return { ...row, notes: "Service scheduled with Austin Depot." };
  });
  return maintenance.find((row) => row.id === id);
}

function patchAlert(path: string) {
  const id = Number(path.split("/")[2]);
  alerts = alerts.map((alert) => {
    if (alert.id !== id) return alert;
    if (path.endsWith("/reopen")) return { ...alert, resolved: false, status: "Needs Review" };
    if (path.endsWith("/assign")) return { ...alert, message: `${alert.message} Assigned to fleet supervisor.` };
    if (path.endsWith("/acknowledge")) return { ...alert, message: `${alert.message} Acknowledged by operations.` };
    return { ...alert, resolved: true, status: "Resolved" };
  });
  return alerts.find((alert) => alert.id === id);
}

function groupedAlerts(): GroupedAlert[] {
  return vehicles.map((vehicle) => {
    const related = alerts.filter((alert) => alert.vehicle_id === vehicle.id && !alert.resolved);
    const counts = related.reduce<Record<string, number>>((acc, alert) => {
      acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
      return acc;
    }, {});
    return {
      vehicle_id: vehicle.id,
      vehicle_name: vehicle.friendly_name || vehicle.vehicle_id,
      assigned_driver: vehicle.driver?.name || "Unassigned",
      risk_score: vehicle.driver?.risk_score || 0,
      status: related.length ? "Needs Review" : "Clear",
      last_event: related[0]?.created_at || new Date().toISOString(),
      counts,
      severity: related[0]?.severity || "Low",
    };
  }).filter((group) => Object.keys(group.counts).length);
}

function reports(): Report {
  return {
    fuel_usage: vehicles.map((v) => ({ name: v.friendly_name || v.vehicle_id, value: v.fuel_used_today })),
    distance_traveled: vehicles.map((v) => ({ name: v.friendly_name || v.vehicle_id, value: v.distance_today })),
    maintenance_risk: vehicles.map((v) => ({ name: v.friendly_name || v.vehicle_id, value: v.maintenance_score })),
    driver_safety: drivers.map((d) => ({ name: d.name, value: d.safety_score })),
    vehicle_status_distribution: ["Active", "Idle", "Maintenance", "Offline"].map((status) => ({ name: status, value: vehicles.filter((v) => v.status === status).length })),
  };
}

function reportSummary(): ReportSummary {
  const critical = alerts.filter((a) => !a.resolved && ["High", "Critical"].includes(a.severity)).length;
  const fuelCost = Number((vehicles.reduce((sum, v) => sum + v.fuel_used_today, 0) * 4.12).toFixed(2));
  const distance = vehicles.reduce((sum, v) => sum + v.distance_today, 0);
  return {
    fleet_health_score: 88,
    fleet_utilization: 70,
    fuel_cost_today: fuelCost,
    cost_per_mile: Number((fuelCost / Math.max(distance, 1)).toFixed(2)),
    maintenance_due_this_week: vehicles.filter((v) => v.maintenance_indicator).length,
    critical_alerts: critical,
    high_risk_drivers: drivers.filter((d) => d.risk_score >= 55).length,
    operational_summary: "Fleet utilization increased by 8% this week. Fuel usage increased by 4%. Truck 107 has the highest operating cost. Three vehicles require maintenance within seven days.",
  };
}

function copilot(options?: RequestInit) {
  const question = JSON.parse(String(options?.body || "{}")).question?.toLowerCase() || "";
  if (question.includes("maintenance")) return { answer: `Vehicles needing maintenance: ${vehicles.filter((v) => v.maintenance_indicator).map((v) => v.friendly_name).join(", ")}.`, why: ["Maintenance indicators are active", "Risk scores exceed the service threshold"] };
  if (question.includes("highest risk")) {
    const driver = [...drivers].sort((a, b) => b.risk_score - a.risk_score)[0];
    return { answer: `${driver.name} has the highest driver risk score at ${driver.risk_score}.`, why: ["Highest weighted score", "Speeding and braking events are above average"] };
  }
  if (question.includes("fuel")) {
    const vehicle = [...vehicles].sort((a, b) => b.fuel_used_today - a.fuel_used_today)[0];
    return { answer: `${vehicle.friendly_name} used the most fuel today.`, why: [`${vehicle.fuel_used_today} gallons used`, `${vehicle.distance_today} miles traveled`] };
  }
  if (question.includes("offline")) return { answer: `Offline vehicles: ${vehicles.filter((v) => v.status === "Offline").map((v) => v.friendly_name).join(", ") || "none"}.`, why: ["Status telemetry reports offline"] };
  return { answer: reportSummary().operational_summary, why: ["Summary uses fleet health, utilization, maintenance, alerts, and fuel metrics"] };
}

function quickAction(options?: RequestInit) {
  const action = JSON.parse(String(options?.body || "{}")).question || "Vehicle Health";
  return { answer: `${action}: FleetCommand generated a focused operational report from demo fleet data.`, why: ["Uses vehicles, drivers, routes, alerts, maintenance, and fuel records", "OpenAI can be connected later with OPENAI_API_KEY"] };
}

function monitoringHealth(): MonitoringHealth {
  return {
    system_health_score: 96,
    gps_accuracy: "6.4 m avg",
    api_uptime: "99.98%",
    database_health: "Healthy",
    connectivity_health: "9/10 vehicles online",
    active_data_streams: 80,
    events_processed_today: 18420,
  };
}

function monitoringEvents() {
  return vehicles.slice(0, 10).map((vehicle, index) => ({ timestamp: new Date(Date.now() - index * 3000).toLocaleTimeString(), message: `${vehicle.friendly_name} ${["location updated", "speed updated", "fuel reading received", "maintenance score recalculated"][index % 4]}` }));
}

function monitoringLayer(layer: string) {
  const titles: Record<string, string> = {
    "gps-device": "Vehicle GPS/IoT Device",
    "cellular-network": "Cellular Network",
    "backend-api": "Backend API",
    database: "PostgreSQL Database",
    "live-dashboard": "Live Dashboard",
  };
  return {
    title: titles[layer] || "Live Dashboard",
    metrics: {
      health: "Healthy",
      connected_vehicles: 9,
      offline_vehicles: 1,
      average_latency: "82 ms",
      events_today: 18420,
    },
  };
}
