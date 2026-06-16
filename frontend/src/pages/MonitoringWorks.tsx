import { ArrowRight, Database, RadioTower, Server, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

const layers = ["gps-device", "cellular-network", "backend-api", "database", "live-dashboard"];
const layerLabels: Record<string, string> = {
  "gps-device": "Vehicle GPS/IoT Device",
  "cellular-network": "Cellular Network",
  "backend-api": "Backend API",
  database: "Database",
  "live-dashboard": "Live Dashboard",
};

export function MonitoringWorks() {
  const health = useApi(api.monitoringHealth);
  const events = useApi(api.monitoringEvents);
  const [mode, setMode] = useState<"Demo Simulator" | "Real Vehicle Telematics">("Demo Simulator");
  const [selected, setSelected] = useState("gps-device");
  const [layer, setLayer] = useState<{ title: string; metrics: Record<string, string | number> } | null>(null);

  useEffect(() => {
    api.monitoringLayer(selected).then(setLayer);
  }, [selected]);

  if (health.loading || events.loading) return <LoadingState />;

  const h = health.data!;

  return (
    <div className="space-y-5">
      <Panel title="System Monitoring & Telematics Center">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <Metric label="System Health" value={`${h.system_health_score}%`} />
          <Metric label="GPS Accuracy" value={h.gps_accuracy} />
          <Metric label="API Uptime" value={h.api_uptime} />
          <Metric label="Database" value={h.database_health} />
          <Metric label="Connectivity" value={h.connectivity_health} />
          <Metric label="Streams" value={h.active_data_streams} />
          <Metric label="Events Today" value={h.events_processed_today.toLocaleString()} />
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel title="Architecture Flow">
          <div className="mb-4 flex gap-2">
            {(["Demo Simulator", "Real Vehicle Telematics"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === item ? "bg-brand text-white" : "bg-slate-100 dark:bg-slate-800"}`}>{item}</button>)}
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {layers.map((id, index) => <button key={id} onClick={() => setSelected(id)} className={`rounded-lg border p-4 text-left ${selected === id ? "border-brand bg-brand/5" : "border-line dark:border-slate-700"}`}><div className="mb-2 flex items-center justify-between"><LayerIcon index={index} /><ArrowRight className={index === layers.length - 1 ? "hidden" : ""} size={16} /></div><p className="text-sm font-semibold">{layerLabels[id]}</p></button>)}
          </div>
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800">
            {mode === "Demo Simulator" ? "Python simulator generates GPS, speed, fuel, driver safety, and maintenance signals, then sends them through FastAPI into PostgreSQL-backed dashboards." : "Vehicle IoT devices send GPS, engine, fuel, and driver behavior data through cellular networks to backend APIs, analytics, and live dashboards."}
          </p>
        </Panel>
        <Panel title="Selected Component">
          {layer && <div className="space-y-3"><h2 className="text-xl font-bold">{layer.title}</h2>{Object.entries(layer.metrics).map(([key, value]) => <div key={key} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span className="capitalize text-slate-500">{key.split("_").join(" ")}</span><strong>{value}</strong></div>)}</div>}
        </Panel>
      </div>
      <Panel title="Real-Time Telemetry Event Stream">
        <div className="grid gap-2 md:grid-cols-2">
          {events.data!.map((event) => <div key={`${event.timestamp}-${event.message}`} className="rounded-lg border border-line px-3 py-2 font-mono text-sm dark:border-slate-700">[{event.timestamp}] {event.message}</div>)}
        </div>
      </Panel>
    </div>
  );
}

function LayerIcon({ index }: { index: number }) {
  const icons = [Truck, RadioTower, Server, Database, Server];
  const Icon = icons[index];
  return <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand dark:bg-cyan-400/10 dark:text-cyan-300"><Icon size={18} /></span>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>;
}
