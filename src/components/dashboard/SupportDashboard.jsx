import React, { useEffect, useState } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiBriefcase,
  FiStar,
  FiAlertCircle,
  FiArrowRight,
  FiList,
  FiUser,
  FiMessageCircle,
  FiPackage,
  FiShield,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiEye,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const { loading, setLoading } = useStore();
  const { user, isSupport } = useAuth();
  
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    activeBubblers: 0,
    newApplicants: 0,
    pendingApplicants: 0,
    overdueRentals: 0,
    lowRatings: 0,
    unreadMessages: 0,
    recentActivity: []
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  const loadSupportData = async () => {
    setLoading(true);
    try {
      // Fetch orders (non-financial data only)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_name, service_type, status, created_at, scheduled_date')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (ordersError) console.warn('Orders fetch warning:', ordersError);
      const ordersArray = Array.isArray(orders) ? orders : [];
      setRecentOrders(ordersArray);

      // Fetch applicants
      const { data: applicants, error: applicantsError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (applicantsError) console.warn('Applicants fetch warning:', applicantsError);
      const applicantsArray = Array.isArray(applicants) ? applicants : [];
      setRecentApplicants(applicantsArray);

      // Fetch bubblers
      const { data: bubblers, error: bubblersError } = await supabase
        .from('bubblers')
        .select('id, first_name, last_name, email, role, is_active')
        .eq('is_active', true);
      
      if (bubblersError) console.warn('Bubblers fetch warning:', bubblersError);
      const bubblersArray = Array.isArray(bubblers) ? bubblers : [];

      // Fetch equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*');
      
      if (equipmentError) console.warn('Equipment fetch warning:', equipmentError);
      const equipmentArray = Array.isArray(equipment) ? equipment : [];

      // Calculate stats (excluding financial data)
      const totalOrders = ordersArray.length;
      const pendingOrders = ordersArray.filter(o => o.status === 'pending' || o.status === 'assigned').length;
      const completedOrders = ordersArray.filter(o => o.status === 'completed').length;
      const activeBubblers = bubblersArray.length;
      const newApplicants = applicantsArray.filter(a => a.application_status === 'new').length;
      const pendingApplicants = applicantsArray.filter(a => a.application_status === 'pending').length;
      const overdueRentals = equipmentArray.filter(e => e.status === 'overdue').length;
      const lowRatings = 0; // Would need ratings table
      const unreadMessages = 0; // Would need messages table

      setDashboardData({
        totalOrders,
        pendingOrders,
        completedOrders,
        activeBubblers,
        newApplicants,
        pendingApplicants,
        overdueRentals,
        lowRatings,
        unreadMessages,
        recentActivity: []
      });

    } catch (error) {
      console.error('Error loading support data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSupport) {
      loadSupportData();
    }
  }, [isSupport]);

  const StatCard = ({ title, value, icon: Icon, color = 'blue', onClick }) => (
    <div 
      className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon: Icon, onClick, color = 'blue' }) => (
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

  const RecentItem = ({ title, subtitle, status, icon: Icon, onClick }) => (
    <div 
      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-gray-400" />
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
      <span className={`px-2 py-1 text-xs rounded-full ${
        status === 'completed' ? 'bg-green-100 text-green-800' :
        status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        status === 'new' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-sm text-gray-600">
            Customer service overview - Financial data restricted
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadSupportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={dashboardData.totalOrders}
          icon={FiPackage}
          color="blue"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Pending Orders"
          value={dashboardData.pendingOrders}
          icon={FiClock}
          color="yellow"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Active Bubblers"
          value={dashboardData.activeBubblers}
          icon={FiUsers}
          color="green"
          onClick={() => navigate('/bubblers')}
        />
        <StatCard
          title="New Applicants"
          value={dashboardData.newApplicants}
          icon={FiUser}
          color="purple"
          onClick={() => navigate('/applicants')}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="View Orders"
          description="Check order status and details"
          icon={FiList}
          color="blue"
          onClick={() => navigate('/orders')}
        />
        <QuickAction
          title="Manage Bubblers"
          description="View and manage bubbler accounts"
          icon={FiUsers}
          color="green"
          onClick={() => navigate('/bubblers')}
        />
        <QuickAction
          title="Review Applications"
          description="Process new bubbler applications"
          icon={FiUser}
          color="purple"
          onClick={() => navigate('/applicants')}
        />
        <QuickAction
          title="Equipment Status"
          description="Check equipment availability"
          icon={FiBriefcase}
          color="orange"
          onClick={() => navigate('/equipment')}
        />
        <QuickAction
          title="Customer Messages"
          description="View and respond to messages"
          icon={FiMessageCircle}
          color="indigo"
          onClick={() => navigate('/messages')}
        />
        <QuickAction
          title="View Ratings"
          description="Check customer ratings and feedback"
          icon={FiStar}
          color="yellow"
          onClick={() => navigate('/ratings')}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <RecentItem
                  key={order.id}
                  title={order.customer_name}
                  subtitle={`${order.service_type} - ${new Date(order.created_at).toLocaleDateString()}`}
                  status={order.status}
                  icon={FiPackage}
                  onClick={() => navigate(`/orders/${order.id}`)}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>

        {/* Recent Applicants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applicants</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentApplicants.length > 0 ? (
              recentApplicants.map((applicant) => (
                <RecentItem
                  key={applicant.id}
                  title={`${applicant.first_name} ${applicant.last_name}`}
                  subtitle={`${applicant.role_applied_for} - ${new Date(applicant.created_at).toLocaleDateString()}`}
                  status={applicant.application_status}
                  icon={FiUser}
                  onClick={() => navigate(`/applicants/${applicant.id}`)}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent applicants</p>
            )}
          </div>
        </div>
      </div>

      {/* Financial Data Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiShield className="h-5 w-5 text-yellow-600" />
          <div>
            <h4 className="font-medium text-yellow-800">Financial Data Restricted</h4>
            <p className="text-sm text-yellow-700">
              Support representatives cannot view financial information including revenue, deposits, payouts, and payment details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard; 