import { Bot, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { LoadingState } from "../components/LoadingState";
import { Panel } from "../components/Panel";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

const actions = ["Vehicle Health", "Driver Performance", "Maintenance Planner", "Route Optimizer", "Fuel Analytics", "Alert Investigation"];
const prompts = ["Which vehicles need maintenance?", "Which driver has the highest risk score?", "Which vehicle used the most fuel?", "Which vehicle has the most alerts?", "Show offline vehicles.", "Summarize fleet health today."];

export function Assistant() {
  const summary = useApi(api.reportSummary);
  const vehicles = useApi(api.vehicles);
  const drivers = useApi(api.drivers);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string; why?: string[] }[]>([
    { role: "assistant", text: "FleetCommand Copilot is ready. Pick a quick action or ask about maintenance, fuel, route, alerts, drivers, or fleet health." },
  ]);
  const [loading, setLoading] = useState(false);

  if (summary.loading || vehicles.loading || drivers.loading) return <LoadingState />;

  async function ask(text: string, quick = false) {
    if (!text.trim()) return;
    setMessages((rows) => [...rows, { role: "user", text }]);
    setQuestion("");
    setLoading(true);
    try {
      const result = quick ? await api.copilotQuickAction(text) : await api.copilot(text);
      setMessages((rows) => [...rows, { role: "assistant", text: result.answer, why: result.why }]);
    } catch (err) {
      setMessages((rows) => [...rows, { role: "assistant", text: (err as Error).message }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(question);
  }

  const s = summary.data!;

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <div className="space-y-5">
        <Panel title="Fleet Summary">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Active" value={vehicles.data!.filter((v) => v.status === "Active").length} />
            <Metric label="Maintenance" value={s.maintenance_due_this_week} />
            <Metric label="Critical" value={s.critical_alerts} />
            <Metric label="Fuel cost" value={`$${s.fuel_cost_today}`} />
            <Metric label="Avg safety" value={Math.round(drivers.data!.reduce((a, d) => a + d.safety_score, 0) / drivers.data!.length)} />
            <Metric label="Health" value={`${s.fleet_health_score}%`} />
          </div>
        </Panel>
        <Panel title="Smart Recommendations">
          <div className="space-y-2 text-sm">
            {["Schedule Truck 107 for maintenance within 5 days.", "Marcus Reed generated elevated speeding risk this week.", "Fuel consumption increased on high-mileage active trucks.", "Investigate repeated alerts before end of shift."].map((item) => <p key={item} className="rounded-lg border border-line p-3 dark:border-slate-700">{item}</p>)}
          </div>
        </Panel>
        <Panel title="Quick Actions">
          <div className="grid gap-2">
            {actions.map((action) => <button key={action} onClick={() => ask(action, true)} className="rounded-lg border border-line px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">{action}</button>)}
          </div>
        </Panel>
      </div>
      <Panel title="FleetCommand Copilot">
        <div className="flex h-[690px] flex-col">
          <div className="mb-4 flex flex-wrap gap-2">
            {prompts.map((prompt) => <button key={prompt} onClick={() => setQuestion(prompt)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold dark:bg-slate-800">{prompt}</button>)}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-lg px-4 py-3 text-sm ${message.role === "user" ? "bg-brand text-white" : "bg-white shadow-sm dark:bg-slate-800"}`}>
                  <div className="flex gap-2">{message.role === "assistant" && <Bot size={16} />}{message.text}</div>
                  {message.why?.length ? <ul className="mt-3 list-disc pl-5 text-xs opacity-80">{message.why.map((why) => <li key={why}>{why}</li>)}</ul> : null}
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-slate-500">Copilot is analyzing operations data...</div>}
          </div>
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input value={question} onChange={(event) => setQuestion(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-3 outline-none dark:border-slate-700 dark:bg-slate-950" placeholder="Ask FleetCommand Copilot" />
            <button type="submit" title="Send" className="grid h-12 w-12 place-items-center rounded-lg bg-brand text-white"><Send size={18} /></button>
          </form>
        </div>
      </Panel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>;
}
