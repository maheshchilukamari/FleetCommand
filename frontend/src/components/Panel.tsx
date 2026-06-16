export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 dark:border-slate-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
