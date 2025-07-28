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
import SupportDashboard from './SupportDashboard';
import FinanceDashboard from './FinanceDashboard';
import RecruiterDashboard from './RecruiterDashboard';
import MarketManagerDashboard from './MarketManagerDashboard';
import LeadBubblerDashboard from './LeadBubblerDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isBubbler, isSupport, isFinance, isRecruiter, isMarketManager, isLeadBubbler } = useAuth();
  const location = useLocation();
  const { fetchDashboardData, dashboardData, loading, error } = useStore();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Debug logging
  console.log('Dashboard render - user:', user, 'isAdmin:', isAdmin, 'isBubbler:', isBubbler, 'isSupport:', isSupport);

  // Role-based dashboard rendering
  if (isSupport) {
    return <SupportDashboard />;
  }

  if (isFinance) {
    return <FinanceDashboard />;
  }

  if (isRecruiter) {
    return <RecruiterDashboard />;
  }

  if (isMarketManager) {
    return <MarketManagerDashboard />;
  }

  if (isLeadBubbler) {
    return <LeadBubblerDashboard />;
  }

  // For bubblers, show a simplified dashboard
  if (isBubbler && !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.email}</h1>
          <p className="text-gray-600">Your command center for daily operations</p>
        </div>

        {/* Bubbler-specific stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Today's Jobs" 
            value={dashboardData?.bubblerStats?.todayJobs || 0} 
            icon={FiCalendar} 
            color="blue" 
          />
          <StatCard 
            title="Completed Today" 
            value={dashboardData?.bubblerStats?.completedToday || 0} 
            icon={FiCheckCircle} 
            color="green" 
          />
          <StatCard 
            title="Equipment Available" 
            value={dashboardData?.bubblerStats?.availableEquipment || 0} 
            icon={FiBriefcase} 
            color="purple" 
          />
          <StatCard 
            title="This Week's Earnings" 
            value={dashboardData?.bubblerStats?.weeklyEarnings || 0} 
            icon={FiDollarSign} 
            color="yellow" 
            format="currency" 
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard 
            title="View Today's Jobs"
            description="Check your assigned jobs for today"
            icon={FiCalendar}
            color="blue"
            onClick={() => navigate('/jobs')}
          />
          <QuickActionCard 
            title="Equipment Status"
            description="Check your equipment availability"
            icon={FiBriefcase}
            color="purple"
            onClick={() => navigate('/equipment')}
          />
          <QuickActionCard 
            title="View Earnings"
            description="Check your earnings and payouts"
            icon={FiDollarSign}
            color="yellow"
            onClick={() => navigate('/earnings')}
          />
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-600">Your latest job activities</p>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData?.bubblerStats?.recentActivity?.map(item => (
              <RecentActivityItem key={item.id} item={item} />
            )) || (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard with full data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading dashboard data: {error}</p>
        <button 
          onClick={() => fetchDashboardData()} 
          className="bg-brand-aqua text-white px-4 py-2 rounded hover:bg-brand-aqua-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Complete overview of GoGoBubbles operations</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Revenue" 
          value={dashboardData?.stats?.totalRevenue || 0} 
          icon={FiDollarSign} 
          color="green" 
          format="currency" 
        />
        <StatCard 
          title="Active Bubblers" 
          value={dashboardData?.stats?.activeBubblers || 0} 
          icon={FiUsers} 
          color="blue" 
        />
        <StatCard 
          title="Pending Applications" 
          value={dashboardData?.stats?.pendingApplications || 0} 
          icon={FiFileText} 
          color="yellow" 
        />
        <StatCard 
          title="Today's Jobs" 
          value={dashboardData?.stats?.todayJobs || 0} 
          icon={FiCalendar} 
          color="purple" 
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <QuickActionCard 
          title="Manage Orders"
          description="View and manage customer orders"
          icon={FiFileText}
          color="blue"
          onClick={() => navigate('/orders')}
        />
        <QuickActionCard 
          title="Review Applications"
          description="Review new bubbler applications"
          icon={FiUsers}
          color="green"
          onClick={() => navigate('/applicants')}
        />
        <QuickActionCard 
          title="View Analytics"
          description="Access detailed business analytics"
          icon={FiBarChart2}
          color="purple"
          onClick={() => navigate('/analytics')}
        />
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-600">Latest actions from your team</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.recentActivity?.map(item => (
            <RecentActivityItem key={item.id} item={item} />
          )) || (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Recent jobs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
          <p className="text-sm text-gray-600">Latest job assignments and completions</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.recentJobs?.map(item => (
            <RecentListItem key={item.id} item={item} type="jobs" />
          )) || (
            <p className="text-gray-500 text-center py-4">No recent jobs</p>
          )}
        </div>
      </div>

      {/* Recent applicants */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Applicants</h3>
          <p className="text-sm text-gray-600">New applications and their status</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.recentApplicants?.map(item => (
            <RecentListItem key={item.id} item={item} type="applicants" />
          )) || (
            <p className="text-gray-500 text-center py-4">No recent applicants</p>
          )}
        </div>
      </div>

      {/* Equipment status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Equipment Status</h3>
          <p className="text-sm text-gray-600">Overview of equipment availability</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.equipmentStatus?.map(item => (
            <RecentListItem key={item.id} item={item} type="equipment" />
          )) || (
            <p className="text-gray-500 text-center py-4">No equipment data</p>
          )}
        </div>
      </div>

      {/* Recent messages */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
          <p className="text-sm text-gray-600">Latest communications</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.recentMessages?.map(item => (
            <RecentListItem key={item.id} item={item} type="messages" />
          )) || (
            <p className="text-gray-500 text-center py-4">No recent messages</p>
          )}
        </div>
      </div>

      {/* Recent ratings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Ratings</h3>
          <p className="text-sm text-gray-600">Latest customer feedback</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.recentRatings?.map(item => (
            <RecentListItem key={item.id} item={item} type="ratings" />
          )) || (
            <p className="text-gray-500 text-center py-4">No recent ratings</p>
          )}
        </div>
      </div>

      {/* Revenue trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <p className="text-sm text-gray-600">Monthly revenue and payout trends</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.revenueTrends?.map(item => (
            <RecentListItem key={item.id} item={item} type="revenue" />
          )) || (
            <p className="text-gray-500 text-center py-4">No revenue data</p>
          )}
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
          <p className="text-sm text-gray-600">Recent bubbler payouts</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.recentPayouts?.map(item => (
            <RecentListItem key={item.id} item={item} type="payouts" />
          )) || (
            <p className="text-gray-500 text-center py-4">No payout data</p>
          )}
        </div>
      </div>

      {/* Customer segments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
          <p className="text-sm text-gray-600">Breakdown of customer types</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.customerSegments?.map(item => (
            <RecentListItem key={item.id} item={item} type="customers" />
          )) || (
            <p className="text-gray-500 text-center py-4">No customer data</p>
          )}
        </div>
      </div>

      {/* Business insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Business Insights</h3>
          <p className="text-sm text-gray-600">Key business metrics and recommendations</p>
        </div>
        <div className="p-6 space-y-4">
          {dashboardData?.businessInsights?.map(item => (
            <RecentListItem key={item.id} item={item} type="insights" />
          )) || (
            <p className="text-gray-500 text-center py-4">No insights data</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color = 'blue', format = 'number' }) => {
  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
    return val;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 flex items-center justify-between border border-${color}-200`}>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-1 text-3xl font-bold text-${color}-800`}>{formatValue(value)}</p>
      </div>
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, description, icon: Icon, color = 'blue', onClick }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 flex flex-col items-center text-center border border-${color}-200 cursor-pointer hover:shadow-md transition-shadow`} onClick={onClick}>
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600 mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button className={`bg-${color}-600 text-white px-4 py-2 rounded-lg hover:bg-${color}-700 transition-colors`}>
        View
      </button>
    </div>
  );
};

const RecentActivityItem = ({ item }) => (
  <div className="flex items-start space-x-3">
    <div className="w-2 h-2 bg-brand-aqua rounded-full mt-2 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800">{item.action}</p>
      <p className="text-sm text-gray-500">{item.timestamp}</p>
    </div>
  </div>
);

const RecentListItem = ({ item, type }) => (
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-medium text-gray-900">
        {type === 'jobs' ? item.customer : type === 'applicants' ? item.name : item.name}
      </h4>
      <p className="text-sm text-gray-500">
        {type === 'jobs' ? item.service : type === 'applicants' ? item.email : item.description}
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">{item.timestamp}</span>
      {type === 'jobs' && <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span>}
      {type === 'applicants' && <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'approved' ? 'bg-green-100 text-green-800' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span>}
      {type === 'equipment' && <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'available' ? 'bg-green-100 text-green-800' : item.status === 'in_use' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span>}
      {type === 'messages' && item.unread && <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">New</span>}
    </div>
  </div>
);

export default Dashboard;