import { Activity, AlertTriangle, Car, DollarSign, Gauge, Route, Shield, Users, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState } from "../components/ErrorState";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { number } from "../utils/format";

export function Dashboard() {
  const navigate = useNavigate();
  const summary = useApi(api.dashboard);
  const reportSummary = useApi(api.reportSummary);
  const vehicles = useApi(api.vehicles);
  const alerts = useApi(api.alerts);
  const drivers = useApi(api.drivers);
  const reports = useApi(api.reports);

  if (summary.loading || vehicles.loading || alerts.loading || reports.loading || drivers.loading || reportSummary.loading) return <LoadingState />;
  if (summary.error || vehicles.error || alerts.error || reports.error || drivers.error || reportSummary.error) {
    return <ErrorState message={summary.error || vehicles.error || alerts.error || reports.error || drivers.error || reportSummary.error || "Unable to load"} />;
  }

  const s = summary.data!;
  const rs = reportSummary.data!;
  const activeAlerts = alerts.data!.filter((alert) => !alert.resolved);
  const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "Critical" || alert.severity === "High");
  const offline = vehicles.data!.filter((vehicle) => vehicle.status === "Offline").length;
  const topRiskVehicles = [...vehicles.data!].sort((a, b) => (b.maintenance_score + (b.alert_count || 0) * 8) - (a.maintenance_score + (a.alert_count || 0) * 8)).slice(0, 5);
  const maintenanceDue = vehicles.data!.filter((vehicle) => vehicle.maintenance_indicator).slice(0, 5);
  const topDrivers = drivers.data!.slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button onClick={() => navigate("/tracking")} className="text-left"><KpiCard title="Fleet Health Score" value={`${rs.fleet_health_score}%`} icon={Shield} note="Composite health and risk index" /></button>
        <button onClick={() => navigate("/tracking")} className="text-left"><KpiCard title="Active Vehicles" value={s.active_vehicles} icon={Activity} note={`${s.total_vehicles} total vehicles`} /></button>
        <KpiCard title="Idle Vehicles" value={s.idle_vehicles} icon={Gauge} note={`${offline} offline vehicles`} />
        <button onClick={() => navigate("/maintenance")} className="text-left"><KpiCard title="Maintenance Due" value={s.maintenance_due} icon={Wrench} note="Due this week" /></button>
        <button onClick={() => navigate("/alerts")} className="text-left"><KpiCard title="Critical Alerts" value={criticalAlerts.length} icon={AlertTriangle} note="Needs operations review" /></button>
        <button onClick={() => navigate("/drivers")} className="text-left"><KpiCard title="High-Risk Drivers" value={s.high_risk_drivers} icon={Users} note="Coaching recommended" /></button>
        <KpiCard title="Distance Today" value={`${number.format(s.total_distance_today)} mi`} icon={Route} note="Live telematics total" />
        <KpiCard title="Fuel Cost Today" value={`$${rs.fuel_cost_today.toLocaleString()}`} icon={DollarSign} note={`$${rs.cost_per_mile}/mile`} />
        <KpiCard title="Utilization" value={`${rs.fleet_utilization}%`} icon={Car} note="Active capacity in service" />
        <KpiCard title="Total Vehicles" value={s.total_vehicles} icon={Car} note="FleetCommand managed assets" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Executive Operations Summary">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{rs.operational_summary}</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={reports.data!.distance_traveled}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {reports.data!.distance_traveled.map((_, index) => <Cell key={index} fill={index % 2 ? "#1f9d7a" : "#176b87"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Active Alerts">
          <div className="space-y-3">
            {activeAlerts.slice(0, 6).map((alert) => (
              <button key={alert.id} onClick={() => navigate("/alerts")} className="w-full rounded-lg border border-line p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{alert.vehicle_name || "Fleet vehicle"}</p>
                  <StatusBadge value={alert.severity} />
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{alert.description || alert.message}</p>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Top Risk Vehicles">
          <StackList rows={topRiskVehicles.map((v) => ({ title: v.friendly_name || v.vehicle_id, subtitle: `${v.maintenance_score}% maintenance risk | ${v.alert_count || 0} alerts`, value: v.status }))} />
        </Panel>
        <Panel title="Top Risk Drivers">
          <StackList rows={topDrivers.map((d) => ({ title: d.name, subtitle: `${d.region} | ${d.assigned_vehicle || "Unassigned"}`, value: `${d.risk_score}` }))} />
        </Panel>
        <Panel title="Vehicles Requiring Maintenance">
          <StackList rows={maintenanceDue.map((v) => ({ title: v.friendly_name || v.vehicle_id, subtitle: `${Math.round(v.odometer).toLocaleString()} miles | ${v.engine_hours.toLocaleString()} hrs`, value: "Due" }))} empty="No urgent maintenance windows." />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Fuel Cost Summary">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Today" value={`$${rs.fuel_cost_today.toLocaleString()}`} />
            <MiniMetric label="Cost / mile" value={`$${rs.cost_per_mile}`} />
            <MiniMetric label="Top consumer" value={reports.data!.fuel_usage.sort((a, b) => b.value - a.value)[0]?.name || "N/A"} />
          </div>
        </Panel>
        <Panel title="Recent System Events">
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {["Telematics stream healthy", "Route deviation scan completed", "Maintenance risk model refreshed", "Driver safety scores recalculated"].map((event, index) => (
              <div key={event} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span>{event}</span>
                <span>{index + 2} min ago</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StackList({ rows, empty = "No records found." }: { rows: { title: string; subtitle: string; value: string }[]; empty?: string }) {
  if (!rows.length) return <p className="rounded-lg border border-dashed border-line p-5 text-sm text-slate-500 dark:border-slate-700">{empty}</p>;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.title} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 dark:border-slate-700">
          <div>
            <p className="font-semibold">{row.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{row.subtitle}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
