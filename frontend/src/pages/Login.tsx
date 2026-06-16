import { Car, LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.demoLogin();
      localStorage.setItem("fleetiq_token", result.token);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand text-white">
            <Car size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink dark:text-white">FleetCommand</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Intelligent Fleet & Asset Operations Platform</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
            <input className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value="demo@fleetiq.local" readOnly />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
            <input className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value="demo-password" type="password" readOnly />
          </label>
        </div>
        {error && <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
        <button
          type="button"
          onClick={login}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
        >
          <LogIn size={18} />
          {loading ? "Signing in" : "Demo user login"}
        </button>
      </section>
    </main>
  );
}
