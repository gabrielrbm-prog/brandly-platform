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

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCreators from '@/pages/admin/AdminCreators';
import AdminCreatorDetail from '@/pages/admin/AdminCreatorDetail';
import AdminVideos from '@/pages/admin/AdminVideos';
import AdminProfiles from '@/pages/admin/AdminProfiles';
import AdminFinancial from '@/pages/admin/AdminFinancial';
import AdminBrands from '@/pages/admin/AdminBrands';
import AdminBrandDetail from '@/pages/admin/AdminBrandDetail';
import AdminNetwork from '@/pages/admin/AdminNetwork';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminAiUsage from '@/pages/admin/AdminAiUsage';
import AdminCourses from '@/pages/admin/AdminCourses';
import AdminCommunity from '@/pages/admin/AdminCommunity';
import AdminExport from '@/pages/admin/AdminExport';

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

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
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

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/creators" element={<AdminRoute><AdminCreators /></AdminRoute>} />
      <Route path="/admin/creators/:id" element={<AdminRoute><AdminCreatorDetail /></AdminRoute>} />
      <Route path="/admin/videos" element={<AdminRoute><AdminVideos /></AdminRoute>} />
      <Route path="/admin/profiles" element={<AdminRoute><AdminProfiles /></AdminRoute>} />
      <Route path="/admin/financial" element={<AdminRoute><AdminFinancial /></AdminRoute>} />
      <Route path="/admin/brands" element={<AdminRoute><AdminBrands /></AdminRoute>} />
      <Route path="/admin/brands/:id" element={<AdminRoute><AdminBrandDetail /></AdminRoute>} />
      <Route path="/admin/network" element={<AdminRoute><AdminNetwork /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/ai" element={<AdminRoute><AdminAiUsage /></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
      <Route path="/admin/community" element={<AdminRoute><AdminCommunity /></AdminRoute>} />
      <Route path="/admin/export" element={<AdminRoute><AdminExport /></AdminRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
