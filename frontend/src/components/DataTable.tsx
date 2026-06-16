export function DataTable<T extends { id: number }>({
  rows,
  columns,
  empty = "No records found.",
}: {
  rows: T[];
  columns: { key: string; header: string; render: (row: T) => React.ReactNode }[];
  empty?: string;
}) {
  if (!rows.length) {
    return <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-slate-500 dark:border-slate-700">{empty}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-line text-sm dark:divide-slate-700">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70">
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-3 py-3 text-slate-700 dark:text-slate-200">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
