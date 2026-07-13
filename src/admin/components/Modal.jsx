export default function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-bg2 border border-border rounded-xl w-full ${width} shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="font-bold text-[13px]">{title}</h3>
          <button onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-bg3 text-muted hover:text-white cursor-pointer bg-transparent border-none text-sm">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] text-muted font-semibold uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return (
    <input {...props}
      className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-yellow transition-colors" />
  );
}

export function Select({ children, ...props }) {
  return (
    <select {...props}
      className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-yellow transition-colors cursor-pointer">
      {children}
    </select>
  );
}

export function BtnRow({ onCancel, onSave, saving, saveLabel = 'Save' }) {
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel}
        className="flex-1 py-2 border border-border text-muted rounded-lg cursor-pointer bg-transparent text-[12px] hover:border-red hover:text-red transition-colors">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving}
        className="flex-1 py-2 bg-yellow text-black font-bold rounded-lg cursor-pointer text-[12px] hover:bg-yellow-d transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : saveLabel}
      </button>
    </div>
  );
}