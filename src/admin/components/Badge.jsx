const STATUS_COLORS = {
  WAIT_PAYMENT:     'bg-yellow/10 text-yellow border-yellow/20',
  PAYMENT_RECEIVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  UNDER_REVIEW:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  COMPLETED:        'bg-green/10 text-green border-green/20',
  EXPIRED:          'bg-red/10 text-red border-red/20',
  CANCELLED:        'bg-red/10 text-red border-red/20',
  AML_HOLD:         'bg-orange-400/10 text-orange-400 border-orange-400/20',
  REFUNDED:         'bg-bg3 text-muted border-border',
  admin:            'bg-yellow/10 text-yellow border-yellow/20',
  user:             'bg-bg3 text-muted border-border',
  active:           'bg-green/10 text-green border-green/20',
  inactive:         'bg-red/10 text-red border-red/20',
};

export default function Badge({ label, type }) {
  const color = STATUS_COLORS[type || label] || 'bg-bg3 text-muted border-border';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {label?.replace(/_/g, ' ')}
    </span>
  );
}