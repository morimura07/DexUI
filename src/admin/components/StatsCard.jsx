import { motion, lift, CountUp } from '../../lib/motion';

/**
 * Coerce `value` into a cleanly countable number, or null if it isn't one.
 * We only animate when the animated output reproduces the exact text shown
 * today: numbers keep their own decimal places; strings must round-trip
 * (so "1,234", "$1.2k", "45%" stay untouched, but "42" / "3.5" animate).
 */
function asCountable(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const s = String(value);
    const dot = s.indexOf('.');
    return { n: value, decimals: dot === -1 ? 0 : s.length - dot - 1 };
  }
  if (typeof value === 'string') {
    const s = value.trim();
    const n = Number(s);
    if (s !== '' && Number.isFinite(n) && String(n) === s) {
      const dot = s.indexOf('.');
      return { n, decimals: dot === -1 ? 0 : s.length - dot - 1 };
    }
  }
  return null;
}

export default function StatsCard({ icon, label, value, sub, color = 'text-brand-fg' }) {
  const countable = asCountable(value);
  return (
    <motion.div {...lift} className="rounded-xl border border-border bg-bg2 p-4 transition-colors hover:border-brand/30">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-subtle">{label}</span>
        {icon && <span className="shrink-0 text-sm opacity-50">{icon}</span>}
      </div>
      <div className={`text-2xl font-light leading-none tabular-nums ${color}`}>
        {countable ? <CountUp value={countable.n} decimals={countable.decimals} /> : value}
      </div>
      {sub && <div className="mt-2 text-xs text-subtle">{sub}</div>}
    </motion.div>
  );
}
