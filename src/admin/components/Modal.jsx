import { X } from 'lucide-react';
import { motion } from '../../lib/motion';
import { useT } from '../../lib/i18n';

export default function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  const t = useT();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`flex max-h-[90vh] w-full ${width} flex-col rounded-2xl border border-border bg-bg2 shadow-2xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          <button
            onClick={onClose}
            aria-label={t('admin.common.close')}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg3 hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </motion.div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}

const CONTROL = 'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-brand';

export function Input({ ...props }) {
  return <input {...props} className={CONTROL} />;
}

export function Select({ children, ...props }) {
  return <select {...props} className={`${CONTROL} cursor-pointer`}>{children}</select>;
}

export function BtnRow({ onCancel, onSave, saving, saveLabel }) {
  const t = useT();
  return (
    <div className="mt-5 flex gap-2">
      <button
        onClick={onCancel}
        className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted transition-colors hover:border-red/40 hover:text-red"
      >
        {t('admin.common.cancel')}
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-h disabled:opacity-50"
      >
        {saving ? t('admin.common.saving') : (saveLabel ?? t('admin.common.save'))}
      </button>
    </div>
  );
}
