import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Reveal } from '../lib/motion';

const stripNum = (t) => t.replace(/^\d+\.\s*/, '');
const readingMinutes = (sections) => {
  const words = sections.reduce((n, [, body]) => n + body.split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 200));
};

/**
 * Shared long-form legal layout: editorial hero, a sticky numbered table of
 * contents with scroll-spy, and a readable single-column document. Section data
 * lives at module scope so the observer isn't torn down on every render.
 */
function LegalPage({ eyebrow, title, intro, sections }) {
  const [active, setActive] = useState(0);
  const { lang, t } = useI18n();

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.dataset.idx));
        });
      },
      // Activate a section once it reaches the top ~30% of the viewport, below the nav.
      { rootMargin: '-120px 0px -70% 0px' },
    );
    sections.forEach((_, i) => {
      const el = document.getElementById(`s-${i}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  const go = (i) => document.getElementById(`s-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="mx-auto max-w-content px-6 pb-20 md:px-8">
      {/* ── HERO ── */}
      <Reveal variant="fadeUp" className="border-b border-border py-14 lg:py-16">
        <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-brand-fg">{eyebrow}</div>
        <h1 className="max-w-2xl text-balance text-4xl font-light leading-[1.05] tracking-tight text-fg md:text-5xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{intro}</p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-subtle">
          <span>{t('legal.sectionsCount', { n: sections.length })}</span>
          <span>{t('legal.minRead', { n: readingMinutes(sections) })}</span>
        </div>
        {lang !== 'en' && (
          <p className="mt-6 max-w-2xl rounded-xl border border-border bg-bg2 px-4 py-3 text-sm text-subtle">
            {t('common.legalEnglishOnly')}
          </p>
        )}
      </Reveal>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-16 lg:pt-12">
        {/* ── TABLE OF CONTENTS ── */}
        <nav className="mb-10 lg:sticky lg:top-28 lg:mb-0 lg:self-start">
          <div className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-subtle">{t('legal.contents')}</div>
          <ol className="space-y-0.5">
            {sections.map(([t], i) => (
              <li key={i}>
                <button
                  onClick={() => go(i)}
                  className={`flex w-full items-baseline gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active === i ? 'bg-brand/10 text-brand-fg' : 'text-muted hover:bg-bg3 hover:text-fg'
                  }`}
                >
                  <span className="font-mono text-xs tabular-nums text-subtle">{String(i + 1).padStart(2, '0')}</span>
                  <span>{stripNum(t)}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── DOCUMENT ── */}
        <article className="max-w-[680px] pt-12 lg:pt-0">
          {sections.map(([t, body], i) => (
            <section key={i} id={`s-${i}`} data-idx={i} className="scroll-mt-28 border-t border-border py-10 first:border-t-0 first:pt-0">
              <Reveal variant="fadeUp">
                <div className="mb-4 font-mono text-sm tabular-nums text-brand-fg">{String(i + 1).padStart(2, '0')}</div>
                <h2 className="mb-5 text-2xl font-light text-fg">{stripNum(t)}</h2>
                <div className="space-y-4">
                  {body.split('\n\n').map((p, j) => (
                    <p key={j} className="text-[15px] leading-[1.75] text-muted">{p}</p>
                  ))}
                </div>
              </Reveal>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

// Section titles/bodies live in the translation tables (ns 'rules' / 'kyc');
// build [title, body] pairs from the keys so the whole document localizes.
function useSections(ns, count) {
  const { t } = useI18n();
  return Array.from({ length: count }, (_, i) => [t(`${ns}.s${i + 1}t`), t(`${ns}.s${i + 1}b`)]);
}

export function Rules() {
  const { t } = useI18n();
  return (
    <LegalPage
      eyebrow={t('rules.eyebrow')}
      title={t('rules.title')}
      intro={t('rules.intro')}
      sections={useSections('rules', 10)}
    />
  );
}

export function Kyc() {
  const { t } = useI18n();
  return (
    <LegalPage
      eyebrow={t('kyc.eyebrow')}
      title={t('kyc.title')}
      intro={t('kyc.intro')}
      sections={useSections('kyc', 8)}
    />
  );
}
