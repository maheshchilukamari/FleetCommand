export type Driver = {
  id: number;
  name: string;
  license_number: string;
  phone: string;
  region: string;
  speeding_events: number;
  harsh_braking_events: number;
  rapid_acceleration_events: number;
  idle_minutes: number;
  safety_score: number;
  risk_score: number;
  assigned_vehicle?: string;
  assigned_vehicle_id?: number | null;
  status?: string;
  recent_alerts?: number;
  monthly_safety_trend?: { month: string; score: number }[];
  coaching_recommendation?: string;
};

export type Vehicle = {
  id: number;
  vehicle_id: string;
  internal_id?: string;
  friendly_name?: string;
  type?: string;
  make: string;
  model: string;
  year: number;
  status: "Active" | "Idle" | "Maintenance" | "Offline";
  latitude: number;
  longitude: number;
  location: string;
  speed: number;
  average_speed?: number;
  fuel_level: number;
  engine_status: string;
  odometer: number;
  mileage?: number;
  engine_hours: number;
  harsh_braking_events: number;
  rapid_acceleration_events: number;
  overspeeding_events?: number;
  idle_minutes: number;
  maintenance_indicator: boolean;
  maintenance_score: number;
  fuel_used_today: number;
  distance_today: number;
  gps_accuracy?: number;
  signal_strength?: number;
  last_signal_timestamp?: string;
  current_route?: string;
  eta?: string;
  alert_count?: number;
  active_alerts?: string[];
  last_updated: string;
  driver: Driver | null;
};

export type DashboardSummary = {
  total_vehicles: number;
  active_vehicles: number;
  idle_vehicles: number;
  maintenance_due: number;
  high_risk_drivers: number;
  total_distance_today: number;
};

export type RouteRecord = {
  id: number;
  trip_id?: string;
  vehicle_id: number;
  friendly_vehicle_name?: string;
  driver_id: number;
  driver_name?: string;
  start_location: string;
  destination: string;
  start_time?: string;
  end_time?: string | null;
  eta?: string;
  distance_miles: number;
  travel_time_minutes: number;
  fuel_used_gallons: number;
  average_speed?: number;
  status: string;
  deviation_status?: string;
  deviation_distance?: number;
  completed_path?: number[][];
  remaining_path?: number[][];
  stops?: { name: string; lng: number; lat: number }[];
  started_at?: string;
};

export type Asset = {
  id: number;
  asset_id: string;
  asset_name?: string;
  asset_type: string;
  type?: string;
  serial_number: string;
  assigned_user: string;
  location: string;
  status: string;
  purchase_date: string;
  last_audit_date: string;
  last_audit?: string;
  warranty_status: string;
  warranty_expiration?: string;
  audit_history?: string[];
  assignment_history?: string[];
  transfer_history?: string[];
  service_notes?: string;
};

export type MaintenanceRecord = {
  id: number;
  vehicle_id: number;
  friendly_vehicle_name?: string;
  vehicle_internal_id?: string;
  assigned_driver?: string;
  status?: string;
  depot?: string;
  last_service_date: string;
  mileage: number;
  engine_hours: number;
  predicted_due_date: string;
  service_type: string;
  priority: string;
  risk_score?: number;
  notes: string;
  completed_history?: string[];
  upcoming_services?: string[];
  open_issues?: string[];
  service_notes?: string;
};

export type Alert = {
  id: number;
  alert_id?: string;
  alert_type: string;
  type?: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  message: string;
  description?: string;
  vehicle_id: number | null;
  vehicle_name?: string;
  driver_id: number | null;
  driver_name?: string;
  status?: string;
  resolved: boolean;
  created_at: string;
  timestamp?: string;
  location?: string;
  recorded_speed?: number;
  speed_limit?: number;
  recommended_action?: string;
  audit_trail?: string[];
  related_alerts?: string[];
};

export type Report = {
  fuel_usage: { name: string; value: number }[];
  distance_traveled: { name: string; value: number }[];
  maintenance_risk: { name: string; value: number }[];
  driver_safety: { name: string; value: number }[];
  vehicle_status_distribution: { name: string; value: number }[];
};

export type ReportSummary = {
  fleet_health_score: number;
  fleet_utilization: number;
  fuel_cost_today: number;
  cost_per_mile: number;
  maintenance_due_this_week: number;
  critical_alerts: number;
  high_risk_drivers: number;
  operational_summary: string;
};

export type GroupedAlert = {
  vehicle_id: number;
  vehicle_name: string;
  assigned_driver: string;
  risk_score: number;
  status: string;
  last_event: string;
  counts: Record<string, number>;
  severity: string;
};

export type MonitoringHealth = {
  system_health_score: number;
  gps_accuracy: string;
  api_uptime: string;
  database_health: string;
  connectivity_health: string;
  active_data_streams: number;
  events_processed_today: number;
};
