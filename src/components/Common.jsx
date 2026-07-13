import { Link } from 'react-router-dom';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../lib/i18n';
import { Reveal } from '../lib/motion';
import { Logo } from './Logo';

export function Footer() {
  const t = useT();
  const FOOTER_LINKS = [
    { heading: t('footer.exchangeHeading'), links: [
      { to: '/overview', label: t('nav.overview') },
      { to: '/exchange', label: t('footer.startExchange') },
      { to: '/about', label: t('footer.directions') },
      { to: '/news', label: t('nav.news') },
    ]},
    { heading: t('footer.companyHeading'), links: [
      { to: '/about', label: t('footer.aboutUs') },
      { to: '/contacts', label: t('nav.contacts') },
      { to: '/affiliate', label: t('footer.affiliate') },
    ]},
    { heading: t('footer.legalHeading'), links: [
      { to: '/rules', label: t('nav.rules') },
      { to: '/kyc', label: t('footer.kycPolicy') },
    ]},
  ];

  return (
    <footer className="border-t border-border">
      <Reveal variant="fadeUp" className="mx-auto w-full max-w-content px-6 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/overview" className="flex items-center gap-2 font-semibold tracking-tight text-fg">
              <Logo className="h-6" />
              SwiftSwap
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {t('footer.tagline')}
            </p>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <div className="mb-4 text-xs font-medium uppercase tracking-wider text-subtle">{col.heading}</div>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="text-sm text-muted transition-colors hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-subtle md:flex-row md:items-center">
          <div>{t('footer.rights')}</div>
          <div>{t('footer.badges')}</div>
        </div>
      </Reveal>
    </footer>
  );
}

export function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  const t = useT();
  if (loading) return <div className="flex items-center justify-center min-h-[40vh] text-muted text-sm">{t('common.loading')}</div>;
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}
