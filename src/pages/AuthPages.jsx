import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useT } from '../lib/i18n';
import { Logo } from '../components/Logo';
import { Field, Input, PasswordInput, Button, Alert } from '../components/ui/kit';
import { SuccessCheck } from '../lib/motion';

// Atmospheric backdrop: concentric hairline rings with two brand arcs slowly
// drifting in opposite directions, plus soft brand glow and a whisper of grid.
// The rate-lock ring motif, dissolved into ambient motion behind the glass card.
function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base wash: a brand-tinted radial pooling toward the card, fading to surface. */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 40%, color-mix(in oklab, var(--brand) 30%, var(--surface-0)) 0%, var(--surface-0) 70%)' }} />

      {/* Glow: one warm brand pool behind the card, two cooler ones at the edges. */}
      <div className="absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/40 blur-[110px]" />
      <div className="absolute -left-16 top-0 h-[460px] w-[460px] rounded-full bg-brand-h/35 blur-[110px]" />
      <div className="absolute -right-16 bottom-0 h-[460px] w-[460px] rounded-full bg-brand-fg/30 blur-[110px]" />

      {/* Concentric rings with three bright arcs sweeping at different rates. */}
      <svg className="absolute left-1/2 top-1/2 h-[1120px] w-[1120px] -translate-x-1/2 -translate-y-1/2" viewBox="0 0 1000 1000" fill="none">
        {[480, 390, 300, 210, 120].map((r) => (
          <circle key={r} cx="500" cy="500" r={r} stroke="var(--brand-fg)" strokeOpacity="0.28" strokeWidth="1" />
        ))}
        <g className="motion-safe:animate-[spin_30s_linear_infinite]" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle cx="500" cy="500" r="390" stroke="var(--brand-fg)" strokeWidth="3" strokeLinecap="round" strokeDasharray="300 2150" strokeOpacity="0.9" />
        </g>
        <g className="motion-safe:animate-[spin_22s_linear_infinite_reverse]" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle cx="500" cy="500" r="300" stroke="var(--brand-fg)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="200 1685" strokeOpacity="0.85" />
        </g>
        <g className="motion-safe:animate-[spin_38s_linear_infinite]" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle cx="500" cy="500" r="480" stroke="var(--brand-fg)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="160 2855" strokeOpacity="0.7" />
        </g>
      </svg>

      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(var(--brand) 1px,transparent 1px),linear-gradient(90deg,var(--brand) 1px,transparent 1px)', backgroundSize: '46px 46px' }} />
    </div>
  );
}

