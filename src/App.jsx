import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/landing/navbar';
import { Footer, ProtectedRoute } from './components/Common';
import { PageTransition } from './lib/motion';
import News from './pages/News';
import { Rules, Kyc } from './pages/StaticPages';
import Contacts from './pages/Contacts';
import About from './pages/About';
import Exchange from './pages/Exchange';
import { Login, Register, ForgotPassword, ResetPassword, VerifyEmail } from './pages/AuthPages';
import { OrderPage, MyOrders, Profile, Affiliate } from './pages/UserPages';
import ChatWidget from './components/ChatWidget';

// Split out the two heaviest, least-shared routes. Landing drags in motion and
// lenis; the admin panel is a whole second app. Neither belongs in the chunk
// that /login downloads.
const Landing = lazy(() => import('./pages/Landing'));
const AdminPanel = lazy(() => import('./admin/AdminApp'));

function RouteFallback() {
  return <div className="min-h-screen bg-bg" />;
}

function MainLayout({ children }) {
  const { pathname } = useLocation();
  const hideFooter = ['/login','/register','/forgot-password','/reset-password','/verify-email'].includes(pathname);
  return (
    <div className="min-h-screen flex flex-col w-full ">
      <Navbar />
      {/* The unified navbar is a fixed floating pill, so content needs clearance.
          Keying the transition on pathname replays a refined enter on each route. */}
      <main className="flex-1 pt-28">
        <PageTransition key={pathname}>{children}</PageTransition>
      </main>
      {!hideFooter && <Footer />}
      <ChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Admin — full screen, no navbar/footer, stays at /admin */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Landing — full-bleed, ships its own navbar and chat widget */}
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Landing />} />

          {/* Main site */}
          <Route path="/news"      element={<MainLayout><News /></MainLayout>} />
          <Route path="/rules"     element={<MainLayout><Rules /></MainLayout>} />
          <Route path="/kyc"       element={<MainLayout><Kyc /></MainLayout>} />
          <Route path="/contacts"  element={<MainLayout><Contacts /></MainLayout>} />
          <Route path="/about"     element={<MainLayout><About /></MainLayout>} />
          <Route path="/exchange"  element={<MainLayout><Exchange /></MainLayout>} />
          <Route path="/login"     element={<MainLayout><Login /></MainLayout>} />
          <Route path="/register"  element={<MainLayout><Register /></MainLayout>} />
          <Route path="/forgot-password" element={<MainLayout><ForgotPassword /></MainLayout>} />
          <Route path="/reset-password"  element={<MainLayout><ResetPassword /></MainLayout>} />
          <Route path="/verify-email"    element={<MainLayout><VerifyEmail /></MainLayout>} />
          <Route path="/order/:orderId" element={<MainLayout><OrderPage /></MainLayout>} />
          <Route path="/orders"    element={<MainLayout><ProtectedRoute><MyOrders /></ProtectedRoute></MainLayout>} />
          <Route path="/profile"   element={<MainLayout><ProtectedRoute><Profile /></ProtectedRoute></MainLayout>} />
          <Route path="/affiliate" element={<MainLayout><ProtectedRoute><Affiliate /></ProtectedRoute></MainLayout>} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}