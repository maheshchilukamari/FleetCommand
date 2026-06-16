import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import type { MaintenanceRecord } from "../services/types";
import { csvDownload } from "../utils/format";

export function Maintenance() {
  const maintenance = useApi(api.maintenance);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");
  const [selected, setSelected] = useState<MaintenanceRecord | null>(null);

  const rows = useMemo(() => (maintenance.data || []).filter((row) => {
    const text = [row.friendly_vehicle_name, row.assigned_driver, row.service_type, row.priority, row.depot].join(" ").toLowerCase();
    return text.includes(query.toLowerCase()) && (priority === "All" || row.priority === priority);
  }).sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)), [maintenance.data, query, priority]);

  if (maintenance.loading) return <LoadingState />;
  if (maintenance.error) return <ErrorState message={maintenance.error} />;

  async function action(id: number, type: "schedule" | "complete" | "note") {
    const updated = type === "schedule" ? await api.scheduleMaintenance(id) : type === "complete" ? await api.completeMaintenance(id) : await api.addMaintenanceNote(id);
    maintenance.setData((maintenance.data || []).map((row) => (row.id === id ? updated : row)));
    setSelected(updated);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Panel title="Predictive Maintenance Planner" action={<div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 dark:border-slate-700"><Search size={16} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search maintenance" className="w-40 bg-transparent text-sm outline-none" /></label><select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">{["All", "High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select><button onClick={() => csvDownload("fleetcommand-maintenance.csv", rows.map((row) => ({ vehicle: row.friendly_vehicle_name || "", service_type: row.service_type, priority: row.priority, mileage: row.mileage, engine_hours: row.engine_hours, predicted_due_date: row.predicted_due_date, risk_score: row.risk_score || 0 })))} className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white"><Download size={17} /></button></div>}>
        <DataTable<MaintenanceRecord>
          rows={rows}
          columns={[
            { key: "vehicle", header: "Vehicle", render: (row) => <button onClick={() => setSelected(row)} className="font-semibold text-brand dark:text-cyan-300">{row.friendly_vehicle_name}</button> },
            { key: "driver", header: "Driver", render: (row) => row.assigned_driver },
            { key: "service", header: "Service", render: (row) => row.service_type },
            { key: "last", header: "Last Service", render: (row) => row.last_service_date },
            { key: "mileage", header: "Mileage", render: (row) => `${Math.round(row.mileage).toLocaleString()} mi` },
            { key: "due", header: "Predicted Due", render: (row) => row.predicted_due_date },
            { key: "risk", header: "Risk", render: (row) => `${Math.round(row.risk_score || 0)}%` },
            { key: "priority", header: "Priority", render: (row) => <StatusBadge value={row.priority} /> },
          ]}
        />
      </Panel>
      <Panel title="Service Detail">
        {selected ? <div className="space-y-4"><div><h2 className="text-xl font-bold">{selected.friendly_vehicle_name}</h2><p className="text-sm text-slate-500">{selected.vehicle_internal_id} | {selected.assigned_driver}</p></div><Detail items={[["Mileage", `${Math.round(selected.mileage).toLocaleString()} mi`], ["Engine hours", `${selected.engine_hours}`], ["Risk score", `${Math.round(selected.risk_score || 0)}%`], ["Depot", selected.depot || "Austin Depot"], ["Priority", selected.priority], ["Due", selected.predicted_due_date]]} /><div className="grid grid-cols-1 gap-2"><button onClick={() => action(selected.id, "schedule")} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white">Schedule Service</button><button onClick={() => action(selected.id, "complete")} className="rounded-lg bg-mint px-4 py-2 font-semibold text-white">Mark Completed</button><button onClick={() => action(selected.id, "note")} className="rounded-lg border border-line px-4 py-2 font-semibold dark:border-slate-700">Add Service Note</button></div><Timeline title="Maintenance History" rows={selected.completed_history || []} /><Timeline title="Upcoming Services" rows={selected.upcoming_services || []} /></div> : <p className="rounded-lg border border-dashed border-line p-6 text-sm text-slate-500 dark:border-slate-700">Select a maintenance row to inspect service history and take action.</p>}
      </Panel>
    </div>
  );
}

function Detail({ items }: { items: [string, string][] }) {
  return <div className="space-y-2">{items.map(([label, value]) => <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span className="text-slate-500">{label}</span><strong>{value}</strong></div>)}</div>;
}

function Timeline({ title, rows }: { title: string; rows: string[] }) {
  return <section><h3 className="mb-2 text-sm font-semibold">{title}</h3><div className="space-y-2">{rows.map((row) => <p key={row} className="rounded-lg border border-line p-2 text-sm dark:border-slate-700">{row}</p>)}</div></section>;
}
