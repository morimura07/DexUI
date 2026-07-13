import { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config';
import { useNavigate, Link } from 'react-router-dom';
import { fetchBeeSwapRoutes } from '../api/client';
import Reviews from '../components/Reviews';
import { Button, SectionLabel, RingAccent } from '../components/ui/kit';
import { useT } from '../lib/i18n';
import { Reveal, RevealGroup, RevealItem, motion, lift } from '../lib/motion';

const BEESWAP_IMG = (path) =>
  path ? `${API_BASE}/public/beeswap/image?path=${encodeURIComponent(path)}` : null;

const imgOf = (t) => BEESWAP_IMG(t?.image?.files?.find((f) => f.type === 'small')?.url);
const num = (v) => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : 0; };

// Reserve per receive-currency = the largest reserve any route offers in it. Matches the
// field the rest of the app reads (route.reserve), with the legacy rate.amount as fallback.
function buildReserves(routes) {
  const seen = new Map();
  routes.forEach((r) => {
    const key = r.to?.xml;
    if (!key) return;
    const amount = num(r.reserve) || num(r.rate?.amount);
    const existing = seen.get(key);
    if (!existing || amount > existing.amount) {
      seen.set(key, { xml: key, name: r.to?.name, symbol: r.to?.symbol, amount, token: r.to });
    }
  });
  return [...seen.values()].sort((a, b) => b.amount - a.amount);
}

// Static stand-in, shown only until live routes arrive.
const RESERVES_FALLBACK = [
  { name: 'Tether TRC20', symbol: 'USDT', amount: 20814506 },
  { name: 'Visa/MC UAH', symbol: 'UAH', amount: 4200000 },
  { name: 'TRON', symbol: 'TRX', amount: 985000 },
  { name: 'Ripple', symbol: 'XRP', amount: 95000 },
  { name: 'Solana', symbol: 'SOL', amount: 340 },
  { name: 'Monero', symbol: 'XMR', amount: 120.5 },
  { name: 'Ethereum', symbol: 'ETH', amount: 48.21 },
  { name: 'Bitcoin', symbol: 'BTC', amount: 2.543 },
].map((r) => ({ ...r, token: null, xml: r.symbol }));

function fmtReserve(n) {
  const v = num(n);
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toFixed(v < 1 ? 6 : 2);
}

function rateString(r) {
  const rateOut = num(r.rate?.out);
  const rateIn = num(r.rate?.in);
  return rateOut > 1
    ? `1 ${r.from?.symbol} = ${rateOut.toFixed(r.to?.decimal || 2)} ${r.to?.symbol}`
    : `1 ${r.to?.symbol} = ${rateIn.toFixed(r.from?.decimal || 2)} ${r.from?.symbol}`;
}

