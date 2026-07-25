import { useState, useEffect, useRef } from 'react';
import { FileText, X, ExternalLink, ShieldCheck, ShieldX } from 'lucide-react';
import { adminCall, adminBlob } from '../api';
import { Reveal } from '../../lib/motion';
import { useT } from '../../lib/i18n';
import Badge from '../components/Badge';

const FILTERS = ['PENDING', 'APPROVED', 'REJECTED', ''];

const fmtDate = d => {
  try { return d ? new Date(String(d).replace(' ', 'T')).toLocaleString() : '—'; }
  catch { return '—'; }
};

// Document viewer. The document endpoint is admin-authenticated, so it can't be
// an <img src> — it's fetched as a blob and shown from an object URL, which must
// be revoked on close or the blob leaks for the life of the tab.
function DocViewer({ id, onClose }) {
  const t = useT();
  const [state, setState] = useState({ loading: true, url: null, type: '', error: null });
  const urlRef = useRef(null);

  useEffect(() => {
    let alive = true;
    adminBlob(`admin/kyc/document?id=${id}`).then(r => {
      // Unmounted mid-flight: no object URL was ever created, so there's nothing
      // to revoke — just drop the blob.
      if (!alive) return;
      if (!r.success) return setState({ loading: false, url: null, type: '', error: r.error?.message || t('adminKyc.docFailed') });
      const url = URL.createObjectURL(r.blob);
      urlRef.current = url;
      setState({ loading: false, url, type: r.type, error: null });
    });
    return () => {
      alive = false;
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    };
  }, [id]);

  const isPdf = state.type.includes('pdf');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-bg2">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="text-[12px] font-semibold">{t('adminKyc.docTitle', { id })}</div>
          <button onClick={onClose} aria-label={t('admin.common.close')}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg3 hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex min-h-[240px] flex-1 items-center justify-center overflow-auto p-4">
          {state.loading && <div className="shimmer text-[11px] text-muted">{t('adminKyc.docLoading')}</div>}
          {state.error && <div className="text-[11px] text-red">{state.error}</div>}
          {state.url && isPdf && (
            <div className="text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted" />
              <p className="mb-3 text-[11px] text-muted">{t('adminKyc.docPdf')}</p>
              <a href={state.url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-[10px] text-fg hover:border-brand hover:text-brand-fg">
                <ExternalLink className="h-3 w-3" /> {t('adminKyc.docOpen')}
              </a>
            </div>
          )}
          {state.url && !isPdf && <img src={state.url} alt="" className="max-h-full max-w-full rounded-lg object-contain" />}
        </div>
        <div className="shrink-0 border-t border-border px-4 py-2 text-[10px] text-subtle">{t('adminKyc.docAudited')}</div>
      </div>
    </div>
  );
}

