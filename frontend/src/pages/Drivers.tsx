import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import type { Driver } from "../services/types";

export function Drivers() {
  const drivers = useApi(api.drivers);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All");
  const [risk, setRisk] = useState("All");
  const [sort, setSort] = useState<keyof Driver>("risk_score");
  const [selected, setSelected] = useState<Driver | null>(null);

  const rows = useMemo(() => {
    const data = drivers.data || [];
    return data
      .filter((driver) => {
        const level = riskLevel(driver.risk_score);
        return [driver.name, driver.region, driver.assigned_vehicle, driver.status].join(" ").toLowerCase().includes(query.toLowerCase())
          && (region === "All" || driver.region === region)
          && (risk === "All" || level === risk);
      })
      .sort((a, b) => Number(b[sort] || 0) - Number(a[sort] || 0));
  }, [drivers.data, query, region, risk, sort]);

  if (drivers.loading) return <LoadingState />;
  if (drivers.error) return <ErrorState message={drivers.error} />;

  const regions = ["All", ...Array.from(new Set(drivers.data!.map((driver) => driver.region)))];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Panel
        title="Driver Safety & Coaching"
        action={
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 dark:border-slate-700">
              <Search size={16} className="text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search drivers" className="w-36 bg-transparent text-sm outline-none" />
            </label>
            <select value={region} onChange={(event) => setRegion(event.target.value)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              {regions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={risk} onChange={(event) => setRisk(event.target.value)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              {["All", "Low", "Medium", "High"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as keyof Driver)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              <option value="risk_score">Risk score</option>
              <option value="safety_score">Safety score</option>
              <option value="speeding_events">Speeding</option>
              <option value="harsh_braking_events">Harsh braking</option>
              <option value="rapid_acceleration_events">Rapid accel</option>
              <option value="idle_minutes">Idle minutes</option>
            </select>
          </div>
        }
      >
        <DataTable<Driver>
          rows={rows}
          columns={[
            { key: "name", header: "Driver", render: (row) => <button className="font-semibold text-brand dark:text-cyan-300" onClick={() => setSelected(row)}>{row.name}</button> },
            { key: "vehicle", header: "Vehicle", render: (row) => row.assigned_vehicle || "Unassigned" },
            { key: "region", header: "Region", render: (row) => row.region },
            { key: "risk", header: "Risk", render: (row) => <StatusBadge value={riskLevel(row.risk_score)} /> },
            { key: "safety", header: "Safety", render: (row) => <Progress value={row.safety_score} /> },
            { key: "speeding", header: "Speeding", render: (row) => row.speeding_events },
            { key: "braking", header: "Braking", render: (row) => row.harsh_braking_events },
            { key: "accel", header: "Accel", render: (row) => row.rapid_acceleration_events },
            { key: "idle", header: "Idle", render: (row) => row.idle_minutes },
          ]}
        />
      </Panel>
      <Panel title="Driver Detail">
        {selected ? <DriverDetail driver={selected} /> : <p className="rounded-lg border border-dashed border-line p-6 text-sm text-slate-500 dark:border-slate-700">Select a driver to view safety trends, trip history, alerts, and coaching recommendations.</p>}
      </Panel>
    </div>
  );
}

function DriverDetail({ driver }: { driver: Driver }) {
  const trend = driver.monthly_safety_trend || [{ month: "Jan", score: driver.safety_score - 5 }, { month: "Feb", score: driver.safety_score - 2 }, { month: "Mar", score: driver.safety_score }];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{driver.name}</h2>
        <p className="text-sm text-slate-500">{driver.assigned_vehicle} | {driver.region}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Risk" value={`${driver.risk_score}`} />
        <Metric label="Safety" value={`${driver.safety_score}`} />
      </div>
      <div className="h-48">
        <ResponsiveContainer>
          <BarChart data={trend}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#1f9d7a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <section className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
        <p className="text-xs font-semibold uppercase text-slate-500">Coaching recommendation</p>
        <p className="mt-2 text-sm">{driver.coaching_recommendation}</p>
      </section>
      <section className="text-sm text-slate-600 dark:text-slate-300">
        <p>Recent alerts: {driver.recent_alerts || 0}</p>
        <p>Trip history: 8 completed trips this month</p>
      </section>
    </div>
  );
}

function riskLevel(score: number) {
  if (score >= 60) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function Progress({ value }: { value: number }) {
  return (
    <div className="min-w-28">
      <div className="mb-1 text-xs font-semibold">{value}</div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <span className="block h-full rounded-full bg-mint" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
