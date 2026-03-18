import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';

// Protected pages
import Dashboard from '@/pages/dashboard/Dashboard';
import Videos from '@/pages/videos/Videos';
import Financial from '@/pages/financial/Financial';
import Network from '@/pages/network/Network';
import Studio from '@/pages/studio/Studio';
import Brands from '@/pages/brands/Brands';
import Profile from '@/pages/profile/Profile';
import Social from '@/pages/social/Social';
import Courses from '@/pages/courses/Courses';
import Community from '@/pages/community/Community';
import BehavioralOnboarding from '@/pages/onboarding/BehavioralOnboarding';
import BehavioralResult from '@/pages/onboarding/BehavioralResult';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen themed-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen themed-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
      <Route path="/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
      <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
      <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
      <Route path="/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><BehavioralOnboarding /></ProtectedRoute>} />
      <Route path="/onboarding/result" element={<ProtectedRoute><BehavioralResult /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
