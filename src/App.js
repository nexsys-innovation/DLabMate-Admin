import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DirectoryPage from './pages/DirectoryPage';
import EntityDetailPage from './pages/EntityDetailPage';
import VerificationQueuePage from './pages/VerificationQueuePage';
import VerificationReviewPage from './pages/VerificationReviewPage';
import AddClinicPage from './pages/AddClinicPage';
import MarketingPage from './pages/MarketingPage';
import BillingOrdersQueuePage from './pages/BillingOrdersQueuePage';

const Protected = ({ children }) => {
  const location = useLocation();
  return localStorage.getItem('adminToken')
    ? children
    : <Navigate to="/login" state={{ from: location }} replace />;
};

const Shell = ({ children }) => <Protected><AdminLayout>{children}</AdminLayout></Protected>;

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Shell><DashboardPage /></Shell>} />
      <Route path="/labs" element={<Shell><DirectoryPage type="lab" /></Shell>} />
      <Route path="/labs/:id" element={<Shell><EntityDetailPage type="lab" /></Shell>} />
      <Route path="/clinics" element={<Shell><DirectoryPage type="clinic" /></Shell>} />
      <Route path="/clinics/:id" element={<Shell><EntityDetailPage type="clinic" /></Shell>} />
      <Route path="/clinics/new" element={<Shell><AddClinicPage /></Shell>} />
      <Route path="/verification" element={<Shell><VerificationQueuePage /></Shell>} />
      <Route path="/verification/:submissionId" element={<Shell><VerificationReviewPage /></Shell>} />
      <Route path="/billing-orders" element={<Shell><BillingOrdersQueuePage /></Shell>} />
      <Route path="/marketing" element={<Shell><MarketingPage /></Shell>} />
      <Route path="*" element={<Navigate to={localStorage.getItem('adminToken') ? '/dashboard' : '/login'} replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
