import { useState } from 'react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [form, setForm]   = useState({
    site_name:       'SwiftSwap',
    telegram_support:'@SwiftSwapSupport',
    telegram_bot:    '',
    default_fee:     '0',
    maintenance:     false,
    min_order_usd:   '15',
    max_order_usd:   '1000000',
  });

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const F = ({ label, hint, children }) => (
    <div className="mb-4">
      <label className="block text-[10px] text-muted font-semibold uppercase tracking-wide mb-1">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-muted mt-1">{hint}</div>}
    </div>
  );

  const inp = (key, type='text') => (
    <input type={type} value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-yellow transition-colors" />
  );

  return (
    <div className="max-w-xl">
      <div className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">General Settings</div>
        <F label="Site Name">{inp('site_name')}</F>
        <F label="Telegram Support Handle" hint="Shown to users during fiat payments">{inp('telegram_support')}</F>
        <F label="Telegram Bot Token" hint="Optional — for automated notifications">{inp('telegram_bot')}</F>
      </div>

      <div className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">Order Limits</div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Min Order (USD)">{inp('min_order_usd', 'number')}</F>
          <F label="Max Order (USD)">{inp('max_order_usd', 'number')}</F>
        </div>
        <F label="Platform Fee %" hint="Applied on top of BeeSwap rates">{inp('default_fee', 'number')}</F>
      </div>

      <div className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">Site Status</div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.maintenance}
            onChange={e => setForm(f => ({ ...f, maintenance: e.target.checked }))}
            className="accent-yellow w-4 h-4" />
          <div>
            <div className="text-[12px] font-semibold">Maintenance Mode</div>
            <div className="text-[10px] text-muted">Disable the exchange for all users</div>
          </div>
        </label>
      </div>

      <button onClick={save}
        className="px-5 py-2 bg-yellow text-black text-[12px] font-bold rounded-lg cursor-pointer hover:bg-yellow-d transition-colors">
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
      <p className="text-[10px] text-muted mt-2">Note: Settings are currently stored locally. Backend integration coming soon.</p>
    </div>
  );
}