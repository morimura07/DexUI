import { useEffect, useState, useRef } from 'react';
import { Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import QRCode from 'qrcode';
import { Reveal } from '../../lib/motion';
import { useT } from '../../lib/i18n';
import { adminCall } from '../api';

// ── Admin 2FA panel ──────────────────────────────────────────────────────────
// The admin panel can change route pricing, the treasury deposit address and
// move funds — a password alone is not an adequate gate.
function TwoFactor() {
  const [status, setStatus] = useState(null);
  const [step, setStep]     = useState(0);   // 0 idle · 1 scan · 2 backup codes
  const [uri, setUri]       = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode]     = useState('');
  const [backup, setBackup] = useState([]);
  const [err, setErr]       = useState('');
  const [busy, setBusy]     = useState(false);
  const qrRef = useRef(null);

  const load = () => adminCall('GET', 'admin/2fa/status').then(r => r.success && setStatus(r.data));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (step === 1 && qrRef.current && uri) {
      QRCode.toCanvas(qrRef.current, uri, { width: 176, margin: 1 }).catch(() => {});
    }
  }, [step, uri]);

  const begin = async () => {
    setErr(''); setBusy(true);
    const r = await adminCall('POST', 'admin/2fa/setup'); setBusy(false);
    if (r.success) { setUri(r.data.qr_uri); setSecret(r.data.secret); setStep(1); }
    else setErr(r.error?.message || 'Could not start setup.');
  };
  const enable = async () => {
    setErr(''); setBusy(true);
    const r = await adminCall('POST', 'admin/2fa/enable', { code }); setBusy(false);
    if (r.success) { setBackup(r.data.backup_codes); setStep(2); setCode(''); load(); }
    else setErr(r.error?.message || 'Invalid code.');
  };
  const disable = async () => {
    setErr(''); setBusy(true);
    const r = await adminCall('POST', 'admin/2fa/disable', { code }); setBusy(false);
    if (r.success) { setStep(0); setCode(''); load(); }
    else setErr(r.error?.message || 'Invalid code.');
  };

  if (!status) return null;

  return (
    <Reveal variant="fadeUp" className="bg-bg2 border border-border rounded-xl p-5 mb-4">
      <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border flex items-center justify-between">
        <span className="flex items-center gap-2">
          {status.enabled ? <ShieldCheck className="h-4 w-4 text-green" /> : <ShieldAlert className="h-4 w-4 text-red" />}
          Two-Factor Authentication
        </span>
        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${status.enabled ? 'bg-green/15 text-green' : 'bg-red/15 text-red'}`}>
          {status.enabled ? 'ENABLED' : 'OFF'}
        </span>
      </div>

      {!status.enabled && step === 0 && (
        <>
          <div className="bg-red/10 border border-red/25 rounded-lg px-3 py-2.5 mb-3 text-[11px] text-red leading-relaxed">
            Your admin account is protected by a password only. Anyone who obtains it can change exchange
            rates, alter the treasury deposit address and authorise withdrawals.
          </div>
          <button onClick={begin} disabled={busy}
            className="px-4 py-2 bg-brand text-white text-[12px] font-bold rounded-lg cursor-pointer hover:bg-brand-h disabled:opacity-60">
            {busy ? 'Starting…' : 'Enable 2FA'}
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <div className="text-[11px] text-muted mb-3">Scan with Google Authenticator or Authy, then enter the 6-digit code.</div>
          <div className="flex justify-center mb-3"><div className="bg-white p-3 rounded-xl"><canvas ref={qrRef} /></div></div>
          <div className="bg-bg border border-border rounded-lg px-3 py-2 mb-3">
            <div className="text-[9px] text-muted uppercase font-semibold mb-1">Or enter this key manually</div>
            <div className="font-mono text-[11px] text-fg break-all">{secret}</div>
          </div>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" autoFocus
            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[16px] font-mono tracking-[0.3em] text-center text-fg outline-none focus:border-brand mb-3" />
          {err && <div className="mb-3 text-[11px] text-red">{err}</div>}
          <div className="flex gap-2">
            <button onClick={enable} disabled={busy || code.length !== 6}
              className="flex-1 py-2 bg-brand text-white text-[12px] font-bold rounded-lg cursor-pointer disabled:opacity-50">
              {busy ? 'Verifying…' : 'Verify & enable'}
            </button>
            <button onClick={() => { setStep(0); setErr(''); }} className="px-4 py-2 border border-border text-muted text-[12px] rounded-lg cursor-pointer hover:text-fg">Cancel</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="bg-brand/10 border border-brand/25 rounded-lg px-3 py-2.5 mb-3 text-[11px] text-brand-fg leading-relaxed">
            Save these backup codes now — <strong>shown once, cannot be recovered.</strong> Each works a single time if you lose your phone.
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {backup.map(c => <div key={c} className="bg-bg border border-border rounded-lg px-3 py-2 font-mono text-[12px] text-center text-fg">{c}</div>)}
          </div>
          <button onClick={() => navigator.clipboard?.writeText(backup.join('\n'))} className="w-full py-2 mb-2 border border-border text-[11.5px] text-muted rounded-lg cursor-pointer hover:text-fg">Copy all codes</button>
          <button onClick={() => setStep(0)} className="w-full py-2 bg-green text-white text-[12px] font-bold rounded-lg cursor-pointer">I have saved them</button>
        </>
      )}

      {status.enabled && step === 0 && (
        <>
          <div className="text-[11px] text-muted mb-3">
            2FA is active. {status.backup_remaining} backup code{status.backup_remaining === 1 ? '' : 's'} remaining. A code is also required to authorise withdrawals.
          </div>
          <div className="flex gap-2 items-start">
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Code to disable"
              className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-[12px] font-mono text-fg outline-none focus:border-red" />
            <button onClick={disable} disabled={busy || code.length !== 6}
              className="px-4 py-2 border border-red/40 text-red text-[11.5px] font-semibold rounded-lg cursor-pointer hover:bg-red/10 disabled:opacity-40">Disable</button>
          </div>
          {err && <div className="mt-2 text-[11px] text-red">{err}</div>}
        </>
      )}
    </Reveal>
  );
}

const BLANK = { site_name: '', telegram_support: '', telegram_bot: '', platform_fee_percent: '0', maintenance_mode: false };

export default function Settings() {
  const t = useT();
  const [form, setForm]     = useState(BLANK);
  const [loading, setLoad]  = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    adminCall('GET', 'admin/settings').then(r => {
      if (r.success) {
        const s = r.data.settings;
        setForm({
          site_name: s.site_name ?? '', telegram_support: s.telegram_support ?? '',
          telegram_bot: s.telegram_bot ?? '', platform_fee_percent: s.platform_fee_percent ?? '0',
          maintenance_mode: String(s.maintenance_mode) === 'true',
        });
      } else setError(r.error?.message || 'Could not load settings.');
      setLoad(false);
    });
  }, []);

  const save = async () => {
    setSaving(true); setError('');
    const r = await adminCall('PUT', 'admin/settings/update', form);
    setSaving(false);
    if (r.success) { setSaved(true); setTimeout(() => setSaved(false), 2200); }
    else setError(r.error?.message || 'Save failed.');
  };

  const F = ({ label, hint, children }) => (
    <div className="mb-4">
      <label className="block text-[10px] text-muted font-semibold uppercase tracking-wide mb-1">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-muted mt-1">{hint}</div>}
    </div>
  );
  const inp = (key, type = 'text') => (
    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-fg outline-none focus:border-brand transition-colors" />
  );

  if (loading) return <div className="text-[12px] text-muted">Loading settings…</div>;

  return (
    <div className="max-w-xl">
      <TwoFactor />

      <Reveal variant="fadeUp" className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">{t('adminSettings.generalSettings')}</div>
        <F label={t('adminSettings.siteName')}>{inp('site_name')}</F>
        <F label={t('adminSettings.telegramSupport')} hint={t('adminSettings.telegramSupportHint')}>{inp('telegram_support')}</F>
        <F label={t('adminSettings.telegramBot')} hint={t('adminSettings.telegramBotHint')}>{inp('telegram_bot')}</F>
      </Reveal>

      <Reveal variant="fadeUp" delay={0.06} className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">{t('adminSettings.orderLimits')}</div>
        <F label={t('adminSettings.platformFee')} hint={t('adminSettings.platformFeeHint')}>{inp('platform_fee_percent', 'number')}</F>
        <div className="text-[10px] text-muted border-t border-border pt-3 mt-1">
          Min / max order amounts are set per currency pair on the <strong className="text-fg">Exchange Routes</strong> page.
        </div>
      </Reveal>

      <Reveal variant="fadeUp" delay={0.12} className="bg-bg2 border border-border rounded-xl p-5 mb-4">
        <div className="font-semibold text-[12px] mb-4 pb-2 border-b border-border">{t('adminSettings.siteStatus')}</div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.maintenance_mode}
            onChange={e => setForm(f => ({ ...f, maintenance_mode: e.target.checked }))} className="accent-brand w-4 h-4" />
          <div>
            <div className="text-[12px] font-semibold">{t('adminSettings.maintenanceMode')}</div>
            <div className="text-[10px] text-muted">{t('adminSettings.maintenanceHint')}</div>
          </div>
        </label>
        {form.maintenance_mode && (
          <div className="mt-3 bg-red/10 border border-red/25 rounded-lg px-3 py-2 text-[11px] text-red">
            Users cannot create any new exchange while this is on.
          </div>
        )}
      </Reveal>

      {error && <div className="mb-3 bg-red/10 border border-red/25 rounded-lg px-3 py-2 text-[11px] text-red">{error}</div>}

      <button onClick={save} disabled={saving}
        className="flex items-center gap-1.5 px-5 py-2 bg-brand text-white text-[12px] font-bold rounded-lg cursor-pointer hover:bg-brand-h transition-colors disabled:opacity-60">
        {saved ? <><Check className="h-4 w-4" /> {t('adminSettings.saved')}</> : saving ? 'Saving…' : t('adminSettings.saveSettings')}
      </button>
    </div>
  );
}