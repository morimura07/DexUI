import { Reveal } from '../../lib/motion';
import { useT } from '../../lib/i18n';

export default function DataTable({ cols, rows, onRow, empty }) {
  const t = useT();
  const emptyText = empty ?? t('admin.common.noData');
  return (
    <Reveal variant="fadeUp" className="overflow-hidden rounded-xl border border-border bg-bg2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-bg3/60">
              {cols.map((c, i) => (
                <th key={i} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-subtle">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-12 text-center text-sm text-muted">{emptyText}</td></tr>
            ) : rows.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRow?.(row)}
                className={`border-b border-border text-fg last:border-0 transition-colors ${onRow ? 'cursor-pointer hover:bg-bg3/50' : ''}`}
              >
                {row.__cells.map((cell, j) => (
                  <td key={j} className="px-4 py-3 align-middle">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}
