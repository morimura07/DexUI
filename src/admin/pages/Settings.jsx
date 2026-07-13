import { useState } from 'react';
import { Check } from 'lucide-react';
import { Reveal } from '../../lib/motion';
import { useT } from '../../lib/i18n';

export default function Settings() {
  const t = useT();
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
      className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-fg outline-none focus:border-brand transition-colors" />
  );

  return (
    <div className="max-w-xl">
      <Reveal variant="fadeUp" className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">{t('adminSettings.generalSettings')}</div>
        <F label={t('adminSettings.siteName')}>{inp('site_name')}</F>
        <F label={t('adminSettings.telegramSupport')} hint={t('adminSettings.telegramSupportHint')}>{inp('telegram_support')}</F>
        <F label={t('adminSettings.telegramBot')} hint={t('adminSettings.telegramBotHint')}>{inp('telegram_bot')}</F>
      </Reveal>

      <Reveal variant="fadeUp" delay={0.06} className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">{t('adminSettings.orderLimits')}</div>
        <div className="grid grid-cols-2 gap-3">
          <F label={t('adminSettings.minOrder')}>{inp('min_order_usd', 'number')}</F>
          <F label={t('adminSettings.maxOrder')}>{inp('max_order_usd', 'number')}</F>
        </div>
        <F label={t('adminSettings.platformFee')} hint={t('adminSettings.platformFeeHint')}>{inp('default_fee', 'number')}</F>
      </Reveal>

      <Reveal variant="fadeUp" delay={0.12} className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">{t('adminSettings.siteStatus')}</div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.maintenance}
            onChange={e => setForm(f => ({ ...f, maintenance: e.target.checked }))}
            className="accent-brand w-4 h-4" />
          <div>
            <div className="text-[12px] font-semibold">{t('adminSettings.maintenanceMode')}</div>
            <div className="text-[10px] text-muted">{t('adminSettings.maintenanceHint')}</div>
          </div>
        </label>
      </Reveal>

      <button onClick={save}
        className="flex items-center gap-1.5 px-5 py-2 bg-brand text-white text-[12px] font-bold rounded-lg cursor-pointer hover:bg-brand-h transition-colors">
        {saved ? <><Check className="h-4 w-4" /> {t('adminSettings.saved')}</> : t('adminSettings.saveSettings')}
      </button>
      <p className="text-[10px] text-muted mt-2">{t('adminSettings.note')}</p>
    </div>
  );
}