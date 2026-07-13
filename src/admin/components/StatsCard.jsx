export default function StatsCard({ icon, label, value, sub, color = 'text-yellow' }) {
  return (
    <div className="bg-bg2 border border-border rounded-xl p-4 hover:border-yellow/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[18px]">{icon}</span>
        {sub && <span className="text-[10px] text-muted">{sub}</span>}
      </div>
      <div className={`text-[20px] font-extrabold ${color} leading-none mb-1`}>{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}