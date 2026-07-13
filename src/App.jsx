import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import { Footer, ProtectedRoute } from './components/Common';
import Overview from './pages/Overview';
import News from './pages/News';
import { Rules, Kyc } from './pages/StaticPages';
import Contacts from './pages/Contacts';
import About from './pages/About';
import Exchange from './pages/Exchange';
import { Login, Register, ForgotPassword, ResetPassword, VerifyEmail } from './pages/AuthPages';
import { OrderPage, MyOrders, Profile, Affiliate } from './pages/UserPages';
import AdminPanel from './admin/AdminApp';
import ChatWidget from './components/ChatWidget';

function MainLayout({ children }) {
  const { pathname } = useLocation();
  const hideFooter = ['/login','/register','/forgot-password','/reset-password','/verify-email'].includes(pathname);
  return (
    <div className="min-h-screen flex flex-col" style={{maxWidth:'1400px', margin:'0 auto', width:'100%'}}>
      <Navbar />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
      <ChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Admin — full screen, no navbar/footer, stays at /admin */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Main site */}
          <Route path="/" element={<MainLayout><Navigate to="/overview" replace /></MainLayout>} />
          <Route path="/overview"  element={<MainLayout><Overview /></MainLayout>} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}