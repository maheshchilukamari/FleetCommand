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
import { demoRequest } from "./demoData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true" || window.location.hostname.endsWith("github.io");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (DEMO_MODE) {
    return demoRequest<T>(path, options);
  }
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      ...options,
    });
    if (!response.ok) {
      return demoRequest<T>(path, options);
    }
    return response.json() as Promise<T>;
  } catch {
    return demoRequest<T>(path, options);
  }
}

export const api = {
  demoLogin: () => request<{ token: string; user: string }>("/auth/demo", { method: "POST" }),
  dashboard: () => request<DashboardSummary>("/dashboard"),
  vehicles: () => request<Vehicle[]>("/vehicles"),
  vehicle: (id: string) => request<Vehicle>(`/vehicles/${id}`),
  liveVehicles: () => request<Vehicle[]>("/vehicles/live"),
  drivers: () => request<Driver[]>("/drivers"),
  driver: (id: string) => request<Driver>(`/drivers/${id}`),
  routes: () => request<RouteRecord[]>("/routes"),
  route: (tripId: string) => request<RouteRecord>(`/routes/${tripId}`),
  routeReplay: (tripId: string) => request<{ trip_id: string; points: { t: number; lng: number; lat: number }[] }>(`/routes/${tripId}/replay`),
  assets: () => request<Asset[]>("/assets"),
  updateAsset: (id: number) => request<Asset>(`/assets/${id}`, { method: "PATCH" }),
  maintenance: () => request<MaintenanceRecord[]>("/maintenance"),
  scheduleMaintenance: (id: number) => request<MaintenanceRecord>(`/maintenance/${id}/schedule`, { method: "POST" }),
  completeMaintenance: (id: number) => request<MaintenanceRecord>(`/maintenance/${id}/complete`, { method: "POST" }),
  addMaintenanceNote: (id: number) => request<MaintenanceRecord>(`/maintenance/${id}/notes`, { method: "POST" }),
  alerts: () => request<Alert[]>("/alerts"),
  groupedAlerts: () => request<GroupedAlert[]>("/alerts/grouped"),
  acknowledgeAlert: (id: number) => request<Alert>(`/alerts/${id}/acknowledge`, { method: "POST" }),
  assignAlert: (id: number) => request<Alert>(`/alerts/${id}/assign`, { method: "POST" }),
  reopenAlert: (id: number) => request<Alert>(`/alerts/${id}/reopen`, { method: "POST" }),
  resolveAlert: (id: number) => request<Alert>(`/alerts/${id}/resolve`, { method: "PATCH" }),
  reports: () => request<Report>("/reports"),
  reportSummary: () => request<ReportSummary>("/reports/summary"),
  assistant: (question: string) =>
    request<{ answer: string; source: string }>("/assistant/query", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
  copilot: (question: string) =>
    request<{ answer: string; why: string[] }>("/copilot/query", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
  copilotQuickAction: (question: string) =>
    request<{ answer: string; why: string[] }>("/copilot/quick-action", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
  monitoringHealth: () => request<MonitoringHealth>("/monitoring/health"),
  monitoringEvents: () => request<{ timestamp: string; message: string }[]>("/monitoring/events"),
  monitoringLayer: (layer: string) => request<{ title: string; metrics: Record<string, string | number> }>(`/monitoring/layers/${layer}`),
};
