import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const InputField = ({label, type='text', value, onChange, placeholder}) => {
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? 'text' : 'password') : type;
  return (
    <div>
      <label className="text-[11.5px] text-muted block mb-1.5">{label}</label>
      <div className="relative">
        <input type={inputType} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 ${isPassword ? 'pr-11' : ''} text-white text-[13px] outline-none placeholder-muted focus:border-yellow transition-colors`} />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-muted hover:text-white cursor-pointer bg-transparent border-none">
            {show ? (
              // eye-off
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              // eye
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Brand panel shown to the left of the auth forms on large screens only
function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-center px-14"
      style={{ background: 'radial-gradient(ellipse at 25% 25%, #17130a 0%, #100d07 40%, #0B0E11 72%)' }}>
      <div className="pointer-events-none absolute -top-24 -left-12 w-[440px] h-[440px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(240,185,11,0.10), transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#F0B90B 1px,transparent 1px),linear-gradient(90deg,#F0B90B 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
      {/* fade the right edge into the form side so the seam disappears */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-40"
        style={{ background: 'linear-gradient(90deg, transparent, #0B0E11)' }} />

      <div className="relative max-w-[460px]">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-yellow flex items-center justify-center text-black font-black text-lg">→</div>
          <span className="text-[20px] font-extrabold">SwiftSwap</span>
        </div>

        <h1 className="text-[30px] font-extrabold leading-tight mb-3">
          Automatic crypto exchange <span className="text-yellow">you can trust</span>
        </h1>
        <p className="text-muted text-[13px] leading-relaxed mb-8 max-w-[380px]">
          Crypto to crypto, crypto to fiat, fiat to crypto — no registration wait. Send and receive within minutes.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-7 max-w-[360px]">
          {[['93+','Exchange pairs'],['24/7','Always online'],['5–60m','Processing time'],['0','Security incidents']].map(([n,l],i)=>(
            <div key={i} className="bg-bg2/60 border border-border rounded-xl px-4 py-3">
              <div className="text-yellow font-extrabold text-[18px]">{n}</div>
              <div className="text-muted text-[10.5px]">{l}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 max-w-[400px]">
          {['Non-custodial','Instant swaps','No sign-up wait','24/7 human support'].map((b,i)=>(
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-white bg-bg2/60 border border-border rounded-full px-3 py-1.5">
              <span className="text-green">✓</span>{b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Full-viewport split shell. Fits the screen; only the form column scrolls if tall.
// On phones there is no card panel — fields sit directly on the background.
function AuthShell({ children }) {
  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100dvh - 56px)' }}>
      <AuthBrandPanel />
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-5 py-10">
          {/* mobile brand (brand panel is hidden on small screens) */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-yellow flex items-center justify-center text-black font-black">→</div>
            <span className="text-[18px] font-extrabold">SwiftSwap</span>
          </div>
          {children}
        </div>
      </div>
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

  const handleSubmit = async () => {
    if (!email||!password) { setError('Please fill in all fields'); return; }
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
    else setError(res.error?.message || 'Invalid email or password');
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[380px]">
        <h2 className="text-xl font-extrabold mb-1">Welcome back</h2>
        <p className="text-[12px] text-muted mb-6">Log in to your SwiftSwap account to track orders</p>
        <div className="flex flex-col gap-3.5">
          <InputField label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" />
          <InputField label="Password" type="password" value={password} onChange={e=>setPass(e.target.value)} placeholder="••••••••" />
          {error && <div className="text-red text-[11.5px]">{error}</div>}
          <div className="text-right -mt-1">
            <Link to="/forgot-password" className="text-[11.5px] text-yellow hover:underline">Forgot your password?</Link>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-yellow text-black font-extrabold text-[13px] rounded-lg hover:bg-yellow-d transition-colors disabled:opacity-60 cursor-pointer mt-1">
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </div>
        <div className="text-center mt-4 text-[12px] text-muted">Don't have an account? <Link to="/register" className="text-yellow hover:underline">Sign Up</Link></div>
        <div className="text-center mt-2 text-[12px] text-muted"><Link to="/about" className="hover:text-yellow">← Back to exchange</Link></div>
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
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const handleSubmit = async () => {
    if (!form.name||!form.email||!form.password) { setError('Please fill in all fields'); return; }
    if (form.password!==form.password_confirmation) { setError('Passwords do not match'); return; }
    if (form.password.length<8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.success) navigate('/login');
    else setError(res.error?.message||'Registration failed. Please try again.');
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[380px]">
        <h2 className="text-xl font-extrabold mb-1">Create account</h2>
        <p className="text-[12px] text-muted mb-6">Join SwiftSwap and start exchanging cryptocurrencies instantly</p>
        <div className="flex flex-col gap-3.5">
          <InputField label="Full Name" value={form.name} onChange={set('name')} placeholder="John Doe" />
          <InputField label="Email" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
          <InputField label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" />
          <InputField label="Confirm Password" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="••••••••" />
          {error && <div className="text-red text-[11.5px]">{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-yellow text-black font-extrabold text-[13px] rounded-lg hover:bg-yellow-d transition-colors disabled:opacity-60 cursor-pointer mt-1">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </div>
        <div className="text-center mt-4 text-[12px] text-muted">Already have an account? <Link to="/login" className="text-yellow hover:underline">Log In</Link></div>
      </div>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email) { setError('Please enter your email'); return; }
    setError(''); setLoading(true);
    const res = await api.resetPassword({ email });
    setLoading(false);
    // Backend intentionally returns generic success (no email enumeration)
    if (res?.success) setSent(true);
    else setError(res?.error?.message || 'Something went wrong. Please try again.');
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[380px]">
        <h2 className="text-xl font-extrabold mb-1">Forgot password</h2>
        <p className="text-[12px] text-muted mb-6">Enter your email and we'll send you a link to reset your password.</p>
        {sent ? (
          <div className="space-y-4">
            <div className="bg-green/10 border border-green/20 rounded-lg px-4 py-3 text-[12px] text-green">
              If an account exists for <b>{email}</b>, a reset link is on its way. Check your inbox (and spam).
            </div>
            <Link to="/login" className="block text-center text-[12px] text-yellow hover:underline">← Back to log in</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <InputField label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" />
            {error && <div className="text-red text-[11.5px]">{error}</div>}
            <button onClick={submit} disabled={loading}
              className="w-full py-3 bg-yellow text-black font-extrabold text-[13px] rounded-lg hover:bg-yellow-d transition-colors disabled:opacity-60 cursor-pointer mt-1">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="text-center mt-1 text-[12px] text-muted"><Link to="/login" className="text-yellow hover:underline">← Back to log in</Link></div>
          </div>
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

  useEffect(() => {
    if (!token) { setChecking(false); setValid(false); return; }
    api.resetPasswordIsValid({ token })
      .then(r => setValid(!!r?.data?.valid))
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async () => {
    if (pw.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (pw.password !== pw.confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    const res = await api.resetPasswordConfirm({ token, password: pw.password });
    setLoading(false);
    if (res?.success) { setDone(true); setTimeout(() => navigate('/login'), 2200); }
    else setError(res?.error?.message || 'Could not reset password. The link may have expired.');
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[380px]">
        <h2 className="text-xl font-extrabold mb-1">Reset password</h2>
        {checking ? (
          <p className="text-[12px] text-muted mt-4 animate-pulse">Checking your link…</p>
        ) : !valid ? (
          <div className="space-y-4 mt-4">
            <div className="bg-red/10 border border-red/20 rounded-lg px-4 py-3 text-[12px] text-red">
              This reset link is invalid or has expired. Please request a new one.
            </div>
            <Link to="/forgot-password" className="block text-center text-[12px] text-yellow hover:underline">Request a new link</Link>
          </div>
        ) : done ? (
          <div className="bg-green/10 border border-green/20 rounded-lg px-4 py-3 text-[12px] text-green mt-4">
            ✅ Password updated. Redirecting you to log in…
          </div>
        ) : (
          <>
            <p className="text-[12px] text-muted mb-6">Choose a new password for your account.</p>
            <div className="flex flex-col gap-3.5">
              <InputField label="New password" type="password" value={pw.password} onChange={e=>setPw(p=>({...p,password:e.target.value}))} placeholder="Min. 8 characters" />
              <InputField label="Confirm password" type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} placeholder="••••••••" />
              {error && <div className="text-red text-[11.5px]">{error}</div>}
              <button onClick={submit} disabled={loading}
                className="w-full py-3 bg-yellow text-black font-extrabold text-[13px] rounded-lg hover:bg-yellow-d transition-colors disabled:opacity-60 cursor-pointer mt-1">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </>
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

  useEffect(() => {
    if (!token) { setState('error'); return; }
    api.confirmEmail(token)
      .then(r => setState(r.success ? 'success' : 'error'))
      .catch(() => setState('error'));
  }, [token]);

  const resend = async () => {
    if (!resendEmail) { setResendMsg('Enter your email'); return; }
    setResending(true); setResendMsg('');
    await api.resendVerification({ email: resendEmail });
    setResending(false);
    setResendMsg('If that email needs verification, a new link has been sent. Check your inbox.');
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[380px]">
        <h2 className="text-xl font-extrabold mb-1">Email verification</h2>

        {state === 'checking' && (
          <p className="text-[12px] text-muted mb-6">Verifying your email…</p>
        )}

        {state === 'success' && (
          <>
            <div className="bg-green/10 border border-green/30 rounded-lg px-4 py-3 mb-5">
              <div className="text-green font-bold text-[13px] mb-1">✓ Email verified</div>
              <div className="text-[12px] text-muted">Your account is now fully activated — you can create exchanges.</div>
            </div>
            <Link to="/login" className="block w-full text-center py-3 bg-yellow text-black font-extrabold text-[13px] rounded-lg hover:bg-yellow-d transition-colors">
              Continue to login
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3 mb-5">
              <div className="text-red font-bold text-[13px] mb-1">Verification link invalid or expired</div>
              <div className="text-[12px] text-muted">Enter your email below and we'll send a fresh verification link.</div>
            </div>
            <div className="flex flex-col gap-3">
              <InputField label="Email" type="email" value={resendEmail} onChange={e=>setResendEmail(e.target.value)} placeholder="your@email.com" />
              {resendMsg && <div className="text-[11.5px] text-muted">{resendMsg}</div>}
              <button onClick={resend} disabled={resending}
                className="w-full py-3 bg-yellow text-black font-extrabold text-[13px] rounded-lg hover:bg-yellow-d transition-colors disabled:opacity-60 cursor-pointer">
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
              <Link to="/login" className="text-center text-[11.5px] text-muted hover:text-white">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}