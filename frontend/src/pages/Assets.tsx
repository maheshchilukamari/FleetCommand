import { Download, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import type { Asset } from "../services/types";
import { csvDownload } from "../utils/format";

export function Assets() {
  const assets = useApi(api.assets);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [warranty, setWarranty] = useState("All");
  const [selected, setSelected] = useState<Asset | null>(null);

  const rows = useMemo(() => {
    const data = assets.data || [];
    return data.filter((asset) => {
      const text = [asset.asset_id, asset.asset_name, asset.asset_type, asset.assigned_user, asset.serial_number, asset.location, asset.warranty_status].join(" ").toLowerCase();
      return text.includes(query.toLowerCase()) && (type === "All" || asset.asset_type === type) && (warranty === "All" || asset.warranty_status === warranty);
    });
  }, [assets.data, query, type, warranty]);

  if (assets.loading) return <LoadingState />;
  if (assets.error) return <ErrorState message={assets.error} />;

  const types = ["All", ...Array.from(new Set(assets.data!.map((asset) => asset.asset_type)))];
  const warranties = ["All", ...Array.from(new Set(assets.data!.map((asset) => asset.warranty_status)))];

  async function audit(asset: Asset) {
    const updated = await api.updateAsset(asset.id);
    assets.setData((assets.data || []).map((row) => (row.id === asset.id ? updated : row)));
    setSelected(updated);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Panel
        title="Asset Inventory & Audit"
        action={
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 dark:border-slate-700">
              <Search size={16} className="text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" className="w-36 bg-transparent text-sm outline-none" />
            </label>
            <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">{types.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={warranty} onChange={(event) => setWarranty(event.target.value)} className="rounded-lg border border-line bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950">{warranties.map((item) => <option key={item}>{item}</option>)}</select>
            <button onClick={() => csvDownload("fleetcommand-assets.csv", rows.map((asset) => ({ asset_id: asset.asset_id, asset_name: asset.asset_name || "", type: asset.asset_type, assigned_user: asset.assigned_user, location: asset.location, warranty_status: asset.warranty_status, last_audit: asset.last_audit || asset.last_audit_date })))} className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white" title="Export CSV"><Download size={17} /></button>
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-line dark:border-slate-700" title="PDF placeholder"><FileText size={17} /></button>
          </div>
        }
      >
        <DataTable<Asset>
          rows={rows}
          columns={[
            { key: "asset", header: "Asset", render: (row) => <button className="font-semibold text-brand dark:text-cyan-300" onClick={() => setSelected(row)}>{row.asset_name || row.asset_id}</button> },
            { key: "id", header: "Asset ID", render: (row) => row.asset_id },
            { key: "type", header: "Type", render: (row) => row.asset_type },
            { key: "user", header: "Assigned", render: (row) => row.assigned_user },
            { key: "location", header: "Location", render: (row) => row.location },
            { key: "audit", header: "Last Audit", render: (row) => row.last_audit || row.last_audit_date },
            { key: "warranty", header: "Warranty", render: (row) => <StatusBadge value={row.warranty_status === "Expired" ? "High" : row.warranty_status === "Expiring Soon" ? "Medium" : "Low"} /> },
          ]}
        />
      </Panel>
      <Panel title="Asset Detail">
        {selected ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{selected.asset_name}</h2>
              <p className="text-sm text-slate-500">{selected.asset_id} | {selected.serial_number}</p>
            </div>
            <Detail items={[["Type", selected.asset_type], ["Assigned user", selected.assigned_user], ["Location", selected.location], ["Purchase date", selected.purchase_date], ["Warranty", selected.warranty_status], ["Warranty expiration", selected.warranty_expiration || "N/A"], ["Last audit", selected.last_audit || selected.last_audit_date]]} />
            <button onClick={() => audit(selected)} className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white">Run Audit</button>
            <Timeline title="Audit History" rows={selected.audit_history || []} />
            <Timeline title="Assignment History" rows={selected.assignment_history || []} />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-line p-6 text-sm text-slate-500 dark:border-slate-700">Select an asset to view warranty, audit, assignment, and transfer history.</p>
        )}
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
