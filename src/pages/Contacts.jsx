import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Clock } from 'lucide-react';
import { apiCall } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Panel, Field, Input, Textarea, Button, Alert, SectionLabel, RingAccent } from '../components/ui/kit';
import { useT } from '../lib/i18n';
import { Reveal, RevealGroup, RevealItem, motion, lift, SuccessCheck } from '../lib/motion';

// English `value` is the data submitted to the API and must stay stable across
// languages; only the displayed label is translated.
const SUBJECTS = [
  { value: 'Order issue', key: 'orderIssue' },
  { value: 'Payment problem', key: 'payment' },
  { value: 'Account support', key: 'account' },
  { value: 'Wrong amount received', key: 'wrongAmount' },
  { value: 'Verification request', key: 'verification' },
  { value: 'Other', key: 'other' },
];

export default function Contacts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  const CHANNELS = [
    { id: 'chat', Icon: Zap, tag: t('contacts.channel.chatTag'), label: t('contacts.channel.chatLabel'), value: t('contacts.channel.chatValue'), action: 'chat' },
    { id: 'email', Icon: Mail, tag: t('contacts.channel.emailTag'), label: t('contacts.channel.emailLabel'), value: 'support@swiftswap.com', href: 'mailto:support@swiftswap.com' },
    { id: 'hours', Icon: Clock, tag: t('contacts.channel.hoursTag'), label: t('contacts.channel.hoursLabel'), value: t('contacts.channel.hoursValue') },
  ];

  const MORE = [
    { id: 'complaints', label: t('contacts.more.complaints'), value: 'complaints@swiftswap.com' },
    { id: 'security', label: t('contacts.more.security'), value: 'security@swiftswap.com' },
  ];

  const FAQ = [
    { q: t('contacts.faq.q1'), a: t('contacts.faq.a1') },
    { q: t('contacts.faq.q2'), a: t('contacts.faq.a2') },
    { q: t('contacts.faq.q3'), a: t('contacts.faq.a3') },
  ];

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    order_id: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openChat = () => window.dispatchEvent(new CustomEvent('swiftswap:open-chat'));

  const submit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError(t('contacts.form.errorRequired'));
      return;
    }
    setSending(true);
    setError('');
    const res = await apiCall('POST', 'public/contact/submit', form);
    setSending(false);
    if (res.success) {
      setSent(true);
      setForm((f) => ({ ...f, subject: '', message: '', order_id: '' }));
    } else setError(res.error?.message || t('contacts.form.errorFailed'));
  };

  return (
    <div className="pb-4">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <RingAccent className="pointer-events-none absolute -right-24 -top-24 hidden h-[480px] w-[480px] opacity-60 lg:block" />
        <Reveal variant="fadeUp" className="mx-auto max-w-content px-6 py-16 md:px-8 lg:py-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green/20 bg-green/10 px-3 py-1 text-xs font-medium text-green">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" /> {t('contacts.hero.status')}
          </div>
          <h1 className="max-w-2xl text-balance text-5xl font-light leading-[1.02] tracking-tight text-fg md:text-6xl">
            {t('contacts.hero.title')} <span className="text-brand-fg">{t('contacts.hero.titleAccent')}</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            {t('contacts.hero.subtitle')}
          </p>
        </Reveal>
      </section>

      {/* ── CHANNELS ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-16 md:px-8">
          <SectionLabel n="01">{t('contacts.section.reach')}</SectionLabel>
          <RevealGroup className="grid gap-4 sm:grid-cols-3">
            {CHANNELS.map((c) => {
              const inner = (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-fg"><c.Icon className="h-5 w-5" /></span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-subtle">{c.tag}</span>
                  </div>
                  <div className="text-sm text-muted">{c.label}</div>
                  <div className="break-all text-base font-medium text-fg">{c.value}</div>
                </>
              );
              const cls = 'block h-full rounded-2xl border border-border bg-bg2 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/40';
              if (c.href) return <RevealItem key={c.id} variant="scaleIn"><motion.a {...lift} href={c.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</motion.a></RevealItem>;
              if (c.action === 'chat') return <RevealItem key={c.id} variant="scaleIn"><motion.button {...lift} onClick={openChat} className={`${cls} w-full cursor-pointer`}>{inner}</motion.button></RevealItem>;
              return <RevealItem key={c.id} variant="scaleIn"><div className="h-full rounded-2xl border border-border bg-bg2 p-5">{inner}</div></RevealItem>;
            })}
          </RevealGroup>
        </div>
      </section>

      {/* ── MESSAGE FORM ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-16 md:px-8">
          <SectionLabel n="02">{t('contacts.section.message')}</SectionLabel>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal variant="fadeLeft">
              <h2 className="text-balance text-3xl font-light leading-tight text-fg md:text-4xl">{t('contacts.form.heading')}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                {t('contacts.form.intro')}
              </p>
            </Reveal>

            <Reveal variant="fadeRight"><Panel>
              {sent && <Alert tone="success" className="mb-4"><span className="flex items-center gap-1.5"><SuccessCheck size={20} className="text-green shrink-0" /> {t('contacts.form.success')}</span></Alert>}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('contacts.form.name')}>
                    <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('contacts.form.namePlaceholder')} />
                  </Field>
                  <Field label={t('contacts.form.email')}>
                    <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={t('contacts.form.emailPlaceholder')} />
                  </Field>
                </div>
                <Field label={t('contacts.form.orderId')}>
                  <Input value={form.order_id} onChange={(e) => set('order_id', e.target.value)} placeholder={t('contacts.form.orderIdPlaceholder')} />
                </Field>
                <Field label={t('contacts.form.subject')}>
                  <select
                    value={form.subject}
                    onChange={(e) => set('subject', e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-border bg-bg px-4 py-3 text-fg outline-none transition-colors focus:border-brand"
                  >
                    <option value="">{t('contacts.form.subjectPlaceholder')}</option>
                    {SUBJECTS.map((s) => <option key={s.value} value={s.value}>{t(`contacts.subject.${s.key}`)}</option>)}
                  </select>
                </Field>
                <Field label={t('contacts.form.message')}>
                  <Textarea rows={5} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder={t('contacts.form.messagePlaceholder')} />
                </Field>
                {error && <Alert>{error}</Alert>}
                <Button size="lg" onClick={submit} disabled={sending} className="py-3">
                  {sending ? t('contacts.form.sending') : t('contacts.form.submit')}
                </Button>
                <p className="text-center text-xs text-subtle">
                  {t('contacts.form.terms')} <a href="/rules" className="text-brand-fg hover:underline">{t('contacts.form.termsLink')}</a>.
                </p>
              </div>
            </Panel></Reveal>
          </div>
        </div>
      </section>

      {/* ── MORE + FAQ ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-16 md:px-8">
          <SectionLabel n="03">{t('contacts.section.more')}</SectionLabel>
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <Reveal variant="fadeLeft">
              <h3 className="mb-5 text-lg font-normal text-fg">{t('contacts.more.heading')}</h3>
              <div className="divide-y divide-border rounded-2xl border border-border bg-bg2">
                {MORE.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <span className="text-sm text-muted">{m.label}</span>
                    <span className="break-all text-sm font-medium text-fg">{m.value}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal variant="fadeRight">
              <h3 className="mb-5 text-lg font-normal text-fg">{t('contacts.faq.heading')}</h3>
              <div className="rounded-2xl border border-border bg-bg2">
                {FAQ.map((f, i) => (
                  <details key={i} className="group border-b border-border last:border-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-fg transition-colors hover:text-brand-fg">
                      {f.q}
                      <span className="text-muted transition-transform group-open:rotate-180">▾</span>
                    </summary>
                    <div className="px-5 pb-4 text-sm leading-relaxed text-muted">{f.a}</div>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-16 md:px-8">
          <Reveal variant="fadeUp" className="relative overflow-hidden rounded-3xl border border-brand/20 bg-brand/[0.07] px-8 py-12 text-center md:px-12">
            <RingAccent className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-60" />
            <div className="relative">
              <h2 className="text-balance text-3xl font-light text-fg md:text-4xl">{t('contacts.cta.heading')}</h2>
              <p className="mx-auto mt-3 max-w-md text-muted">
                {t('contacts.cta.subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={() => navigate('/exchange')}>{t('contacts.cta.start')}</Button>
                <Button variant="outline" onClick={openChat}>{t('contacts.cta.chat')}</Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
