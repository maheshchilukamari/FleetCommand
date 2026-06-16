import { Activity, AlertTriangle, Clock, Fuel, Gauge, Search, Signal, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MapView } from "../components/MapView";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { Vehicle } from "../services/types";

type SortKey = "speed" | "fuel" | "mileage" | "status" | "alerts";

export function Tracking() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("alerts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.liveVehicles();
        if (!cancelled) {
          setVehicles(data);
          setSelectedId((current) => current ?? data[0]?.id ?? null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = window.setInterval(load, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    const rows = vehicles.filter((vehicle) => {
      const haystack = [vehicle.friendly_name, vehicle.vehicle_id, vehicle.driver?.name, vehicle.status, vehicle.location].join(" ").toLowerCase();
      return haystack.includes(query.toLowerCase()) && (status === "All" || vehicle.status === status);
    });
    return rows.sort((a, b) => {
      if (sortKey === "fuel") return a.fuel_level - b.fuel_level;
      if (sortKey === "mileage") return (b.mileage || b.odometer) - (a.mileage || a.odometer);
      if (sortKey === "status") return a.status.localeCompare(b.status);
      if (sortKey === "speed") return b.speed - a.speed;
      return (b.alert_count || 0) - (a.alert_count || 0);
    });
  }, [vehicles, query, status, sortKey]);

  const selected = vehicles.find((vehicle) => vehicle.id === selectedId) || vehicles[0];

  if (loading) return <LoadingState label="Connecting to live telematics feed" />;
  if (error) return <ErrorState message={error} />;

  const activeCount = vehicles.filter((vehicle) => vehicle.status === "Active").length;
  const maintenanceCount = vehicles.filter((vehicle) => vehicle.maintenance_indicator || vehicle.status === "Maintenance").length;
  const averageFuel = vehicles.length ? Math.round(vehicles.reduce((total, vehicle) => total + vehicle.fuel_level, 0) / vehicles.length) : 0;

  return (
    <div className="grid min-h-[calc(100vh-96px)] gap-4 xl:h-[calc(100vh-96px)] xl:grid-cols-[330px_minmax(0,1fr)_340px] 2xl:grid-cols-[360px_minmax(0,1fr)_360px]">
      <aside className="flex min-h-0 flex-col rounded-lg border border-line bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-line p-4 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-semibold">Live Fleet</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Search, filter, sort, and dispatch</p>
            </div>
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
              <Signal size={13} />
              Live
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric icon={Activity} label="Active" value={activeCount} />
            <Metric icon={Fuel} label="Avg fuel" value={`${averageFuel}%`} />
            <Metric icon={Wrench} label="Service" value={maintenanceCount} />
          </div>
          <label className="mt-3 flex items-center gap-2 rounded-lg border border-line px-3 py-2 dark:border-slate-700">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Vehicle, driver, location" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-line bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              {["All", "Active", "Idle", "Maintenance", "Offline"].map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="rounded-lg border border-line bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              <option value="alerts">Alert count</option>
              <option value="speed">Speed</option>
              <option value="fuel">Lowest fuel</option>
              <option value="mileage">Mileage</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {filtered.length === 0 && <div className="rounded-lg border border-dashed border-line p-6 text-sm text-slate-500 dark:border-slate-700">No vehicles match this view.</div>}
          {filtered.map((vehicle) => (
            <button
              key={vehicle.id}
              onClick={() => setSelectedId(vehicle.id)}
              className={`mb-3 w-full rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 ${
                selectedId === vehicle.id ? "border-brand bg-brand/5 shadow-sm dark:bg-cyan-400/10" : "border-line hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{vehicle.friendly_name || vehicle.vehicle_id}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{vehicle.driver?.name || "Unassigned"} | {vehicle.location}</p>
                </div>
                <StatusBadge value={vehicle.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800">{vehicle.speed} mph</span>
                <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800">{vehicle.fuel_level}% fuel</span>
                <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800">{vehicle.alert_count || 0} alerts</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <span className={`block h-full rounded-full ${vehicle.fuel_level < 25 ? "bg-rose-500" : vehicle.fuel_level < 45 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${vehicle.fuel_level}%` }} />
              </div>
            </button>
          ))}
        </div>
      </aside>

      <MapView vehicles={vehicles} selectedId={selectedId} onSelect={setSelectedId} className="h-[560px] xl:h-full" />

      <aside className="rounded-lg border border-line bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{selected.friendly_name || selected.vehicle_id}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Internal ID: {selected.internal_id || selected.vehicle_id}</p>
              </div>
              <StatusBadge value={selected.status} />
            </div>
            <DetailGrid
              items={[
                ["Driver", selected.driver?.name || "Unassigned"],
                ["Current speed", `${selected.speed} mph`],
                ["Average speed", `${selected.average_speed || 0} mph`],
                ["Fuel level", `${selected.fuel_level}%`],
                ["Engine", selected.engine_status],
                ["Odometer", `${Math.round(selected.mileage || selected.odometer).toLocaleString()} mi`],
                ["Engine hours", selected.engine_hours.toLocaleString()],
                ["Route", selected.current_route || "No active route"],
                ["ETA", selected.eta ? new Date(selected.eta).toLocaleTimeString() : "Pending"],
                ["Distance today", `${selected.distance_today} mi`],
                ["GPS accuracy", `${selected.gps_accuracy || 6} m`],
                ["Signal", `${selected.signal_strength || 0}%`],
              ]}
            />
            <section>
              <h3 className="mb-2 text-sm font-semibold">Active Alerts</h3>
              <div className="space-y-2">
                {(selected.active_alerts || []).length ? (
                  selected.active_alerts?.map((alert) => (
                    <div key={alert} className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      <AlertTriangle size={16} />
                      {alert}
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-line p-3 text-sm text-slate-500 dark:border-slate-700">No active alerts for this vehicle.</p>
                )}
              </div>
            </section>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock size={14} /> {new Date(selected.last_updated).toLocaleString()}</span>
              <span className="flex items-center gap-1"><Gauge size={14} /> {selected.location}</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
        <Icon size={13} />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function DetailGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
          <span className="text-slate-500 dark:text-slate-400">{label}</span>
          <span className="text-right font-semibold">{value}</span>
        </div>
      ))}
    </div>
  );
}
