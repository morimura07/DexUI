import { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { fetchCryptoNews, fetchCryptoArticles } from '../api/client';
import { SectionLabel } from '../components/ui/kit';
import { useT } from '../lib/i18n';
import { Reveal, RevealGroup, RevealItem, motion, lift } from '../lib/motion';

const CATS = ['All', 'Bitcoin', 'Ethereum', 'DeFi', 'Regulation', 'Altcoin', 'NFT'];

function timeAgo(dateStr, t) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600) return t('news.agoMin', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('news.agoHour', { n: Math.floor(diff / 3600) });
  return t('news.agoDay', { n: Math.floor(diff / 86400) });
}

function getTag(title = '') {
  const t = title.toLowerCase();
  if (t.includes('bitcoin') || t.includes('btc')) return 'Bitcoin';
  if (t.includes('ethereum') || t.includes('eth')) return 'Ethereum';
  if (t.includes('defi')) return 'DeFi';
  if (t.includes('regulation') || t.includes('sec')) return 'Regulation';
  if (t.includes('nft')) return 'NFT';
  if (t.includes('solana') || t.includes('altcoin')) return 'Altcoin';
  return 'Crypto';
}

function Thumb({ src, alt, className }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return <div className={`flex items-center justify-center bg-gradient-to-br from-bg3 to-bg4 text-subtle ${className}`}><Newspaper className="h-8 w-8" /></div>;
  }
  return <img src={src} alt={alt} onError={() => setBroken(true)} className={`object-cover ${className}`} />;
}

function Meta({ article }) {
  const { source, publishedAt } = article;
  const t = useT();
  return (
    <div className="flex items-center justify-between text-xs text-subtle">
      <span className="rounded bg-bg3 px-2 py-0.5">{source?.name}</span>
      <span>{timeAgo(publishedAt, t)}</span>
    </div>
  );
}

function NewsCard({ article }) {
  const { title, description, url, urlToImage } = article;
  const t = useT();
  return (
    <motion.button
      {...lift}
      onClick={() => window.open(url, '_blank')}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg2 text-left transition-all hover:-translate-y-0.5 hover:border-brand/50"
    >
      <div className="h-40 overflow-hidden bg-bg3">
        <Thumb src={urlToImage} alt={title} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-fg">{t(`news.cat.${getTag(title)}`)}</div>
        <div className="mb-1.5 line-clamp-2 text-sm font-medium leading-snug text-fg">{title}</div>
        {description && <div className="mb-3 line-clamp-3 text-xs leading-relaxed text-muted">{description}</div>}
        <div className="mt-auto"><Meta article={article} /></div>
      </div>
    </motion.button>
  );
}

function LeadCard({ article }) {
  const { title, description, url, urlToImage } = article;
  const t = useT();
  return (
    <motion.button
      {...lift}
      onClick={() => window.open(url, '_blank')}
      className="group grid overflow-hidden rounded-2xl border border-border bg-bg2 text-left transition-colors hover:border-brand/50 md:grid-cols-2"
    >
      <div className="h-56 overflow-hidden bg-bg3 md:h-full md:min-h-[320px]">
        <Thumb src={urlToImage} alt={title} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-col justify-center p-6 md:p-8">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-fg">{t(`news.cat.${getTag(title)}`)} · {t('news.topStory')}</div>
        <div className="mb-3 line-clamp-3 text-2xl font-light leading-tight text-fg md:text-3xl">{title}</div>
        {description && <div className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted">{description}</div>}
        <Meta article={article} />
      </div>
    </motion.button>
  );
}

export default function News() {
  const [news, setNews] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artLoad, setArtLoad] = useState(true);
  const [cat, setCat] = useState('All');
  const [error, setError] = useState('');
  const t = useT();

  useEffect(() => {
    setLoading(true);
    setError('');
    const q = cat === 'All' ? 'cryptocurrency bitcoin ethereum' : `crypto ${cat}`;
    fetchCryptoNews(q, 12).then((data) => {
      if (data.length > 0) setNews(data);
      else setError(t('news.error'));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  useEffect(() => {
    fetchCryptoArticles().then((data) => { setArticles(data); setArtLoad(false); });
  }, []);

  const [lead, ...rest] = news;

  return (
    <div className="mx-auto max-w-content px-6 pb-16 md:px-8">
      {/* ── HERO ── */}
      <Reveal variant="fadeUp" className="py-14 lg:py-16">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green/20 bg-green/10 px-3 py-1 text-xs font-medium text-green">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" /> {t('news.live')}
        </div>
        <h1 className="max-w-2xl text-balance text-5xl font-light leading-[1.02] tracking-tight text-fg md:text-6xl">
          {t('news.titleA')}<span className="text-brand-fg">{t('news.titleB')}</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
          {t('news.subtitle')}
        </p>
      </Reveal>

      {/* Category filter */}
      <div className="mb-10 flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              cat === c ? 'border-brand bg-brand/10 text-brand-fg' : 'border-border text-muted hover:text-fg'
            }`}
          >
            {t(`news.cat.${c}`)}
          </button>
        ))}
      </div>

      {/* News */}
      {loading ? (
        <div className="shimmer py-20 text-center text-sm text-muted">{t('news.fetching')}</div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-bg2 py-16 text-center text-sm text-red">{error}</div>
      ) : (
        <div className="space-y-6">
          {lead && <Reveal variant="fadeUp"><LeadCard article={lead} /></Reveal>}
          <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.map((a, i) => <RevealItem key={i} variant="scaleIn"><NewsCard article={a} /></RevealItem>)}
          </RevealGroup>
        </div>
      )}

      {/* Featured articles */}
      <div className="mt-16">
        <SectionLabel n="01">{t('news.featured')}</SectionLabel>
        {artLoad ? (
          <div className="shimmer py-10 text-center text-sm text-muted">{t('news.loadingArticles')}</div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-border bg-bg2 py-12 text-center text-sm text-muted">{t('news.noArticles')}</div>
        ) : (
          <Reveal variant="fadeUp" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((a, i) => <NewsCard key={i} article={a} />)}
          </Reveal>
        )}
      </div>
    </div>
  );
}
