import { useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

export function DriverProfile() {
  const { id = "" } = useParams();
  const driver = useApi(() => api.driver(id), [id]);

  if (driver.loading) return <LoadingState />;
  if (driver.error) return <ErrorState message={driver.error} />;

  const d = driver.data!;
  const chartData = [
    { name: "Speeding", value: d.speeding_events },
    { name: "Braking", value: d.harsh_braking_events },
    { name: "Accel", value: d.rapid_acceleration_events },
    { name: "Idle", value: d.idle_minutes },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Panel title="Driver Profile">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{d.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{d.license_number} | {d.region}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Risk Score</p>
              <p className="text-2xl font-bold">{d.risk_score}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Safety Score</p>
              <p className="text-2xl font-bold">{d.safety_score}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{d.phone}</p>
        </div>
      </Panel>
      <Panel title="Safety Events">
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1f9d7a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
