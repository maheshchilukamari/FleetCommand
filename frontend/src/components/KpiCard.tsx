import type { LucideIcon } from "lucide-react";

export function KpiCard({ title, value, icon: Icon, note }: { title: string; value: string | number; icon: LucideIcon; note: string }) {
  return (
    <section className="animate-enter rounded-lg border border-line bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-ink dark:text-white">{value}</p>
        </div>
        <span className="rounded-lg bg-brand/10 p-2 text-brand dark:bg-cyan-400/10 dark:text-cyan-300">
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{note}</p>
    </section>
  );
}
