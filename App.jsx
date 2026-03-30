import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BrandsmithProvider, useBrandsmith } from './BrandsmithContext';
import LandingPage from './LandingPage';
import { AuthScreen } from './AuthScreen';
import { DashboardScreen } from './DashboardScreen';
import { BuilderScreen } from './BuilderScreen';
import { ProfileScreen } from './ProfileScreen';
import { PrivacyPage, TermsPage } from './LegalPages';

function ProtectedRoute({ children }) {
  const { session, loading } = useBrandsmith();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="bs-spinner" /></div>;
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;
  
  return children;
}

function AuthRoute({ children }) {
  const { session, loading } = useBrandsmith();
  if (loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="bs-spinner" /></div>;
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrandsmithProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthRoute><AuthScreen /></AuthRoute>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="/studio" element={<ProtectedRoute><BuilderScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
        
        {/* Legal Pages */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrandsmithProvider>
  );
}
