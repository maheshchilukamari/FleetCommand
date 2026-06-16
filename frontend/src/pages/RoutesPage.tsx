import { Pause, Play, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import type { RouteRecord } from "../services/types";

export function RoutesPage() {
  const routes = useApi(api.routes);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<RouteRecord | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!routes.data?.length || selected) return;
    setSelected(routes.data[0]);
  }, [routes.data, selected]);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => setFrame((value) => (value + 1) % 18), 900 / speed);
    return () => window.clearInterval(interval);
  }, [playing, speed]);

  const rows = useMemo(() => (routes.data || []).filter((route) => {
    const text = [route.trip_id, route.friendly_vehicle_name, route.driver_name, route.start_location, route.destination, route.status, route.deviation_status].join(" ").toLowerCase();
    return text.includes(query.toLowerCase()) && (status === "All" || route.status === status);
  }), [routes.data, query, status]);

  if (routes.loading) return <LoadingState />;
  if (routes.error) return <ErrorState message={routes.error} />;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <Panel title="Route Intelligence Map">
          {selected && <RouteMap route={selected} frame={frame} />}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => setPlaying(true)} className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white" title="Play"><Play size={17} /></button>
            <button onClick={() => setPlaying(false)} className="grid h-10 w-10 place-items-center rounded-lg border border-line dark:border-slate-700" title="Pause"><Pause size={17} /></button>
            <button onClick={() => { setFrame(0); setPlaying(false); }} className="grid h-10 w-10 place-items-center rounded-lg border border-line dark:border-slate-700" title="Reset"><RotateCcw size={17} /></button>
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="rounded-lg border border-line bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              {[1, 2, 4].map((item) => <option key={item} value={item}>{item}x replay</option>)}
            </select>
          </div>
        </Panel>
        <Panel title="Trip History" action={<div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 dark:border-slate-700"><Search size={16} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trips" className="w-40 bg-transparent text-sm outline-none" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">{["All", "Completed", "In Progress", "Delayed"].map((item) => <option key={item}>{item}</option>)}</select></div>}>
          <DataTable<RouteRecord>
            rows={rows}
            columns={[
              { key: "trip", header: "Trip ID", render: (row) => <button onClick={() => { setSelected(row); setFrame(0); }} className="font-semibold text-brand dark:text-cyan-300">{row.trip_id}</button> },
              { key: "vehicle", header: "Vehicle", render: (row) => row.friendly_vehicle_name },
              { key: "driver", header: "Driver", render: (row) => row.driver_name },
              { key: "start", header: "Start", render: (row) => row.start_location },
              { key: "dest", header: "Destination", render: (row) => row.destination },
              { key: "distance", header: "Distance", render: (row) => `${row.distance_miles} mi` },
              { key: "fuel", header: "Fuel", render: (row) => `${row.fuel_used_gallons} gal` },
              { key: "avg", header: "Avg Speed", render: (row) => `${row.average_speed || 0} mph` },
              { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status === "Delayed" ? "High" : row.status === "In Progress" ? "Medium" : "Low"} /> },
              { key: "deviation", header: "Deviation", render: (row) => row.deviation_status },
            ]}
          />
        </Panel>
      </div>
      <Panel title="Route Detail">
        {selected && <div className="space-y-4"><div><h2 className="text-xl font-bold">{selected.trip_id}</h2><p className="text-sm text-slate-500">{selected.friendly_vehicle_name} | {selected.driver_name}</p></div><Detail items={[["Start", selected.start_location], ["Destination", selected.destination], ["ETA", selected.eta ? new Date(selected.eta).toLocaleTimeString() : "Complete"], ["Distance", `${selected.distance_miles} mi`], ["Travel time", `${selected.travel_time_minutes} min`], ["Fuel used", `${selected.fuel_used_gallons} gal`], ["Deviation", `${selected.deviation_status} (${selected.deviation_distance || 0} mi)`]]} /><section><h3 className="mb-2 text-sm font-semibold">Stops</h3><div className="space-y-2">{selected.stops?.map((stop) => <p key={stop.name} className="rounded-lg border border-line p-2 text-sm dark:border-slate-700">{stop.name}: {stop.lat.toFixed(3)}, {stop.lng.toFixed(3)}</p>)}</div></section></div>}
      </Panel>
    </div>
  );
}

function RouteMap({ route, frame }: { route: RouteRecord; frame: number }) {
  const ref = useMap(route, frame);
  return <div ref={ref} className="h-[520px] overflow-hidden rounded-lg border border-line dark:border-slate-700" />;
}

function useMap(route: RouteRecord, frame: number) {
  const el = useState(() => ({ current: null as HTMLDivElement | null }))[0];
  const map = useState(() => ({ current: null as L.Map | null }))[0];
  const marker = useState(() => ({ current: null as L.Marker | null }))[0];

  useEffect(() => {
    if (!el.current || map.current) return;
    const start = route.completed_path?.[0] || [-97.7431, 30.2672];
    map.current = L.map(el.current).setView([start[1], start[0]], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map.current);
  }, [el, map, route]);

  useEffect(() => {
    if (!map.current) return;
    map.current.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) map.current?.removeLayer(layer);
    });
    const completed = (route.completed_path || []).map(([lng, lat]) => [lat, lng] as [number, number]);
    const remaining = (route.remaining_path || []).map(([lng, lat]) => [lat, lng] as [number, number]);
    if (completed.length) L.polyline(completed, { color: "#176b87", weight: 5 }).addTo(map.current);
    if (remaining.length) L.polyline(remaining, { color: "#94a3b8", weight: 5, dashArray: "8 8" }).addTo(map.current);
    [...completed, ...remaining].forEach((point, index) => L.circleMarker(point, { radius: index === 0 ? 8 : 6, color: index === 0 ? "#1f9d7a" : "#c78319" }).addTo(map.current!));
    const points = [...completed, ...remaining];
    const current = points[Math.min(frame % Math.max(points.length, 1), points.length - 1)] || completed[0];
    marker.current = L.marker(current).addTo(map.current).bindPopup(route.friendly_vehicle_name || "Vehicle");
    if (points.length) map.current.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [route, frame, map, marker]);

  return (node: HTMLDivElement | null) => {
    el.current = node;
  };
}

function Detail({ items }: { items: [string, string][] }) {
  return <div className="space-y-2">{items.map(([label, value]) => <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span className="text-slate-500">{label}</span><strong>{value}</strong></div>)}</div>;
}
