import { Link } from 'react-router-dom';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Footer() {
  return (
    <footer className="border-t border-border px-6 md:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[11.5px] text-muted">
      <div>© 2026 SwiftSwap. All rights reserved.</div>
      <div className="flex flex-wrap justify-center gap-5">
        <Link to="/rules"    className="hover:text-yellow transition-colors">Rules</Link>
        <Link to="/kyc"      className="hover:text-yellow transition-colors">KYC/AML</Link>
        <Link to="/contacts" className="hover:text-yellow transition-colors">Contacts</Link>
        <Link to="/about"    className="hover:text-yellow transition-colors">About Us</Link>
      </div>
    </footer>
  );
}

export function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex items-center justify-center min-h-[40vh] text-muted text-sm">Loading...</div>;
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}
