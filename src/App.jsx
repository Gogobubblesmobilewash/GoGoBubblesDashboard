import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Login from './components/auth/Login';
import Layout from './components/shared/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Jobs from './components/jobs/Jobs';
import QRScanner from './components/jobs/QRScanner';
import Equipment from './components/equipment/Equipment';
import Profile from './components/dashboard/Profile';
import Earnings from './components/dashboard/Earnings';
import AdminNotes from './components/admin/AdminNotes';
import Ratings from './components/admin/Ratings';
import Analytics from './components/admin/Analytics';
import Orders from './components/orders/Orders';
import Bubblers from './components/bubblers/Bubblers';

// Protected Route wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};

function App() {
  const { isAuthenticated } = useStore();

  return (
    <Router>
      <Routes>
        {/* Public Login */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
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
          <Route path="jobs" element={<Jobs />} />
          <Route path="qr-scanner" element={<QRScanner />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="profile" element={<Profile />} />
          <Route path="earnings" element={<Earnings />} />

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

        {/* Fallback for undefined paths */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;