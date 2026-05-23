type DataTableProps = {
  columns: string[];
  children: React.ReactNode;
};

export function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm text-zinc-200">
          <thead className="bg-white/5 text-left font-mono uppercase tracking-[0.2em] text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-[11px] font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-black/20">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
