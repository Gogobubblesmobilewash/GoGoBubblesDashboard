import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome, 
  FiDollarSign,
  FiUsers,
  FiCalendar, 
  FiTrendingUp, 
  FiDownload, 
  FiRefreshCw,
  FiBarChart2,
  FiFileText,
  FiMessageCircle,
  FiStar,
  FiBriefcase,
  FiAlertCircle,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { useAuth } from '../../store/AuthContext';
import { 
  calculateJobDuration, 
  calculatePropertyTypeAdjustedDuration,
  getPropertyTypeSpecificDuration,
  PROPERTY_TYPE_DURATION_ADJUSTMENTS 
} from '../../constants';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isBubbler, isSupport, isFinance, isRecruiter, isMarketManager, isLeadBubbler } = useAuth();
  const location = useLocation();
  const { fetchDashboardData, dashboardData, loading, error } = useStore();

  // Comprehensive debugging
  console.log('Dashboard component mounted');
  console.log('Dashboard - user:', user?.email);
  console.log('Dashboard - roles:', { isAdmin, isBubbler, isSupport, isFinance, isRecruiter, isMarketManager, isLeadBubbler });
  console.log('Dashboard - loading:', loading, 'error:', error);
  console.log('Dashboard - dashboardData:', dashboardData);

  // Utility function to calculate job duration with property type adjustments
  const calculateJobDurationWithPropertyType = (serviceData) => {
    if (!serviceData) return { totalDuration: 0 };
    
    const { service, tier, bedrooms, bathrooms, propertyType, addons = [] } = serviceData;
    
    if (service === 'Home Cleaning') {
      // Use property type specific duration if available
      const specificDuration = getPropertyTypeSpecificDuration(bedrooms, bathrooms, tier, propertyType);
      if (specificDuration) {
        return { totalDuration: specificDuration };
      }
      
      // Fallback to calculated duration with property type adjustment
      return calculateJobDuration(service, tier, addons, {
        bedrooms,
        bathrooms,
        propertyType: propertyType || 'Apartment/Loft'
      });
    }
    
    // For other services, use standard calculation
    return calculateJobDuration(service, tier, addons);
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Debug logging
  console.log('Dashboard render - user:', user, 'isAdmin:', isAdmin, 'isBubbler:', isBubbler, 'isSupport:', isSupport);

  console.log('Dashboard render - loading:', loading, 'error:', error);

  // Role-based dashboard rendering using switch statement
  const renderDashboard = () => {
    // Determine the user's role
    let role = 'bubbler'; // default
    
    if (isAdmin) role = 'admin_bubbler';
    else if (isSupport) role = 'support_bubbler';
    else if (isLeadBubbler) role = 'lead_bubbler';
    else if (isFinance) role = 'finance_bubbler';
    else if (isRecruiter) role = 'recruiter_bubbler';
    else if (isMarketManager) role = 'market_manager_bubbler';
    
    console.log('Dashboard render - determined role:', role);

    // For now, just render the basic bubbler view to isolate the issue
    console.log('Dashboard render - rendering basic bubbler view');
    return renderBubblerView();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4 font-inter">Error loading dashboard data: {error}</p>
        <button
          onClick={() => fetchDashboardData()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  // Debug: Show user info even if dashboard data fails
  console.log('Dashboard render - about to render dashboard, user:', user?.email);
  
  // Always render something, even if data fails
  try {
    console.log('Dashboard - about to render dashboard');
    return renderDashboard();
  } catch (error) {
    console.error('Dashboard - error rendering dashboard:', error);
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Dashboard Error</h1>
          <p className="text-red-700 mb-4">There was an error rendering the dashboard.</p>
          <p className="text-sm text-red-600">User: {user?.email || 'Unknown'}</p>
          <p className="text-sm text-red-600">Error: {error?.message || error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  function renderAdminView() {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">Admin Dashboard</h1>
          <p className="text-gray-600 font-inter">Complete overview of GoGoBubbles operations</p>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Revenue" 
            value={dashboardData?.stats?.totalRevenue || 0} 
            icon={FiDollarSign} 
            color="brand-aqua" 
            format="currency" 
          />
          <StatCard 
            title="Active Bubblers" 
            value={dashboardData?.stats?.activeBubblers || 0} 
            icon={FiUsers} 
            color="brand-blue" 
          />
          <StatCard 
            title="Pending Applications" 
            value={dashboardData?.stats?.pendingApplications || 0} 
            icon={FiFileText} 
            color="brand-yellow" 
          />
          <StatCard 
            title="Today's Jobs" 
            value={dashboardData?.stats?.todayJobs || 0} 
            icon={FiCalendar} 
            color="brand-aqua" 
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard 
            title="Manage Orders"
            description="View and manage customer orders"
            icon={FiFileText}
            color="brand-aqua"
            onClick={() => navigate('/orders')}
          />
          <QuickActionCard 
            title="Review Applications"
            description="Review new bubbler applications"
            icon={FiUsers}
            color="brand-blue"
            onClick={() => navigate('/applicants')}
          />
          <QuickActionCard 
            title="View Analytics"
            description="Access detailed business analytics"
            icon={FiBarChart2}
            color="brand-yellow"
            onClick={() => navigate('/analytics')}
          />
        </div>

        {/* Recent activity */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Recent Activity</h3>
            <p className="text-sm text-gray-600 font-inter">Latest actions from your team</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.recentActivity?.map(item => (
              <RecentActivityItem key={item.id} item={item} />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No recent activity</p>
            )}
          </div>
        </div>

        {/* Recent jobs */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Recent Jobs</h3>
            <p className="text-sm text-gray-600 font-inter">Latest job assignments and completions</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.recentJobs?.map(item => (
              <RecentListItem key={item.id} item={item} type="jobs" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No recent jobs</p>
            )}
          </div>
        </div>

        {/* Recent applicants */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Recent Applicants</h3>
            <p className="text-sm text-gray-600 font-inter">New applications and their status</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.recentApplicants?.map(item => (
              <RecentListItem key={item.id} item={item} type="applicants" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No recent applicants</p>
            )}
          </div>
        </div>

        {/* Equipment status */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Equipment Status</h3>
            <p className="text-sm text-gray-600 font-inter">Overview of equipment availability</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.equipmentStatus?.map(item => (
              <RecentListItem key={item.id} item={item} type="equipment" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No equipment data</p>
            )}
          </div>
        </div>

        {/* Recent messages */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Recent Messages</h3>
            <p className="text-sm text-gray-600 font-inter">Latest communications</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.recentMessages?.map(item => (
              <RecentListItem key={item.id} item={item} type="messages" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No recent messages</p>
            )}
          </div>
        </div>

        {/* Recent ratings */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Recent Ratings</h3>
            <p className="text-sm text-gray-600 font-inter">Latest customer feedback</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.recentRatings?.map(item => (
              <RecentListItem key={item.id} item={item} type="ratings" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No recent ratings</p>
            )}
          </div>
        </div>

        {/* Revenue trends */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Revenue Trends</h3>
            <p className="text-sm text-gray-600 font-inter">Monthly revenue and payout trends</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.revenueTrends?.map(item => (
              <RecentListItem key={item.id} item={item} type="revenue" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No revenue data</p>
            )}
          </div>
        </div>

        {/* Payout history */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Payout History</h3>
            <p className="text-sm text-gray-600 font-inter">Recent bubbler payouts</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.recentPayouts?.map(item => (
              <RecentListItem key={item.id} item={item} type="payouts" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No payout data</p>
            )}
          </div>
        </div>

        {/* Customer segments */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Customer Segments</h3>
            <p className="text-sm text-gray-600 font-inter">Breakdown of customer types</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.customerSegments?.map(item => (
              <RecentListItem key={item.id} item={item} type="customers" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No customer data</p>
            )}
          </div>
        </div>

        {/* Business insights */}
        <div className="card mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Business Insights</h3>
            <p className="text-sm text-gray-600 font-inter">Key business metrics and recommendations</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.businessInsights?.map(item => (
              <RecentListItem key={item.id} item={item} type="insights" />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No insights data</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Bubbler Dashboard View
  function renderBubblerView() {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">Welcome back, {user?.email}</h1>
          <p className="text-gray-600 font-inter">Your command center for daily operations</p>
        </div>

        {/* Bubbler-specific stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Today's Jobs" 
            value={dashboardData?.bubblerStats?.todayJobs || 0} 
            icon={FiCalendar} 
            color="brand-aqua" 
          />
          <StatCard 
            title="Completed Today" 
            value={dashboardData?.bubblerStats?.completedToday || 0} 
            icon={FiCheckCircle} 
            color="brand-blue" 
          />
          <StatCard 
            title="Equipment Available" 
            value={dashboardData?.bubblerStats?.availableEquipment || 0} 
            icon={FiBriefcase} 
            color="brand-yellow" 
          />
          <StatCard 
            title="This Week's Earnings" 
            value={dashboardData?.bubblerStats?.weeklyEarnings || 0} 
            icon={FiDollarSign} 
            color="brand-aqua" 
            format="currency" 
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard 
            title="View Today's Jobs"
            description="Check your assigned jobs for today"
            icon={FiCalendar}
            color="brand-aqua"
            onClick={() => navigate('/jobs')}
          />
          <QuickActionCard 
            title="Equipment Status"
            description="Check your equipment availability"
            icon={FiBriefcase}
            color="brand-blue"
            onClick={() => navigate('/equipment')}
          />
          <QuickActionCard 
            title="View Earnings"
            description="Check your earnings and payouts"
            icon={FiDollarSign}
            color="brand-yellow"
            onClick={() => navigate('/earnings')}
          />
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 font-poppins">Recent Activity</h3>
            <p className="text-sm text-gray-600 font-inter">Your latest job activities</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.bubblerStats?.recentActivity?.map(item => (
              <RecentActivityItem key={item.id} item={item} />
            )) || (
              <p className="text-gray-500 text-center py-4 font-inter">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    );
  }
};

const StatCard = ({ title, value, icon: Icon, color = 'brand-aqua', format = 'number' }) => {
  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
    return val;
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'brand-aqua':
        return {
          bg: 'bg-brand-aqua',
          text: 'text-brand-aqua',
          bgLight: 'bg-aqua-100',
          textDark: 'text-aqua-800'
        };
      case 'brand-blue':
        return {
          bg: 'bg-brand-blue',
          text: 'text-brand-blue',
          bgLight: 'bg-blue-100',
          textDark: 'text-blue-800'
        };
      case 'brand-yellow':
        return {
          bg: 'bg-brand-yellow',
          text: 'text-brand-yellow',
          bgLight: 'bg-yellow-100',
          textDark: 'text-yellow-800'
        };
      default:
        return {
          bg: 'bg-brand-aqua',
          text: 'text-brand-aqua',
          bgLight: 'bg-aqua-100',
          textDark: 'text-aqua-800'
        };
    }
  };

  const colors = getColorClasses(color);

  return (
    <div className={`card-hover border-l-4 ${colors.bg} border-l-${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 font-inter">{title}</h3>
          <p className={`mt-1 text-3xl font-bold ${colors.textDark} font-poppins`}>{formatValue(value)}</p>
        </div>
        <div className={`p-3 rounded-full ${colors.bgLight} ${colors.text}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, description, icon: Icon, color = 'brand-aqua', onClick }) => {
  const getColorClasses = (color) => {
    switch (color) {
      case 'brand-aqua':
        return {
          bg: 'bg-brand-aqua',
          hover: 'hover:bg-brand-aqua-light',
          text: 'text-brand-aqua',
          bgLight: 'bg-aqua-100'
        };
      case 'brand-blue':
        return {
          bg: 'bg-brand-blue',
          hover: 'hover:bg-brand-blue-dark',
          text: 'text-brand-blue',
          bgLight: 'bg-blue-100'
        };
      case 'brand-yellow':
        return {
          bg: 'bg-brand-yellow',
          hover: 'hover:bg-yellow-500',
          text: 'text-brand-yellow',
          bgLight: 'bg-yellow-100'
        };
      default:
        return {
          bg: 'bg-brand-aqua',
          hover: 'hover:bg-brand-aqua-light',
          text: 'text-brand-aqua',
          bgLight: 'bg-aqua-100'
        };
    }
  };

  const colors = getColorClasses(color);

  return (
    <div className={`card-hover cursor-pointer`} onClick={onClick}>
      <div className="flex flex-col items-center text-center">
        <div className={`p-3 rounded-full ${colors.bgLight} ${colors.text} mb-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 font-poppins">{title}</h3>
        <p className="text-sm text-gray-600 mb-4 font-inter">{description}</p>
        <button className={`${colors.bg} text-white px-4 py-2 rounded-lg hover:${colors.hover} transition-colors font-poppins font-semibold`}>
          View
        </button>
      </div>
    </div>
  );
};

const RecentActivityItem = ({ item }) => (
  <div className="flex items-start space-x-3">
    <div className="w-2 h-2 bg-brand-aqua rounded-full mt-2 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800 font-inter">{item.action}</p>
      <p className="text-sm text-gray-500 font-inter">{item.timestamp}</p>
    </div>
  </div>
);

const RecentListItem = ({ item, type }) => (
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-medium text-gray-900 font-poppins">
        {type === 'jobs' ? item.customer : type === 'applicants' ? item.name : item.name}
      </h4>
      <p className="text-sm text-gray-500 font-inter">
        {type === 'jobs' ? item.service : type === 'applicants' ? item.email : item.description}
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 font-inter">{item.timestamp}</span>
      {type === 'jobs' && <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} font-inter`}>{item.status}</span>}
      {type === 'applicants' && <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'approved' ? 'bg-green-100 text-green-800' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} font-inter`}>{item.status}</span>}
      {type === 'equipment' && <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'available' ? 'bg-green-100 text-green-800' : item.status === 'in_use' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'} font-inter`}>{item.status}</span>}
      {type === 'messages' && item.unread && <span className="px-2 py-1 text-xs rounded-full bg-brand-aqua text-white font-inter">New</span>}
    </div>
  </div>
);

export default Dashboard;