// A single frosted glass card, centred over the animated backdrop.
function AuthShell({ children }) {
  return (
    <div className="relative flex min-h-[calc(100dvh-7rem)] items-center justify-center overflow-hidden px-5 py-14">
      <AuthBackdrop />
      <div className="auth-scale animate-fade-in-up relative z-10 w-full max-w-[400px] overflow-hidden rounded-3xl border border-fg/10 bg-bg2/70 p-7 shadow-[0_28px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl backdrop-saturate-150 md:p-8">
        {/* Top sheen — the optical glass highlight */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
        <Link to="/overview" className="mb-7 inline-flex items-center gap-2">
          <Logo className="h-5" />
          <span className="text-sm font-bold tracking-tight text-fg">SwiftSwap</span>
        </Link>
        {children}
      </div>
    </div>
  );
}

function AuthHeader({ title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-[20px] font-light leading-tight text-fg">{title}</h2>
      {sub && <p className="mt-1.5 text-[12px] text-muted">{sub}</p>}
    </div>
  );
}

export function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = location.state?.from || '/overview';
  const t           = useT();

  const handleSubmit = async () => {
    if (!email||!password) { setError(t('auth.errors.fillAll')); return; }
    setError(''); setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      if (res.data?.user?.role === 'admin') {
        localStorage.setItem('ss_admin_token', res.data.token);
        navigate('/admin', {replace:true});
      } else {
        navigate(from, {replace:true});
      }
    }
    else setError(res.error?.message || t('auth.errors.invalidCreds'));
  };

  return (
    <AuthShell>
      <div className="w-full">
        <AuthHeader title={t('auth.login.title')} sub={t('auth.login.sub')} />
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Field label={t('auth.login.email')}>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" />
          </Field>
          <Field label={t('auth.login.password')}>
            <PasswordInput value={password} onChange={e=>setPass(e.target.value)} placeholder="••••••••" />
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="-mt-1 text-right">
            <Link to="/forgot-password" className="text-xs text-brand-fg hover:underline">{t('auth.login.forgot')}</Link>
          </div>
          <Button size="lg" type="submit" disabled={loading} className="py-3">
            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
        <div className="mt-5 text-center text-sm text-muted">
          {t('auth.login.noAccount')} <Link to="/register" className="text-brand-fg hover:underline">{t('auth.login.signup')}</Link>
        </div>
        <div className="mt-2 text-center text-sm text-muted">
          <Link to="/about" className="hover:text-brand-fg">{t('auth.login.back')}</Link>
        </div>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const [form, setForm]       = useState({name:'',email:'',password:'',password_confirmation:''});
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();
  const t            = useT();
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const handleSubmit = async () => {
    if (!form.name||!form.email||!form.password) { setError(t('auth.errors.fillAll')); return; }
    if (form.password!==form.password_confirmation) { setError(t('auth.errors.passMismatch')); return; }
    if (form.password.length<8) { setError(t('auth.errors.passShort')); return; }
    setError(''); setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.success) navigate('/login');
    else setError(res.error?.message||t('auth.errors.regFailed'));
  };

  return (
    <AuthShell>
      <div className="w-full">
        <AuthHeader title={t('auth.register.title')} sub={t('auth.register.sub')} />
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Field label={t('auth.register.name')}>
            <Input value={form.name} onChange={set('name')} placeholder={t('auth.register.namePlaceholder')} />
          </Field>
          <Field label={t('auth.register.email')}>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" />
          </Field>
          <Field label={t('auth.register.password')}>
            <PasswordInput value={form.password} onChange={set('password')} placeholder={t('auth.register.passwordPlaceholder')} />
          </Field>
          <Field label={t('auth.register.confirm')}>
            <PasswordInput value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="••••••••" />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button size="lg" type="submit" disabled={loading} className="py-3">
            {loading ? t('auth.register.submitting') : t('auth.register.submit')}
          </Button>
        </form>
        <div className="mt-5 text-center text-sm text-muted">
          {t('auth.register.haveAccount')} <Link to="/login" className="text-brand-fg hover:underline">{t('auth.register.signin')}</Link>
        </div>
      </div>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useT();

  const submit = async () => {
    if (!email) { setError(t('auth.errors.enterEmail')); return; }
    setError(''); setLoading(true);
    const res = await api.resetPassword({ email });
    setLoading(false);
    // Backend intentionally returns generic success (no email enumeration)
    if (res?.success) setSent(true);
    else setError(res?.error?.message || t('auth.errors.generic'));
  };

  return (
    <AuthShell>
      <div className="w-full">
        <AuthHeader title={t('auth.forgot.title')} sub={t('auth.forgot.sub')} />
        {sent ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <SuccessCheck size={36} className="text-green" />
            </div>
            <Alert tone="success">
              {t('auth.forgot.sent', { email })}
            </Alert>
            <Link to="/login" className="block text-center text-sm text-brand-fg hover:underline">{t('auth.forgot.back')}</Link>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <Field label={t('auth.forgot.email')}>
              <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" />
            </Field>
            {error && <Alert>{error}</Alert>}
            <Button size="lg" type="submit" disabled={loading} className="py-3">
              {loading ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
            </Button>
            <div className="text-center text-sm text-muted">
              <Link to="/login" className="text-brand-fg hover:underline">{t('auth.forgot.back')}</Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [checking, setChecking] = useState(true);
  const [valid, setValid]       = useState(false);
  const [pw, setPw]             = useState({ password: '', confirm: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const t = useT();

  useEffect(() => {
    if (!token) { setChecking(false); setValid(false); return; }
    api.resetPasswordIsValid({ token })
      .then(r => setValid(!!r?.data?.valid))
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async () => {
    if (pw.password.length < 8) { setError(t('auth.errors.passShort')); return; }
    if (pw.password !== pw.confirm) { setError(t('auth.errors.passMismatch')); return; }
    setError(''); setLoading(true);
    const res = await api.resetPasswordConfirm({ token, password: pw.password });
    setLoading(false);
    if (res?.success) { setDone(true); setTimeout(() => navigate('/login'), 2200); }
    else setError(res?.error?.message || t('auth.errors.resetFailed'));
  };

  return (
    <AuthShell>
      <div className="w-full">
        <AuthHeader title={t('auth.reset.title')} />
        {checking ? (
          <p className="animate-pulse text-sm text-muted">{t('auth.reset.checking')}</p>
        ) : !valid ? (
          <div className="space-y-4">
            <Alert>{t('auth.reset.invalid')}</Alert>
            <Link to="/forgot-password" className="block text-center text-sm text-brand-fg hover:underline">{t('auth.reset.requestNew')}</Link>
          </div>
        ) : done ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <SuccessCheck className="text-green" />
            </div>
            <Alert tone="success"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {t('auth.reset.done')}</span></Alert>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <p className="-mt-2 text-sm text-muted">{t('auth.reset.intro')}</p>
            <Field label={t('auth.reset.newPassword')}>
              <PasswordInput value={pw.password} onChange={e=>setPw(p=>({...p,password:e.target.value}))} placeholder={t('auth.reset.passwordPlaceholder')} />
            </Field>
            <Field label={t('auth.reset.confirm')}>
              <PasswordInput value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} placeholder="••••••••" />
            </Field>
            {error && <Alert>{error}</Alert>}
            <Button size="lg" type="submit" disabled={loading} className="py-3">
              {loading ? t('auth.reset.submitting') : t('auth.reset.submit')}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState('checking'); // checking | success | error
  const [resendEmail, setResendEmail] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!token) { setState('error'); return; }
    api.confirmEmail(token)
      .then(r => setState(r.success ? 'success' : 'error'))
      .catch(() => setState('error'));
  }, [token]);

  const resend = async () => {
    if (!resendEmail) { setResendMsg(t('auth.errors.enterEmailShort')); return; }
    setResending(true); setResendMsg('');
    await api.resendVerification({ email: resendEmail });
    setResending(false);
    setResendMsg(t('auth.verify.resendResult'));
  };

  return (
    <AuthShell>
      <div className="w-full">
        <AuthHeader title={t('auth.verify.title')} />

        {state === 'checking' && <p className="text-sm text-muted">{t('auth.verify.checking')}</p>}

        {state === 'success' && (
          <div className="space-y-5">
            <div className="flex justify-center">
              <SuccessCheck className="text-green" />
            </div>
            <Alert tone="success">
              <div className="mb-1 flex items-center gap-1.5 font-semibold"><CheckCircle2 className="h-4 w-4" /> {t('auth.verify.successTitle')}</div>
              <div className="text-muted">{t('auth.verify.successBody')}</div>
            </Alert>
            <Link to="/login" className="block">
              <Button size="lg" className="py-3">{t('auth.verify.continue')}</Button>
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-5">
            <Alert>
              <div className="mb-1 font-semibold">{t('auth.verify.errorTitle')}</div>
              <div className="text-muted">{t('auth.verify.errorBody')}</div>
            </Alert>
            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); resend(); }}>
              <Field label={t('auth.verify.email')}>
                <Input type="email" value={resendEmail} onChange={e=>setResendEmail(e.target.value)} placeholder="you@email.com" />
              </Field>
              {resendMsg && <p className="text-xs text-muted">{resendMsg}</p>}
              <Button size="lg" type="submit" disabled={resending} className="py-3">
                {resending ? t('auth.verify.resending') : t('auth.verify.resend')}
              </Button>
              <Link to="/login" className="text-center text-sm text-muted hover:text-fg">{t('auth.verify.back')}</Link>
            </form>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
