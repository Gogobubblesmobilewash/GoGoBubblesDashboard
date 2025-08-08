import React, { useEffect, useState } from 'react';
import {
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiBriefcase,
  FiStar,
  FiMessageCircle,
  FiShield,
  FiAlertCircle,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiCheckCircle,
  FiUserPlus
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const MarketManagerDashboard = () => {
  const navigate = useNavigate();
  const { loading, setLoading } = useStore();
  const { user, isMarketManager } = useAuth();
  
  // Security check - ensure only market manager users can access this dashboard
  useEffect(() => {
    if (!isMarketManager) {
      console.warn('MarketManagerDashboard: Non-market manager user attempted to access market manager dashboard');
      navigate('/dashboard');
    }
  }, [isMarketManager, navigate]);
  
  const [marketData, setMarketData] = useState({
    localBookings: 0,
    localBubblers: 0,
    localRevenue: 0,
    localPayouts: 0,
    pendingIssues: 0,
    activeJobs: 0,
    completedJobs: 0,
    localApplicants: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [localBubblers, setLocalBubblers] = useState([]);
  const [pendingIssues, setPendingIssues] = useState([]);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      // Fetch local market data (limited to assigned territory)
      // Note: In real implementation, this would filter by assigned ZIP codes/cities
      
      // Mock local market data
      const mockMarketData = {
        localBookings: 45,
        localBubblers: 12,
        localRevenue: 8500,
        localPayouts: 6200,
        pendingIssues: 3,
        activeJobs: 8,
        completedJobs: 37,
        localApplicants: 5
      };

      setMarketData(mockMarketData);

      // Mock recent bookings for local market
      const mockBookings = [
        { id: 1, customer_name: 'Sarah Johnson', service_type: 'Home Cleaning', status: 'active', date: '2024-01-15', location: 'Houston, TX' },
        { id: 2, customer_name: 'Mike Chen', service_type: 'Car Wash', status: 'completed', date: '2024-01-14', location: 'Houston, TX' },
        { id: 3, customer_name: 'Lisa Rodriguez', service_type: 'Laundry', status: 'pending', date: '2024-01-13', location: 'Houston, TX' }
      ];
      setRecentBookings(mockBookings);

      // Mock local bubblers
      const mockBubblers = [
        { id: 1, name: 'John Smith', role: 'EliteBubbler', status: 'active', jobs_completed: 15 },
        { id: 2, name: 'Maria Garcia', role: 'ShineBubbler', status: 'active', jobs_completed: 8 },
        { id: 3, name: 'David Lee', role: 'FreshBubbler', status: 'active', jobs_completed: 12 }
      ];
      setLocalBubblers(mockBubblers);

      // Mock pending issues
      const mockIssues = [
        { id: 1, type: 'Customer Complaint', description: 'Service quality issue', status: 'pending', priority: 'high' },
        { id: 2, type: 'Equipment Issue', description: 'Vacuum cleaner malfunction', status: 'in_progress', priority: 'medium' },
        { id: 3, type: 'Scheduling Conflict', description: 'Bubbler unavailable', status: 'pending', priority: 'low' }
      ];
      setPendingIssues(mockIssues);

    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMarketManager) {
      loadMarketData();
    }
  }, [isMarketManager]);

  const StatCard = ({ title, value, icon: Icon, color = 'indigo', format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      }
      return val;
    };

    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    );
  };

  const QuickAction = ({ title, description, icon: Icon, onClick, color = 'indigo' }) => (
    <div 
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full bg-${color}-100`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  const BookingItem = ({ booking, onClick }) => (
    <div 
      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <FiCalendar className="h-5 w-5 text-gray-400" />
        <div>
          <h4 className="font-medium text-gray-900">{booking.customer_name}</h4>
          <p className="text-sm text-gray-600">{booking.service_type} • {booking.location}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{booking.date}</span>
        <span className={`px-2 py-1 text-xs rounded-full ${
          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
          booking.status === 'active' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {booking.status}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiShield className="h-5 w-5 text-indigo-600" />
          <div>
            <h4 className="font-medium text-indigo-800">Market Manager Access Level</h4>
            <p className="text-sm text-indigo-700">
              You have access to your assigned market territory only. Data is limited to your local region.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Manager Dashboard</h1>
          <p className="text-sm text-gray-600">
            Local market overview - Houston, TX Territory - Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadMarketData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Market Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Local Bookings"
          value={marketData.localBookings}
          icon={FiCalendar}
          color="indigo"
        />
        <StatCard
          title="Local Bubblers"
          value={marketData.localBubblers}
          icon={FiUsers}
          color="blue"
        />
        <StatCard
          title="Local Revenue"
          value={marketData.localRevenue}
          icon={FiDollarSign}
          color="green"
          format="currency"
        />
        <StatCard
          title="Local Payouts"
          value={marketData.localPayouts}
          icon={FiTrendingUp}
          color="purple"
          format="currency"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Active Jobs"
          value={marketData.activeJobs}
          icon={FiBriefcase}
          color="yellow"
        />
        <StatCard
          title="Completed Jobs"
          value={marketData.completedJobs}
          icon={FiCheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Issues"
          value={marketData.pendingIssues}
          icon={FiAlertCircle}
          color="red"
        />
        <StatCard
          title="Local Applicants"
          value={marketData.localApplicants}
          icon={FiUserPlus}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="Assign Jobs"
          description="Manage local job assignments"
          icon={FiBriefcase}
          color="indigo"
          onClick={() => navigate('/jobs')}
        />
        <QuickAction
          title="Manage Bubblers"
          description="View and manage local team"
          icon={FiUsers}
          color="blue"
          onClick={() => navigate('/bubblers')}
        />
        <QuickAction
          title="Resolve Issues"
          description="Handle local problems"
          icon={FiAlertCircle}
          color="red"
          onClick={() => alert('Opening issue resolution...')}
        />
        <QuickAction
          title="Onboard Team"
          description="Add new local bubblers"
          icon={FiUserPlus}
          color="green"
          onClick={() => navigate('/applicants')}
        />
        <QuickAction
          title="Local Reports"
          description="View market performance"
          icon={FiTrendingUp}
          color="purple"
          onClick={() => alert('Opening local reports...')}
        />
        <QuickAction
          title="Message Team"
          description="Contact local bubblers"
          icon={FiMessageCircle}
          color="indigo"
          onClick={() => navigate('/messages')}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Local Bookings</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking} onClick={() => alert(`Opening booking ${booking.id}...`)} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Local Bubblers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Local Bubblers</h3>
          </div>
          <div className="p-6 space-y-4">
            {localBubblers.length > 0 ? (
              localBubblers.map((bubbler) => (
                <div key={bubbler.id} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{bubbler.name}</h4>
                    <p className="text-sm text-gray-600">{bubbler.role} • {bubbler.jobs_completed} jobs</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    bubbler.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {bubbler.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No local bubblers</p>
            )}
          </div>
        </div>
      </div>

      {/* Access Restrictions Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiAlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <h4 className="font-medium text-yellow-800">Market Manager Access Restrictions</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Market managers have access to their assigned territory only and cannot view data from other markets.
            </p>
            <div className="text-xs text-yellow-700 space-y-1">
              <p><strong>❌ Restricted Access:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Other market territories</li>
                <li>Global admin data</li>
                <li>Company-wide financial reports</li>
                <li>Cross-market operations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketManagerDashboard; 