import Card from "./Card";

export default function DataTable({
  columns = [],
  rows = [],
  rowKey = (row, i) => row.id ?? i,
  emptyMessage = "No records found.",
  className = "",
}) {
  if (!rows.length) {
    return (
      <Card className={`p-6 text-center text-sm text-white/70 border-[#2b2b31] ${className}`}>
        {emptyMessage}
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Table at lg+ */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-white/60">
              {columns.map((col) => (
                <th key={col.key || col.header} className="px-4 py-3 font-semibold">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={rowKey(row, i)} className="border-b border-border last:border-0 text-text">
                {columns.map((col) => (
                  <td key={col.key || col.header} className="px-4 py-3 align-top">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked cards below md (and md-lg gap handled as cards for simplicity < lg) */}
      <div className="lg:hidden space-y-3">
        {rows.map((row, i) => (
          <Card key={rowKey(row, i)} className="p-4 space-y-2">
            {columns.map((col) => (
              <div key={col.key || col.header} className="flex justify-between gap-4 text-sm">
                <span className="text-white/60 shrink-0">{col.header}</span>
                <span className="text-text text-right">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}