import { CheckCircle2, RotateCcw, Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { Alert, GroupedAlert } from "../services/types";

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [groups, setGroups] = useState<GroupedAlert[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const [sort, setSort] = useState("severity");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [alertRows, groupedRows] = await Promise.all([api.alerts(), api.groupedAlerts()]);
      setAlerts(alertRows);
      setGroups(groupedRows);
      setSelected((current) => current || alertRows[0] || null);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 6000);
    return () => window.clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    const rows = alerts.filter((alert) => {
      const text = [alert.vehicle_name, alert.driver_name, alert.alert_type, alert.severity, alert.status, alert.location].join(" ").toLowerCase();
      return text.includes(query.toLowerCase()) && (severity === "All" || alert.severity === severity);
    });
    return rows.sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return severityRank(b.severity) - severityRank(a.severity);
    });
  }, [alerts, query, severity, sort]);

  async function runAction(id: number, action: "ack" | "assign" | "resolve" | "reopen") {
    const updated = action === "ack" ? await api.acknowledgeAlert(id) : action === "assign" ? await api.assignAlert(id) : action === "reopen" ? await api.reopenAlert(id) : await api.resolveAlert(id);
    setAlerts((rows) => rows.map((row) => (row.id === id ? updated : row)));
    setSelected(updated);
  }

  if (loading) return <LoadingState label="Loading grouped incidents" />;
  if (error) return <ErrorState message={error} />;

  const open = alerts.filter((alert) => !alert.resolved);
  const critical = open.filter((alert) => alert.severity === "Critical" || alert.severity === "High");
  const mostAlerted = groups.sort((a, b) => Object.values(b.counts).reduce((x, y) => x + y, 0) - Object.values(a.counts).reduce((x, y) => x + y, 0))[0];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Summary label="Open Alerts" value={open.length} />
        <Summary label="Critical Alerts" value={critical.length} />
        <Summary label="Vehicles Attention" value={groups.length} />
        <Summary label="Drivers Coaching" value={groups.filter((g) => g.risk_score > 50).length} />
        <Summary label="Most Alerted" value={mostAlerted?.vehicle_name || "N/A"} />
        <Summary label="Fleet Health" value="91%" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel title="Grouped Incidents">
          <div className="mb-4 grid gap-2 lg:grid-cols-3">
            {groups.map((group) => (
              <button key={group.vehicle_id} onClick={() => setQuery(group.vehicle_name)} className="rounded-lg border border-line p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <div className="flex justify-between gap-2"><strong>{group.vehicle_name}</strong><StatusBadge value={group.severity} /></div>
                <p className="mt-1 text-sm text-slate-500">{group.assigned_driver} | Risk {group.risk_score}</p>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">{Object.entries(group.counts).map(([k, v]) => `${k}: ${v}`).join(" | ")}</div>
              </button>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 dark:border-slate-700"><Search size={16} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts" className="w-40 bg-transparent text-sm outline-none" /></label>
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">{["All", "Critical", "High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</select>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="severity">Highest severity</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((alert) => (
              <button key={alert.id} onClick={() => setSelected(alert)} className="rounded-lg border border-line p-3 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <div className="flex justify-between gap-3"><strong>{alert.vehicle_name}</strong><StatusBadge value={alert.severity} /></div>
                <p className="mt-1 text-sm text-slate-500">{alert.alert_type} | {alert.driver_name}</p>
                <p className="mt-2 text-sm">{alert.description}</p>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Incident Detail">
          {selected && (
            <div className="space-y-4">
              <div><h2 className="text-xl font-bold">{selected.alert_id}</h2><p className="text-sm text-slate-500">{selected.vehicle_name} | {selected.driver_name}</p></div>
              <Detail items={[["Type", selected.alert_type], ["Severity", selected.severity], ["Location", selected.location || "Unknown"], ["Timestamp", new Date(selected.created_at).toLocaleString()], ["Recorded speed", `${selected.recorded_speed || 0} mph`], ["Speed limit", `${selected.speed_limit || 55} mph`], ["Status", selected.status || "Needs Review"]]} />
              <p className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">{selected.recommended_action}</p>
              <div className="grid grid-cols-2 gap-2"><button onClick={() => runAction(selected.id, "ack")} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold dark:border-slate-700">Acknowledge</button><button onClick={() => runAction(selected.id, "assign")} className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold dark:border-slate-700"><UserPlus size={15} /> Assign</button><button onClick={() => runAction(selected.id, "resolve")} className="flex items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"><CheckCircle2 size={15} /> Resolve</button><button onClick={() => runAction(selected.id, "reopen")} className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-800"><RotateCcw size={15} /> Reopen</button></div>
              <Timeline rows={selected.audit_trail || []} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border border-line bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>;
}

function Detail({ items }: { items: [string, string][] }) {
  return <div className="space-y-2">{items.map(([label, value]) => <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span className="text-slate-500">{label}</span><strong>{value}</strong></div>)}</div>;
}

function Timeline({ rows }: { rows: string[] }) {
  return <section><h3 className="mb-2 text-sm font-semibold">Audit Trail</h3><div className="space-y-2">{rows.map((row) => <p key={row} className="rounded-lg border border-line p-2 text-sm dark:border-slate-700">{row}</p>)}</div></section>;
}

function severityRank(severity: string) {
  return severity === "Critical" ? 4 : severity === "High" ? 3 : severity === "Medium" ? 2 : 1;
}
