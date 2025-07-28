import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Layout from './components/shared/Layout';
import Dashboard from './components/dashboard/Dashboard';
import { useAuth } from './store/AuthContext';

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
const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

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

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
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
            
            {/* Simple fallback routes */}
            <Route path="jobs" element={<div className="p-6"><h1>Jobs Page</h1><p>Coming soon...</p></div>} />
            <Route path="equipment" element={<div className="p-6"><h1>Equipment Page</h1><p>Coming soon...</p></div>} />
            <Route path="profile" element={<div className="p-6"><h1>Profile Page</h1><p>Coming soon...</p></div>} />
            <Route path="earnings" element={<div className="p-6"><h1>Earnings Page</h1><p>Coming soon...</p></div>} />
            <Route path="orders" element={<div className="p-6"><h1>Orders Page</h1><p>Coming soon...</p></div>} />
            <Route path="bubblers" element={<div className="p-6"><h1>Bubblers Page</h1><p>Coming soon...</p></div>} />
            <Route path="applicants" element={<div className="p-6"><h1>Applicants Page</h1><p>Coming soon...</p></div>} />
            <Route path="messages" element={<div className="p-6"><h1>Messages Page</h1><p>Coming soon...</p></div>} />
            <Route path="analytics" element={<div className="p-6"><h1>Analytics Page</h1><p>Coming soon...</p></div>} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;