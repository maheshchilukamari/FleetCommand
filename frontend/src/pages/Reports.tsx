import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { csvDownload } from "../utils/format";

export function Reports() {
  const reports = useApi(api.reports);
  const summary = useApi(api.reportSummary);
  const drivers = useApi(api.drivers);
  const routes = useApi(api.routes);
  const [range, setRange] = useState("Last 7 days");
  const [drilldown, setDrilldown] = useState<string | null>(null);

  if (reports.loading || summary.loading || drivers.loading || routes.loading) return <LoadingState />;
  if (reports.error || summary.error || drivers.error || routes.error) return <ErrorState message={reports.error || summary.error || drivers.error || routes.error || "Unable to load reports"} />;

  const data = reports.data!;
  const s = summary.data!;
  const trend = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => ({ day, fuel: 820 + index * 34, alerts: 8 + (index % 3) * 4, maintenance: 18 + index * 2 }));

  function exportCsv() {
    csvDownload("fleetcommand-executive-report.csv", [
      ...data.fuel_usage.map((row) => ({ metric: "Fuel Usage", ...row })),
      ...data.distance_traveled.map((row) => ({ metric: "Distance", ...row })),
      ...data.maintenance_risk.map((row) => ({ metric: "Maintenance Risk", ...row })),
      ...data.driver_safety.map((row) => ({ metric: "Driver Safety", ...row })),
    ]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
          {["Today", "Last 7 days", "Last 30 days", "Custom range"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={exportCsv} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white"><Download size={17} /> CSV</button>
          <button type="button" className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 font-semibold dark:border-slate-700"><FileText size={17} /> PDF</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <Metric label="Health" value={`${s.fleet_health_score}%`} />
        <Metric label="Utilization" value={`${s.fleet_utilization}%`} />
        <Metric label="Fuel Cost" value={`$${s.fuel_cost_today}`} />
        <Metric label="Cost / Mile" value={`$${s.cost_per_mile}`} />
        <Metric label="Maint Due" value={s.maintenance_due_this_week} />
        <Metric label="Critical" value={s.critical_alerts} />
        <Metric label="High Risk" value={s.high_risk_drivers} />
      </div>
      <Panel title="AI-Style Operational Summary">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{s.operational_summary} {range} view is active. Truck 107 and top mileage vehicles should be reviewed for cost and maintenance exposure.</p>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel title="Top Fuel Consumers" data={data.fuel_usage} color="#176b87" onClick={setDrilldown} />
        <ChartPanel title="Cost Per Mile by Vehicle" data={data.distance_traveled.map((r, i) => ({ name: r.name, value: Number((data.fuel_usage[i]?.value * 4.12 / Math.max(r.value, 1)).toFixed(2)) }))} color="#c78319" onClick={setDrilldown} />
        <ChartPanel title="Vehicle Health Ranking" data={data.maintenance_risk} color="#c2414b" onClick={setDrilldown} />
        <ChartPanel title="Driver Safety Ranking" data={data.driver_safety} color="#1f9d7a" onClick={setDrilldown} />
        <Panel title="Fuel Cost Trend">
          <LineChartBox data={trend} keyName="fuel" color="#176b87" />
        </Panel>
        <Panel title="Alert Trend Over Time">
          <LineChartBox data={trend} keyName="alerts" color="#c2414b" />
        </Panel>
      </div>
      <Panel title="Vehicle Status Breakdown">
        <div className="grid gap-3 sm:grid-cols-4">
          {data.vehicle_status_distribution.map((item) => <button key={item.name} onClick={() => setDrilldown(item.name)} className="rounded-lg border border-line p-4 text-left dark:border-slate-700"><p className="text-sm text-slate-500">{item.name}</p><p className="mt-2 text-2xl font-bold">{item.value}</p></button>)}
        </div>
      </Panel>
      {drilldown && <Panel title="Drill-Down Detail"><p className="text-sm text-slate-600 dark:text-slate-300">{drilldown}: related fuel history, trip history, maintenance history, alert history, and driver assignment are linked in FleetCommand operational records.</p></Panel>}
    </div>
  );
}

function ChartPanel({ title, data, color, onClick }: { title: string; data: { name: string; value: number }[]; color: string; onClick: (name: string) => void }) {
  return (
    <Panel title={title}>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={(row) => row?.name && onClick(row.name)}>
              {data.map((_, index) => <Cell key={index} fill={index % 2 ? color : "#1f9d7a"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function LineChartBox({ data, keyName, color }: { data: Record<string, number | string>[]; keyName: string; color: string }) {
  return <div className="h-72"><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="day" /><YAxis /><Tooltip /><Line type="monotone" dataKey={keyName} stroke={color} strokeWidth={3} /></LineChart></ResponsiveContainer></div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-line bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>;
}
