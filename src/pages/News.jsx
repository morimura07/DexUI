import { useState, useEffect } from 'react';
import { fetchCryptoNews, fetchCryptoArticles } from '../api/client';

const CATS = ['All','Bitcoin','Ethereum','DeFi','Regulation','Altcoin','NFT'];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function getTag(title='') {
  const t = title.toLowerCase();
  if (t.includes('bitcoin')||t.includes('btc'))  return 'Bitcoin';
  if (t.includes('ethereum')||t.includes('eth')) return 'Ethereum';
  if (t.includes('defi'))                        return 'DeFi';
  if (t.includes('regulation')||t.includes('sec')) return 'Regulation';
  if (t.includes('nft'))                         return 'NFT';
  if (t.includes('solana')||t.includes('altcoin')) return 'Altcoin';
  return 'Crypto';
}

function NewsCard({ article }) {
  const { title, description, url, urlToImage, publishedAt, source } = article;
  return (
    <div onClick={() => window.open(url,'_blank')}
      className="bg-bg2 border border-border rounded-xl overflow-hidden cursor-pointer hover:border-yellow hover:-translate-y-0.5 transition-all group">
      <div className="h-40 overflow-hidden bg-bg3 relative">
        {urlToImage
          ? <img src={urlToImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl">📰</div>'; }} />
          : <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-bg3 to-bg4">📰</div>}
      </div>
      <div className="p-4">
        <div className="text-[10px] text-yellow font-bold uppercase tracking-wider mb-1.5">{getTag(title)}</div>
        <div className="text-[13px] font-bold mb-1.5 leading-snug line-clamp-2">{title}</div>
        {description && <div className="text-[11.5px] text-muted leading-relaxed mb-2.5 line-clamp-3">{description}</div>}
        <div className="flex items-center justify-between text-[10.5px] text-muted">
          <span className="bg-bg3 px-2 py-0.5 rounded text-[10px]">{source?.name}</span>
          <span>{timeAgo(publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}

export default function News() {
  const [news, setNews]         = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [artLoad, setArtLoad]   = useState(true);
  const [cat, setCat]           = useState('All');
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    const q = cat==='All' ? 'cryptocurrency bitcoin ethereum' : `crypto ${cat}`;
    fetchCryptoNews(q, 12).then(data => {
      if (data.length>0) setNews(data);
      else setError('Unable to load news. Check your API key or try again later.');
      setLoading(false);
    });
  }, [cat]);

  useEffect(() => {
    fetchCryptoArticles().then(data => { setArticles(data); setArtLoad(false); });
  }, []);

  return (
    <div className="px-4 md:px-8 py-7">
      <h1 className="text-xl md:text-[22px] font-extrabold mb-1">Crypto News</h1>
      <p className="text-[12.5px] text-muted mb-6">Latest cryptocurrency news, market updates, and blockchain insights — live</p>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${cat===c
              ? 'border-yellow bg-yellow/10 text-yellow'
              : 'border-border bg-transparent text-muted hover:text-white'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* News grid */}
      {loading ? (
        <div className="text-center py-16 text-muted">
          <div className="text-2xl mb-3">⏳</div>Fetching latest crypto news…
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red text-[12.5px]">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {news.map((a,i) => <NewsCard key={i} article={a} />)}
        </div>
      )}

      {/* Articles */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[17px] font-bold">Featured Articles</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      {artLoad ? (
        <div className="text-center py-10 text-muted text-sm">Loading articles…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {articles.map((a,i) => <NewsCard key={i} article={a} />)}
        </div>
      )}
    </div>
  );
}
