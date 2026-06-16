export function LoadingState({ label = "Loading FleetIQ data" }: { label?: string }) {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-lg border border-line bg-white text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <span className="mr-3 h-3 w-3 animate-pulse rounded-full bg-brand" />
      {label}
    </div>
  );
}
