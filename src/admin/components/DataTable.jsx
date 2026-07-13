export default function DataTable({ cols, rows, onRow, empty = 'No records found' }) {
  return (
    <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-border bg-bg3">
              {cols.map((c, i) => (
                <th key={i} className="text-muted font-semibold py-2 px-3 text-left whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-10 text-center text-muted text-[11px]">{empty}</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i}
                onClick={() => onRow?.(row)}
                className={`border-b border-border last:border-0 transition-colors ${onRow ? 'cursor-pointer hover:bg-bg3' : ''}`}>
                {row.__cells.map((cell, j) => (
                  <td key={j} className="py-2 px-3 align-middle">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}