function CoinIcon({ token, symbol, size = 'md' }) {
  const [broken, setBroken] = useState(false);
  const src = imgOf(token);
  const dim = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const sym = (token?.symbol || symbol || '??').slice(0, 2);
  if (!src || broken) {
    return (
      <span className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold text-brand-fg`}>
        {sym}
      </span>
    );
  }
  return <img src={src} alt="" onError={() => setBroken(true)} className={`${dim} shrink-0 rounded-full object-contain`} />;
}

export default function About() {
  const t = useT();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBeeSwapRoutes().then((data) => { setRoutes(data || []); setLoading(false); });
  }, []);

  const reserves = useMemo(
    () => (routes.length ? buildReserves(routes) : RESERVES_FALLBACK),
    [routes],
  );
  const maxReserve = reserves[0]?.amount || 1;

  const featured = useMemo(() => routes.slice(0, 5), [routes]);

  const filtered = useMemo(() => {
    if (!search) return routes;
    const q = search.toLowerCase();
    return routes.filter((r) =>
      r.from?.name?.toLowerCase().includes(q) || r.from?.symbol?.toLowerCase().includes(q) ||
      r.to?.name?.toLowerCase().includes(q) || r.to?.symbol?.toLowerCase().includes(q));
  }, [routes, search]);

  const pairLabel = routes.length ? `${routes.length}` : '—';

  return (
    <div className="pb-4">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <RingAccent className="pointer-events-none absolute -right-24 -top-20 hidden h-[520px] w-[520px] opacity-70 lg:block" />
        <div className="mx-auto grid max-w-content items-center gap-12 px-6 py-16 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <Reveal variant="fadeLeft">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-medium text-brand-fg">
              {t('about.hero.eyebrow')}
            </div>
            <h1 className="text-balance text-5xl font-light leading-[1.02] tracking-tight text-fg md:text-6xl lg:text-7xl">
              {t('about.hero.titleLine1')}
              <br />
              <span className="text-brand-fg">{t('about.hero.titleLine2')}</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              {t('about.hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => document.getElementById('directions')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('about.hero.browseCta')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/exchange')}>{t('about.hero.startCta')}</Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t border-border pt-8">
              {[[pairLabel, t('about.stats.directions')], ['24/7', t('about.stats.support')], [t('about.stats.settlementValue'), t('about.stats.settlement')]].map(([v, l]) => (
                <div key={l}>
                  <div className="text-3xl font-light tabular-nums text-fg">{v}</div>
                  <div className="mt-1 text-sm text-subtle">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Live directions board — functional, not decorative */}
          <Reveal variant="fadeRight" className="relative rounded-2xl border border-border bg-bg2/70 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-sm font-medium text-fg">{t('about.featured.title')}</span>
              {routes.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-green">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />{t('about.featured.live')}
                </span>
              )}
            </div>
            <div className="divide-y divide-border">
              {(loading ? Array.from({ length: 5 }) : featured).map((r, i) =>
                r ? (
                  <motion.button
                    {...lift}
                    key={i}
                    onClick={() => navigate(`/exchange?from=${r.from?.xml}&to=${r.to?.xml}`)}
                    className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-bg3/50"
                  >
                    <span className="flex items-center -space-x-2">
                      <CoinIcon token={r.from} size="sm" />
                      <CoinIcon token={r.to} size="sm" />
                    </span>
                    <span className="text-sm font-medium text-fg">{r.from?.symbol} → {r.to?.symbol}</span>
                    <span className="ml-auto text-xs tabular-nums text-subtle transition-colors group-hover:text-brand-fg">{rateString(r)}</span>
                  </motion.button>
                ) : (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="h-6 w-12 shimmer rounded-full bg-bg3" />
                    <div className="h-3 w-24 shimmer rounded bg-bg3" />
                  </div>
                ),
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PROOF OF RESERVES ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-16 md:px-8 lg:py-20">
          <SectionLabel n="01">{t('about.reserves.eyebrow')}</SectionLabel>
          <Reveal variant="fadeUp" className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl text-balance text-3xl font-light leading-tight text-fg md:text-4xl">
              {t('about.reserves.title')}
            </h2>
            {routes.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-green">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />{t('about.reserves.liveBalances')}
              </span>
            )}
          </Reveal>

          <Reveal variant="fadeUp" className="rounded-2xl border border-border bg-bg2">
            {reserves.slice(0, 8).map((r, i) => (
              <div key={r.xml || i} className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0 md:gap-6 md:px-6">
                <span className="w-6 shrink-0 font-mono text-xs tabular-nums text-subtle">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex w-40 shrink-0 items-center gap-3">
                  <CoinIcon token={r.token} symbol={r.symbol} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fg">{r.symbol}</div>
                    <div className="truncate text-xs text-subtle">{r.name}</div>
                  </div>
                </div>
                <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-bg sm:block">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(3, (r.amount / maxReserve) * 100)}%` }} />
                </div>
                <div className="ml-auto w-28 shrink-0 text-right text-lg font-light tabular-nums text-fg sm:ml-0">{fmtReserve(r.amount)}</div>
              </div>
            ))}
          </Reveal>
          <p className="mt-4 text-sm text-subtle">
            {t('about.reserves.note')}
          </p>
        </div>
      </section>

      {/* ── DIRECTIONS EXPLORER ── */}
      <section id="directions" className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-16 md:px-8 lg:py-20">
          <SectionLabel n="02">{t('about.directions.eyebrow')}</SectionLabel>
          <Reveal variant="fadeUp" className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-balance text-3xl font-light leading-tight text-fg md:text-4xl">
              {t('about.directions.title')}
            </h2>
            <div className="w-full md:max-w-xs">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-4 py-3 transition-colors focus-within:border-brand">
                <span className="text-subtle">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('about.directions.searchPlaceholder')}
                  className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
                />
              </div>
            </div>
          </Reveal>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[104px] shimmer rounded-2xl border border-border bg-bg2" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg2 py-16 text-center text-sm text-muted">
              {t('about.directions.empty', { query: search })}
            </div>
          ) : (
            <Reveal variant="fadeUp" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r, i) => (
                <motion.button
                  {...lift}
                  key={i}
                  onClick={() => navigate(`/exchange?from=${r.from?.xml}&to=${r.to?.xml}`)}
                  className="group rounded-2xl border border-border bg-bg2 p-5 text-left transition-colors hover:border-brand/40 hover:bg-bg3/40"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex items-center -space-x-2.5">
                      <CoinIcon token={r.from} size="md" />
                      <CoinIcon token={r.to} size="md" />
                    </span>
                    <span className="text-base font-medium text-fg">{r.from?.symbol} → {r.to?.symbol}</span>
                    <span className="ml-auto text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-brand-fg">→</span>
                  </div>
                  <div className="truncate text-sm text-muted">{r.from?.name} → {r.to?.name}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="tabular-nums text-brand-fg">{rateString(r)}</span>
                    {r.from?.min && (
                      <span className="tabular-nums text-subtle">
                        {t('about.directions.min', { value: Number(r.from.min).toLocaleString(undefined, { maximumFractionDigits: 8 }) })}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </Reveal>
          )}
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-16 md:px-8 lg:py-20">
          <SectionLabel n="03">{t('about.why.eyebrow')}</SectionLabel>
          <RevealGroup className="grid gap-x-10 gap-y-10 md:grid-cols-3">
            {['ownReserves', 'rateLocked', 'compliance', 'validated', 'multiRail', 'ratesUpfront'].map((key, i) => (
              <RevealItem key={key} variant="scaleIn" className="border-t border-border pt-6">
                <div className="mb-3 font-mono text-sm tabular-nums text-brand-fg">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="mb-2 text-lg font-normal text-fg">{t(`about.why.items.${key}.title`)}</h3>
                <p className="text-sm leading-relaxed text-muted">{t(`about.why.items.${key}.desc`)}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-content px-6 py-16 md:px-8">
          <Reveal variant="fadeUp" className="relative overflow-hidden rounded-3xl border border-brand/20 bg-brand/[0.07] px-8 py-12 md:px-12">
            <RingAccent className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-60" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="text-balance text-3xl font-light text-fg md:text-4xl">{t('about.cta.title')}</h2>
                <p className="mt-2 text-muted">{t('about.cta.subtitle')}</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button onClick={() => navigate('/exchange?from=CARDUAH&to=USDTTRC20')}>UAH → USDT</Button>
                <Button variant="outline" onClick={() => navigate('/exchange?from=USDTTRC20&to=CARDUAH')}>USDT → UAH</Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Reviews />
    </div>
  );
}