function RejectModal({ sub, onCancel, onConfirm }) {
  const t = useT();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!note.trim()) return;
    setBusy(true);
    await onConfirm(sub.id, note.trim());
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onCancel} className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-bg2 p-5">
        <div className="mb-1 text-[12px] font-semibold">{t('adminKyc.rejectTitle')}</div>
        <p className="mb-3 text-[11px] leading-relaxed text-muted">{t('adminKyc.rejectDesc', { name: sub.full_name || sub.user_email })}</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} autoFocus
          placeholder={t('adminKyc.rejectPlaceholder')}
          className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-[11px] text-fg outline-none focus:border-brand" />
        <div className="mt-3 flex items-center gap-2">
          <button onClick={go} disabled={!note.trim() || busy}
            className="cursor-pointer rounded border border-red/20 bg-red/10 px-2.5 py-1.5 text-[10px] font-semibold text-red hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? t('adminKyc.rejecting') : t('adminKyc.confirmReject')}
          </button>
          <button onClick={onCancel} className="cursor-pointer border-none bg-transparent p-0 text-[10px] text-muted hover:text-fg">
            {t('admin.common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Kyc() {
  const t = useT();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  const load = () => adminCall('GET', 'admin/kyc/list').then(r => {
    if (r.success) { setSubs(r.data.submissions || []); setErr(null); }
    else setErr(r.error?.message || t('adminKyc.loadFailed'));
    setLoading(false);
  });
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    setBusyId(id);
    const r = await adminCall('POST', 'admin/kyc/approve', { id });
    setBusyId(null);
    if (r.success) load(); else setErr(r.error?.message || t('adminKyc.actionFailed'));
  };

  const reject = async (id, note) => {
    const r = await adminCall('POST', 'admin/kyc/reject', { id, note });
    setRejecting(null);
    if (r.success) load(); else setErr(r.error?.message || t('adminKyc.actionFailed'));
  };

  if (loading) return <div className="shimmer py-8 text-center text-[11px] text-muted">{t('adminKyc.loading')}</div>;

  const shown = filter ? subs.filter(s => s.status === filter) : subs;
  const pendingCount = subs.filter(s => s.status === 'PENDING').length;

  return (
    <div>
      <p className="mb-4 text-[11px] text-muted">{t('adminKyc.intro')}</p>

      {err && <div className="mb-3 rounded-lg border border-red/20 bg-red/10 px-3 py-2 text-[11px] text-red">{err}</div>}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f || 'all'} onClick={() => setFilter(f)}
            className={`cursor-pointer rounded border px-2.5 py-1 text-[10px] font-medium transition-colors ${
              filter === f ? 'border-brand/20 bg-brand/10 text-brand-fg' : 'border-border text-muted hover:text-fg'
            }`}>
            {f ? t(`adminKyc.filter.${f}`) : t('adminKyc.filter.ALL')}
            {f === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg2 py-12 text-center text-[11px] text-muted">
          {t('adminKyc.empty')}
        </div>
      ) : (
        <Reveal variant="fadeUp" className="space-y-3">
          {shown.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-bg2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-semibold">{s.full_name || t('adminKyc.noName')}</span>
                    <Badge label={s.status} type={s.status} />
                    <span className="text-[10px] text-subtle">#{s.id}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted">{s.user_email}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-subtle">
                    <span>{t('adminKyc.docType')}: {t(`adminKyc.doc.${s.document_type}`)}</span>
                    <span>{t('adminKyc.submitted')}: {fmtDate(s.created_at)}</span>
                    {s.reviewed_at && <span>{t('adminKyc.reviewed')}: {fmtDate(s.reviewed_at)}</span>}
                  </div>
                  {s.review_note && (
                    <div className="mt-2 text-[10px] text-muted">
                      <span className="text-subtle">{t('adminKyc.note')}:</span> {s.review_note}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {s.document_path && (
                    <button onClick={() => setViewing(s.id)}
                      className="flex cursor-pointer items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-fg hover:border-brand hover:text-brand-fg">
                      <FileText className="h-3 w-3" /> {t('adminKyc.viewDoc')}
                    </button>
                  )}
                  {s.status === 'PENDING' && (
                    <>
                      <button onClick={() => approve(s.id)} disabled={busyId === s.id}
                        className="flex cursor-pointer items-center gap-1 rounded border border-green/20 bg-green/10 px-2 py-1 text-[10px] text-green hover:bg-green/20 disabled:opacity-50">
                        <ShieldCheck className="h-3 w-3" /> {t('adminKyc.approve')}
                      </button>
                      <button onClick={() => setRejecting(s)} disabled={busyId === s.id}
                        className="flex cursor-pointer items-center gap-1 rounded border border-red/20 bg-red/10 px-2 py-1 text-[10px] text-red hover:bg-red/20 disabled:opacity-50">
                        <ShieldX className="h-3 w-3" /> {t('adminKyc.reject')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Reveal>
      )}

      {viewing != null && <DocViewer id={viewing} onClose={() => setViewing(null)} />}
      {rejecting && <RejectModal sub={rejecting} onCancel={() => setRejecting(null)} onConfirm={reject} />}
    </div>
  );
}
