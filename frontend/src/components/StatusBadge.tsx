const styles: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  Idle: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Maintenance: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  Offline: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
  Critical: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
  High: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${styles[value] || styles.Low}`}>{value}</span>;
}
