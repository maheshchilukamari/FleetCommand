import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import L from "leaflet";
import type { Vehicle } from "../services/types";
import { StatusBadge } from "./StatusBadge";

const token = import.meta.env.VITE_MAPBOX_TOKEN || "";

const statusColor: Record<string, string> = {
  Active: "#10b981",
  Idle: "#f59e0b",
  Maintenance: "#0ea5e9",
  Offline: "#ef4444",
};

export function MapView({
  vehicles,
  selectedId,
  onSelect,
  className = "h-[520px]",
}: {
  vehicles: Vehicle[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  className?: string;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapboxRef = useRef<mapboxgl.Map | null>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const mapboxMarkers = useRef<Record<number, mapboxgl.Marker>>({});
  const leafletMarkers = useRef<Record<number, L.Marker>>({});
  const selected = useMemo(() => vehicles.find((vehicle) => vehicle.id === selectedId) || vehicles[0], [vehicles, selectedId]);

  useEffect(() => {
    if (!container.current || mapboxRef.current || leafletRef.current) return;

    if (token) {
      mapboxgl.accessToken = token;
      mapboxRef.current = new mapboxgl.Map({
        container: container.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [selected?.longitude || -97.7431, selected?.latitude || 30.2672],
        zoom: 11,
      });
      mapboxRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
      return;
    }

    leafletRef.current = L.map(container.current, {
      center: [selected?.latitude || 30.2672, selected?.longitude || -97.7431],
      zoom: 11,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(leafletRef.current);
  }, [selected]);

  useEffect(() => {
    if (token && mapboxRef.current) {
      vehicles.forEach((vehicle) => {
        const el = document.createElement("button");
        el.className = "fleet-marker";
        el.style.backgroundColor = statusColor[vehicle.status];
        el.innerHTML = markerSvg();
        el.title = vehicle.friendly_name || vehicle.vehicle_id;
        el.onclick = () => onSelect(vehicle.id);
        const popup = new mapboxgl.Popup({ offset: 14 }).setHTML(popupHtml(vehicle));
        if (!mapboxMarkers.current[vehicle.id]) {
          mapboxMarkers.current[vehicle.id] = new mapboxgl.Marker(el).setLngLat([vehicle.longitude, vehicle.latitude]).setPopup(popup).addTo(mapboxRef.current!);
        } else {
          mapboxMarkers.current[vehicle.id].setLngLat([vehicle.longitude, vehicle.latitude]).setPopup(popup);
        }
      });
    }

    if (!token && leafletRef.current) {
      vehicles.forEach((vehicle) => {
        const icon = L.divIcon({
          className: "",
          html: `<button class="fleet-marker ${selectedId === vehicle.id ? "fleet-marker-selected" : ""}" style="background:${statusColor[vehicle.status]}">${markerSvg()}</button>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        if (!leafletMarkers.current[vehicle.id]) {
          const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon }).addTo(leafletRef.current!);
          marker.bindPopup(popupHtml(vehicle));
          marker.on("click", () => onSelect(vehicle.id));
          leafletMarkers.current[vehicle.id] = marker;
        } else {
          leafletMarkers.current[vehicle.id].setLatLng([vehicle.latitude, vehicle.longitude]);
          leafletMarkers.current[vehicle.id].setIcon(icon);
          leafletMarkers.current[vehicle.id].setPopupContent(popupHtml(vehicle));
        }
      });
    }
  }, [vehicles, onSelect, selectedId]);

  useEffect(() => {
    if (!selected) return;
    if (token && mapboxRef.current) {
      mapboxRef.current.flyTo({ center: [selected.longitude, selected.latitude], zoom: 13, speed: 0.8 });
    }
    if (!token && leafletRef.current) {
      leafletRef.current.flyTo([selected.latitude, selected.longitude], 13, { duration: 0.8 });
    }
  }, [selected]);

  return (
    <div className={`${className} relative min-h-[420px] overflow-hidden rounded-lg border border-line shadow-panel dark:border-slate-700`}>
      <div ref={container} className="h-full w-full" />
      <div className="absolute left-4 top-4 z-[500] rounded-lg border border-line bg-white/95 px-3 py-2 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <p className="text-xs font-semibold text-ink dark:text-white">Austin Service Area</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{token ? "Mapbox streets" : "OpenStreetMap live view"}</p>
      </div>
      <div className="absolute right-4 top-4 z-[500] hidden rounded-lg border border-line bg-white/95 p-3 text-xs shadow-panel dark:border-slate-700 dark:bg-slate-900/95 sm:block">
        <div className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Marker status</div>
        <LegendDot color="bg-emerald-500" label="Active" />
        <LegendDot color="bg-amber-500" label="Idle" />
        <LegendDot color="bg-sky-500" label="Maintenance" />
        <LegendDot color="bg-rose-500" label="Offline" />
      </div>
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[500] rounded-lg border border-line bg-white/95 p-4 shadow-panel backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:left-5 sm:right-auto sm:w-[min(430px,calc(100%-40px))]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink dark:text-white">{selected.friendly_name || selected.vehicle_id}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selected.internal_id || selected.vehicle_id} | {selected.driver?.name || "Unassigned"}</p>
            </div>
            <StatusBadge value={selected.status} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800">{selected.speed} mph</span>
            <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800">{selected.fuel_level}% fuel</span>
            <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800">{selected.alert_count || 0} alerts</span>
          </div>
        </div>
      )}
    </div>
  );
}

function markerSvg() {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M14 8h4l4 4v5h-3"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
}

function popupHtml(vehicle: Vehicle) {
  return `<strong>${vehicle.friendly_name || vehicle.vehicle_id}</strong><br/>${vehicle.driver?.name || "Unassigned"}<br/>${vehicle.speed} mph | ${vehicle.fuel_level}% fuel<br/>${vehicle.location}`;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="mt-1 flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
