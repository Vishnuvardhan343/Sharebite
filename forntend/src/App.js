import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import './index.css';
import Chatbot from './components/Chatbot';
import Layout from './components/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutPage from './pages/AboutPage';
import CampaignsPage from './pages/CampaignsPage';
import DonorDashboard from './pages/DonorDashboard';
import NewDonationPage from './pages/NewDonationPage';
import DonationHistory from './pages/DonationHistory';
import NGOPages from './pages/NGOPages';
import AdminPages, { AdminUsersPage, AnalyticsPage, AdminDonationsPage } from './pages/AdminPages';
import NotificationsPage from './pages/Notifications';
import SmartMatchingPage from './pages/SmartMatching';
import VolunteerPage from './pages/VolunteerPage';
import ProfilePage from './pages/ProfilePage';

// ── Protected Route ──
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    // If logged in but wrong role, send to their own dashboard or home
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'donor') return <Navigate to="/donor" replace />;
    if (user?.role === 'volunteer' || user?.role === 'ngo') return <Navigate to="/ngo" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Layout>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />

              {/* Profile & Volunteer Role Switch */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              {/* Donor Routes */}
              <Route path="/donor" element={
                <ProtectedRoute allowedRoles={['donor', 'admin', 'volunteer', 'ngo']}>
                  <DonorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/donor/new-donation" element={
                <ProtectedRoute>
                  <NewDonationPage />
                </ProtectedRoute>
              } />
              <Route path="/donor/history" element={
                <ProtectedRoute>
                  <DonationHistory />
                </ProtectedRoute>
              } />

              {/* Volunteer Module */}
              <Route path="/volunteer" element={
                <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                  <VolunteerPage />
                </ProtectedRoute>
              } />

              {/* NGO/Volunteer Shared */}
              <Route path="/ngo" element={
                <ProtectedRoute allowedRoles={['ngo', 'volunteer', 'admin']}>
                  <NGOPages />
                </ProtectedRoute>
              } />
              <Route path="/matching" element={
                <ProtectedRoute allowedRoles={['ngo', 'volunteer', 'admin']}>
                  <SmartMatchingPage />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPages />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/donations" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDonationsPage />
                </ProtectedRoute>
              } />

              {/* Global */}
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
          <Chatbot />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
