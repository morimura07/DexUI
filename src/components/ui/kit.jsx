import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { DUR, EASE } from '../../lib/motion';

/**
 * Interior design-system primitives, shared across the redesigned app pages
 * (Exchange, Auth, Contacts, UserPages…). Token-backed, so they theme for free.
 * The landing tree has its own shadcn-style primitives; these are the plain-JSX
 * counterparts for the rest of the app.
 */

/** Surface card. `pad` false when the caller wants edge-to-edge content. */
export function Panel({ className = '', pad = true, children, ...rest }) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-bg2', pad && 'p-6 md:p-7', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Labelled field wrapper: label → control → hint/error. */
export function Field({ label, htmlFor, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-fg">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-red">
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

const INPUT_BASE =
  'w-full rounded-xl border border-border px-4 py-3 text-fg outline-none transition-colors placeholder:text-subtle focus:border-brand disabled:opacity-50';

export function Input({ className = '', invalid = false, ...props }) {
  return <input className={cn(INPUT_BASE, invalid && 'border-red focus:border-red', className)} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={cn(INPUT_BASE, 'resize-none', className)} {...props} />;
}

/** Password input with a show/hide toggle. */
export function PasswordInput({ className = '', invalid = false, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={cn(INPUT_BASE, 'pr-11', invalid && 'border-red focus:border-red', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex cursor-pointer items-center border-none bg-transparent px-3 text-muted hover:text-fg"
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

/** Square checkbox with the brand tick. `onChange` receives a synthetic {target:{checked}}. */
export function Checkbox({ checked, onChange, children, className = '' }) {
  const toggle = () => onChange?.({ target: { checked: !checked } });
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted transition-colors hover:text-fg', className)}>
      <span
        onClick={(e) => { e.preventDefault(); toggle(); }}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
          checked ? 'border-brand bg-brand' : 'border-border',
        )}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span onClick={(e) => { e.preventDefault(); toggle(); }}>{children}</span>
    </label>
  );
}

/** Round radio dot. */
export function Radio({ checked, onChange, children, className = '' }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted transition-colors hover:text-fg', className)}>
      <span
        onClick={(e) => { e.preventDefault(); onChange?.(); }}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          checked ? 'border-brand' : 'border-border',
        )}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
      </span>
      <span onClick={(e) => { e.preventDefault(); onChange?.(); }}>{children}</span>
    </label>
  );
}

const TONES = {
  error: 'border-red/30 bg-red/10 text-red',
  info: 'border-brand/30 bg-brand/10 text-brand-fg',
  success: 'border-green/30 bg-green/10 text-green',
};

export function Alert({ tone = 'error', className = '', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: DUR.base, ease: [...EASE.out] }}
      className={cn('overflow-hidden rounded-xl border px-4 py-3 text-sm', TONES[tone] || TONES.error, className)}
    >
      {children}
    </motion.div>
  );
}

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50';
const BTN_VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-h',
  outline: 'border border-border bg-transparent text-fg hover:bg-fg/5',
  ghost: 'bg-transparent text-muted hover:text-fg',
};
const BTN_SIZES = { md: 'px-5 py-2.5 text-sm', lg: 'w-full px-6 py-4 text-base' };

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <motion.button
      className={cn(BTN_BASE, BTN_VARIANTS[variant], BTN_SIZES[size], className)}
      whileHover={props.disabled ? undefined : { y: -1 }}
      whileTap={props.disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: DUR.fast, ease: [...EASE.out] }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Numbered, editorial section label — the app's signature section marker.
 *   01 — PROOF OF RESERVES ──────────
 * A monospace index, an uppercase tracked label, and a hairline rule that runs
 * to the edge. Used across the content pages to tie them together.
 */
export function SectionLabel({ n, children, className = '' }) {
  return (
    <div className={cn('mb-8 flex items-center gap-3', className)}>
      {n != null && <span className="font-mono text-sm tabular-nums text-brand-fg">{n}</span>}
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/**
 * Concentric-arc accent — the app's ring motif (echoing the landing's rate-lock
 * ring). A quiet, themeable decorative element for hero corners and CTA panels.
 */
export function RingAccent({ className = '' }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" aria-hidden="true">
      <circle cx="200" cy="200" r="196" stroke="var(--line)" />
      <circle cx="200" cy="200" r="150" stroke="var(--line)" />
      <circle cx="200" cy="200" r="104" stroke="var(--line)" />
      <circle cx="200" cy="200" r="150" stroke="var(--brand)" strokeWidth="2" strokeDasharray="60 942" strokeLinecap="round" />
    </svg>
  );
}
