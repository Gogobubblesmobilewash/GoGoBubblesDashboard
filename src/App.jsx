import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Login from './components/auth/Login';
import Layout from './components/shared/Layout';
import Dashboard from './components/dashboard/Dashboard';
import BubblerDashboard from './components/dashboard/BubblerDashboard';
import Jobs from './components/jobs/Jobs';
import QRScanner from './components/jobs/QRScanner';
import Equipment from './components/equipment/Equipment';
import Profile from './components/dashboard/Profile';
import Earnings from './components/dashboard/Earnings';
import AdminNotes from './components/admin/AdminNotes';
import Ratings from './components/admin/Ratings';
import Analytics from './components/admin/Analytics';
import Applicants from './components/admin/Applicants';
import Orders from './components/orders/Orders';
import Bubblers from './components/bubblers/Bubblers';
import Onboarding from './components/auth/Onboarding';
import Messages from './components/messages/Messages';
import ActivityFeed from './components/activity/ActivityFeed';
import AdvancedAnalytics from './components/analytics/AdvancedAnalytics';
import PerformanceMonitor from './components/analytics/PerformanceMonitor';
import AutomatedReporting from './components/analytics/AutomatedReporting';
import BusinessIntelligence from './components/analytics/BusinessIntelligence';
import AutomatedWorkflows from './components/analytics/AutomatedWorkflows';
import CustomerAnalytics from './components/analytics/CustomerAnalytics';
import EliteBubblerManagement from './components/admin/EliteBubblerManagement';
import BubblerMorale from './components/admin/BubblerMorale';
import JobAssignmentCaps from './components/admin/JobAssignmentCaps';
import UserManagement from './components/admin/UserManagement';
import SupportDashboard from './components/dashboard/SupportDashboard';
import FinanceDashboard from './components/dashboard/FinanceDashboard';
import RecruiterDashboard from './components/dashboard/RecruiterDashboard';
import MarketManagerDashboard from './components/dashboard/MarketManagerDashboard';
import LeadBubblerDashboard from './components/dashboard/LeadBubblerDashboard';

import { useAuth } from './store/AuthContext';
import { SpeedInsights } from "@vercel/speed-insights/react";

// Protected Route wrapper
const ProtectedRoute = ({ children, requireAdmin = false, requireBubbler = false, requireSupport = false, requireMarketManager = false, requireLeadBubbler = false }) => {
  const { user, loading, isAuthenticated, isAdmin, isBubbler, isSupport, isMarketManager, isLeadBubbler } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check specific role requirements
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireBubbler && !isBubbler) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSupport && !isSupport) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireMarketManager && !isMarketManager) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireLeadBubbler && !isLeadBubbler) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireAdmin: PropTypes.bool,
  requireBubbler: PropTypes.bool,
  requireSupport: PropTypes.bool,
  requireMarketManager: PropTypes.bool,
  requireLeadBubbler: PropTypes.bool,
};

function App() {
  return (
    <Router>
      <SpeedInsights />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/onboarding/:bubblerId" 
          element={<Onboarding />}
        />

        {/* All authenticated routes share the same layout */}
        <Route 
          path="*" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Routes inside the layout */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Bubbler-specific routes */}
          <Route 
            path="jobs" 
            element={
              <ProtectedRoute requireBubbler>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route 
            path="equipment" 
            element={
              <ProtectedRoute requireBubbler>
                <Equipment />
              </ProtectedRoute>
            }
          />
          <Route 
            path="profile" 
            element={
              <ProtectedRoute requireBubbler>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route 
            path="earnings" 
            element={
              <ProtectedRoute requireBubbler>
                <Earnings />
              </ProtectedRoute>
            }
          />
          <Route 
            path="qr-scanner" 
            element={
              <ProtectedRoute requireBubbler>
                <QRScanner />
              </ProtectedRoute>
            }
          />

          {/* Admin-specific routes */}
          <Route 
            path="admin/jobs"
            element={
              <ProtectedRoute requireAdmin>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route 
            path="admin/equipment"
            element={
              <ProtectedRoute requireAdmin>
                <Equipment />
              </ProtectedRoute>
            }
          />
          <Route 
            path="admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="orders"
            element={
              <ProtectedRoute requireAdmin>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route 
            path="bubblers"
            element={
              <ProtectedRoute requireAdmin>
                <Bubblers />
              </ProtectedRoute>
            }
          />
          <Route 
            path="admin-notes"
            element={
              <ProtectedRoute requireAdmin>
                <AdminNotes />
              </ProtectedRoute>
            }
          />
          <Route 
            path="ratings"
            element={
              <ProtectedRoute requireAdmin>
                <Ratings />
              </ProtectedRoute>
            }
          />
          <Route 
            path="analytics"
            element={
              <ProtectedRoute requireAdmin>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route 
            path="applicants"
            element={
              <ProtectedRoute requireAdmin>
                <Applicants />
              </ProtectedRoute>
            }
          />
          <Route 
            path="messages"
            element={
              <ProtectedRoute requireAdmin>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route 
            path="activity"
            element={
              <ProtectedRoute requireAdmin>
                <ActivityFeed />
              </ProtectedRoute>
            }
          />
          <Route 
            path="advanced-analytics"
            element={
              <ProtectedRoute requireAdmin>
                <AdvancedAnalytics />
              </ProtectedRoute>
            }
          />
          <Route 
            path="performance"
            element={
              <ProtectedRoute requireAdmin>
                <PerformanceMonitor />
              </ProtectedRoute>
            }
          />
          <Route 
            path="automated-reporting"
            element={
              <ProtectedRoute requireAdmin>
                <AutomatedReporting />
              </ProtectedRoute>
            }
          />
          <Route 
            path="business-intelligence"
            element={
              <ProtectedRoute requireAdmin>
                <BusinessIntelligence />
              </ProtectedRoute>
            }
          />
          <Route 
            path="automated-workflows"
            element={
              <ProtectedRoute requireAdmin>
                <AutomatedWorkflows />
              </ProtectedRoute>
            }
          />
          <Route 
            path="customer-analytics"
            element={
              <ProtectedRoute requireAdmin>
                <CustomerAnalytics />
              </ProtectedRoute>
            }
          />
          <Route 
            path="elite-bubbler-management"
            element={
              <ProtectedRoute requireAdmin>
                <EliteBubblerManagement />
              </ProtectedRoute>
            }
          />
          <Route 
            path="bubbler-morale"
            element={
              <ProtectedRoute requireAdmin>
                <BubblerMorale />
              </ProtectedRoute>
            }
          />
          <Route 
            path="job-assignment-caps"
            element={
              <ProtectedRoute requireAdmin>
                <JobAssignmentCaps />
              </ProtectedRoute>
            }
          />
          <Route 
            path="user-management"
            element={
              <ProtectedRoute requireAdmin>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Support-specific routes */}
          <Route 
            path="support/jobs"
            element={
              <ProtectedRoute requireSupport>
                <Jobs />
              </ProtectedRoute>
            }
          />

          {/* Market Manager-specific routes */}
          <Route 
            path="market/jobs"
            element={
              <ProtectedRoute requireMarketManager>
                <Jobs />
              </ProtectedRoute>
            }
          />

          {/* Lead Bubbler-specific routes */}
          <Route 
            path="lead/jobs"
            element={
              <ProtectedRoute requireLeadBubbler>
                <Jobs />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;