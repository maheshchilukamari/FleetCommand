import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Boxes,
  Car,
  Gauge,
  LogOut,
  Map,
  Moon,
  Route,
  Settings,
  Sun,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/tracking", label: "Live Tracking", icon: Map },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/routes", label: "Routes", icon: Route },
  { to: "/assets", label: "Assets", icon: Boxes },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/assistant", label: "Copilot", icon: Bot },
  { to: "/monitoring", label: "Telematics", icon: Settings },
];

export function AppLayout() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("fleetiq_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("fleetiq_theme", dark ? "dark" : "light");
  }, [dark]);

  function logout() {
    localStorage.removeItem("fleetiq_token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-surface text-ink dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-line px-5 dark:border-slate-800">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white">
            <Car size={22} />
          </span>
          <div>
            <p className="text-lg font-bold">FleetCommand</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Intelligent Fleet & Asset Operations Platform</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-brand dark:text-cyan-300">FleetCommand Operations Center</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Intelligent Fleet & Asset Operations Platform</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Toggle theme"
                onClick={() => setDark((value) => !value)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-line text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                type="button"
                title="Log out"
                onClick={logout}
                className="grid h-10 w-10 place-items-center rounded-lg border border-line text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-line px-4 py-2 dark:border-slate-800 lg:hidden">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
                    isActive ? "bg-brand text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="p-3 sm:p-4 xl:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
