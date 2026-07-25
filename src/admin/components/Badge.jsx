import { useT } from '../../lib/i18n';

const STATUS_COLORS = {
  WAIT_PAYMENT:     'bg-warn/10 text-warn border-warn/20',
  PAYMENT_RECEIVED: 'bg-info/10 text-info border-info/20',
  UNDER_REVIEW:     'bg-info/10 text-info border-info/20',
  PROCESSING:       'bg-info/10 text-info border-info/20',
  KYC_HOLD:         'bg-hold/10 text-hold border-hold/20',
  COMPLETED:        'bg-green/10 text-green border-green/20',
  EXPIRED:          'bg-red/10 text-red border-red/20',
  CANCELLED:        'bg-red/10 text-red border-red/20',
  AML_HOLD:         'bg-hold/10 text-hold border-hold/20',
  REFUNDED:         'bg-bg3 text-muted border-border',
  // KYC submission states (admin/kyc/list), distinct from order statuses.
  PENDING:          'bg-warn/10 text-warn border-warn/20',
  APPROVED:         'bg-green/10 text-green border-green/20',
  REJECTED:         'bg-red/10 text-red border-red/20',
  admin:            'bg-brand/10 text-brand-fg border-brand/20',
  user:             'bg-bg3 text-muted border-border',
  active:           'bg-green/10 text-green border-green/20',
  inactive:         'bg-red/10 text-red border-red/20',
};

export default function Badge({ label, type }) {
  const t = useT();
  const code = type || label;
  const color = STATUS_COLORS[code] || 'bg-bg3 text-muted border-border';
  // Translate the human display label by status CODE; the CODE stays untouched
  // for color/logic. Unknown codes fall back to the raw label.
  const display = Object.prototype.hasOwnProperty.call(STATUS_COLORS, code)
    ? t(`adminStatus.${code}`)
    : label?.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {display}
    </span>
  );
}