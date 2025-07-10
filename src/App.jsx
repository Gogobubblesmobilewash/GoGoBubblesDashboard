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

import { useAuth } from './store/AuthContext';
import { SpeedInsights } from "@vercel/speed-insights/react";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">The application encountered an error. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route wrapper
const ProtectedRoute = ({ children, requireAdmin = false, requireBubbler = false }) => {
  const { isAuthenticated, isAdmin, isBubbler, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (requireBubbler && !isBubbler) return <Navigate to="/dashboard" replace />;

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireAdmin: PropTypes.bool,
  requireBubbler: PropTypes.bool
};

ProtectedRoute.defaultProps = {
  requireAdmin: false,
  requireBubbler: false
};

function App() {
  const { isAuthenticated, loading, user } = useAuth();

  // Debug logging
  console.log('App render - isAuthenticated:', isAuthenticated, 'loading:', loading, 'user:', user);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={<Navigate to="/login" replace />}
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />

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
          </Route>
        </Routes>
      </Router>
      <SpeedInsights />
    </ErrorBoundary>
  );
}

export default App;