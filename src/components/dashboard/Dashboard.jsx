import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiBriefcase,
  FiStar,
  FiAlertCircle,
  FiArrowRight,
  FiPlus,
  FiList,
  FiCamera,
  FiUser,
  FiMessageCircle,
  FiPackage,
  FiShield,
  FiRefreshCw,
  FiFilter,
  FiDownload
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import BubblerDashboard from './BubblerDashboard';
import BreakdownModal from './BreakdownModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { setDailyJobs, loading, setLoading } = useStore();
  const { user, isAdmin, isBubbler } = useAuth();
  
  // Debug logging
  console.log('Dashboard: User role info:', { 
    user: user?.email, 
    isAdmin, 
    isBubbler, 
    userRole: user?.user_metadata?.role 
  });
  
  // Add new state for all business health metrics
  const [dashboardData, setDashboardData] = useState({
    revenueDeposits: 0,
    revenueCompleted: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    recentPayouts: [],
    newOrders: 0,
    pendingAssignments: 0,
    jobsNeedingReassignment: 0,
    newApplicants: 0,
    pendingApplicants: 0,
    overdueRentals: 0,
    lowRatings: 0,
    unreadMessages: 0,
    activeBubblers: 0,
    recentActivity: []
  });

  // Modal state
  const [breakdownModal, setBreakdownModal] = useState({
    isOpen: false,
    type: null,
    title: '',
    data: []
  });

  // Raw data for breakdowns
  const [rawData, setRawData] = useState({
    jobs: [],
    applicants: [],
    ratings: [],
    equipment: [],
    messages: [],
    payouts: []
  });

  // Real-time updates state
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    endDate: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Export functionality
  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch jobs with date filtering
      const { data: jobs, error: jobsError } = await supabase
        .from('job_assignments')
        .select('*')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());
      const jobsArray = Array.isArray(jobs) ? jobs : [];
      if (jobsError) console.warn('Jobs fetch warning:', jobsError);
      
      // Fetch applicants with date filtering (defensive - table might not exist)
      let applicantsArray = [];
      try {
        const { data: applicants, error: applicantsError } = await supabase
          .from('applicants')
          .select('*')
          .gte('created_at', dateRange.startDate.toISOString())
          .lte('created_at', dateRange.endDate.toISOString());
        applicantsArray = Array.isArray(applicants) ? applicants : [];
        if (applicantsError) console.warn('Applicants fetch warning:', applicantsError);
      } catch (err) {
        console.warn('Applicants table not available:', err);
      }
      
      // Fetch equipment (no date filtering needed for current status)
      const { data: equipment, error: equipmentError } = await supabase.from('equipment').select('*');
      const equipmentArray = Array.isArray(equipment) ? equipment : [];
      if (equipmentError) console.warn('Equipment fetch warning:', equipmentError);
      
      // Fetch ratings with date filtering (defensive - table might not exist)
      let ratingsArray = [];
      try {
        const { data: ratings, error: ratingsError } = await supabase
          .from('ratings')
          .select('*')
          .gte('created_at', dateRange.startDate.toISOString())
          .lte('created_at', dateRange.endDate.toISOString());
        ratingsArray = Array.isArray(ratings) ? ratings : [];
        if (ratingsError) console.warn('Ratings fetch warning:', ratingsError);
      } catch (err) {
        console.warn('Ratings table not available:', err);
      }
      
      // Fetch messages with date filtering
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());
      const messagesArray = Array.isArray(messages) ? messages : [];
      if (messagesError) console.warn('Messages fetch warning:', messagesError);
      
      // Fetch bubblers (no date filtering needed for current status)
      const { data: bubblers, error: bubblersError } = await supabase.from('bubblers').select('*');
      const bubblersArray = Array.isArray(bubblers) ? bubblers : [];
      if (bubblersError) console.warn('Bubblers fetch warning:', bubblersError);
      
      // Fetch payouts with date filtering (defensive - table might not exist)
      let payoutsArray = [];
      try {
        const { data: payouts, error: payoutsError } = await supabase
          .from('payouts')
          .select('*')
          .gte('created_at', dateRange.startDate.toISOString())
          .lte('created_at', dateRange.endDate.toISOString());
        payoutsArray = Array.isArray(payouts) ? payouts : [];
        if (payoutsError) console.warn('Payouts fetch warning:', payoutsError);
      } catch (err) {
        console.warn('Payouts table not available:', err);
      }

      // Store raw data for breakdowns
      setRawData({
        jobs: jobsArray,
        applicants: applicantsArray,
        ratings: ratingsArray,
        equipment: equipmentArray,
        messages: messagesArray,
        payouts: payoutsArray
      });

      // Calculate dashboard metrics
      const revenueDeposits = jobsArray.reduce((sum, j) => sum + (parseFloat(j.depositAmount) || 0), 0);
      const revenueCompleted = jobsArray.filter(j => j.jobStatus === 'completed').reduce((sum, j) => sum + (parseFloat(j.earningsEstimate) || 0), 0);
      
      const newOrders = jobsArray.filter(j => isToday(j.created_at)).length;
      const pendingAssignments = jobsArray.filter(j => j.jobStatus === 'assigned' && !j.accepted).length;
      const jobsNeedingReassignment = jobsArray.filter(j => j.jobStatus === 'needs_reassignment').length;
      
      const newApplicants = applicantsArray.filter(a => isToday(a.created_at)).length;
      const pendingApplicants = applicantsArray.filter(a => a.status === 'pending').length;
      
      const overdueRentals = equipmentArray.filter(e => e.status === 'rented' && isOverdue(e.expectedReturn)).length;
      
      const lowRatings = ratingsArray.filter(r => parseFloat(r.rating) <= 3).length;
      
      const unreadMessages = messagesArray.filter(m => !m.read && m.toRole === 'admin').length;
      
      const activeBubblers = bubblersArray.filter(b => b.is_active).length;
      
      const totalPayouts = payoutsArray.filter(p => p.status === 'paid').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const pendingPayouts = payoutsArray.filter(p => p.status === 'pending').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
      const recentPayouts = payoutsArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10).map(p => ({
        id: p.id,
        bubblerName: p.bubblerName,
        amount: p.amount,
        date: new Date(p.created_at).toLocaleDateString(),
        status: p.status,
        created_at: p.created_at
      }));

      // Recent activity
      const recentJobs = jobsArray.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)).slice(0, 5).map(j => ({
          id: j.id,
        type: 'job',
          message: `${j.serviceType} for ${j.customerName} (${j.jobStatus})`,
          time: new Date(j.updated_at || j.created_at).toLocaleString()
        }));
      
      const recentApplicants = applicantsArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3).map(a => ({
        id: a.id,
        type: 'applicant',
        message: `Applicant: ${a.name} (${a.status})`,
        time: new Date(a.created_at).toLocaleString()
      }));
      
      const recentRatings = ratingsArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3).map(r => ({
        id: r.id,
        type: 'rating',
        message: `Rating: ${r.rating} stars from ${r.customerName}`,
        time: new Date(r.created_at).toLocaleString()
      }));
      
      const recentEquipment = equipmentArray.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)).slice(0, 3).map(e => ({
        id: e.id,
        type: 'equipment',
        message: `Equipment: ${e.item} (${e.status})`,
        time: new Date(e.updated_at || e.created_at).toLocaleString()
      }));
      
      const recentMessages = messagesArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3).map(m => ({
        id: m.id,
        type: 'message',
        message: `Message from ${m.fromName || m.from}: ${m.subject || 'No subject'}`,
        time: new Date(m.created_at).toLocaleString()
      }));
      
      const recentActivity = [
        ...recentJobs,
        ...recentApplicants,
        ...recentRatings,
        ...recentEquipment,
        ...recentMessages
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

      setDashboardData({
        revenueDeposits,
        revenueCompleted,
        totalPayouts,
        pendingPayouts,
        recentPayouts,
        newOrders,
        pendingAssignments,
        jobsNeedingReassignment,
        newApplicants,
        pendingApplicants,
        overdueRentals,
        lowRatings,
        unreadMessages,
        activeBubblers,
        recentActivity
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  function isToday(dateString) {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }
  
  function isOverdue(expectedReturn) {
    return expectedReturn && new Date(expectedReturn) < new Date();
  }

  // Date range helpers
  const getDateRangeLabel = () => {
    const start = dateRange.startDate.toLocaleDateString();
    const end = dateRange.endDate.toLocaleDateString();
    return start === end ? start : `${start} - ${end}`;
  };

  const setQuickDateRange = (range) => {
    const now = new Date();
    let startDate, endDate;
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        return;
    }
    
    setDateRange({ startDate, endDate });
  };

  // Handle card clicks for breakdowns
  const handleCardClick = (type, title) => {
    let data = [];
    let modalType = type;
    
    switch (type) {
      case 'deposits':
        data = rawData.jobs.filter(j => parseFloat(j.depositAmount) > 0);
        modalType = 'jobs';
        break;
      case 'completed':
        data = rawData.jobs.filter(j => j.jobStatus === 'completed');
        modalType = 'jobs';
        break;
      case 'paid-payouts':
        data = rawData.payouts.filter(p => p.status === 'paid');
        modalType = 'payouts';
        break;
      case 'pending-payouts':
        data = rawData.payouts.filter(p => p.status === 'pending');
        modalType = 'payouts';
        break;
      case 'new-orders':
        data = rawData.jobs.filter(j => isToday(j.created_at));
        modalType = 'jobs';
        break;
      case 'pending-assignments':
        data = rawData.jobs.filter(j => j.jobStatus === 'assigned' && !j.accepted);
        modalType = 'jobs';
        break;
      case 'reassignment':
        data = rawData.jobs.filter(j => j.jobStatus === 'needs_reassignment');
        modalType = 'jobs';
        break;
      case 'new-applicants':
        data = rawData.applicants.filter(a => isToday(a.created_at));
        modalType = 'applicants';
        break;
      case 'pending-applicants':
        data = rawData.applicants.filter(a => a.status === 'pending');
        modalType = 'applicants';
        break;
      case 'overdue-rentals':
        data = rawData.equipment.filter(e => e.status === 'rented' && isOverdue(e.expectedReturn));
        modalType = 'equipment';
        break;
      case 'low-ratings':
        data = rawData.ratings.filter(r => parseFloat(r.rating) <= 3);
        modalType = 'ratings';
        break;
      case 'unread-messages':
        data = rawData.messages.filter(m => !m.read && m.toRole === 'admin');
        modalType = 'messages';
        break;
      case 'active-bubblers':
        // Navigate to bubblers page instead of showing modal
        navigate('/bubblers?tab=active');
        return;
      default:
        return;
    }
    
    setBreakdownModal({
      isOpen: true,
      type: modalType,
      title,
      data
    });
  };

  const closeBreakdownModal = () => {
    setBreakdownModal({
      isOpen: false,
      type: null,
      title: '',
      data: []
    });
  };

  const refreshData = async (showLoading = false) => {
    if (showLoading) {
      setIsRefreshing(true);
    }
    
    try {
      await loadDashboardData();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    // Initial load
    refreshData();
    
    // Set up polling every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line
  }, []);

  // Export functionality
  const exportDashboardData = (type = 'all') => {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    
    let data = [];
    let filename = '';
    
    switch (type) {
      case 'revenue':
        data = [
          { metric: 'Deposits Collected', value: `$${Number(dashboardData.revenueDeposits || 0).toFixed(2)}` },
          { metric: 'Revenue (Completed)', value: `$${Number(dashboardData.revenueCompleted || 0).toFixed(2)}` },
          { metric: 'Total Payouts', value: `$${Number(dashboardData.totalPayouts || 0).toFixed(2)}` },
          { metric: 'Pending Payouts', value: `$${Number(dashboardData.pendingPayouts || 0).toFixed(2)}` }
        ];
        filename = `revenue_summary_${timestamp}.csv`;
        break;
      case 'orders':
        data = [
          { metric: 'New Orders (Today)', value: dashboardData.newOrders },
          { metric: 'Pending Assignments', value: dashboardData.pendingAssignments },
          { metric: 'Jobs Needing Reassignment', value: dashboardData.jobsNeedingReassignment }
        ];
        filename = `orders_summary_${timestamp}.csv`;
        break;
      case 'applicants':
        data = [
          { metric: 'New Applicants (Today)', value: dashboardData.newApplicants },
          { metric: 'Pending Applications', value: dashboardData.pendingApplicants }
        ];
        filename = `applicants_summary_${timestamp}.csv`;
        break;
      case 'operations':
        data = [
          { metric: 'Overdue Rentals', value: dashboardData.overdueRentals },
          { metric: 'Low Ratings (≤3★)', value: dashboardData.lowRatings },
          { metric: 'Unread Messages', value: dashboardData.unreadMessages },
          { metric: 'Active Bubblers', value: dashboardData.activeBubblers }
        ];
        filename = `operations_summary_${timestamp}.csv`;
        break;
      case 'all':
      default:
        data = [
          { metric: 'Deposits Collected', value: `$${Number(dashboardData.revenueDeposits || 0).toFixed(2)}` },
          { metric: 'Revenue (Completed)', value: `$${Number(dashboardData.revenueCompleted || 0).toFixed(2)}` },
          { metric: 'Total Payouts', value: `$${Number(dashboardData.totalPayouts || 0).toFixed(2)}` },
          { metric: 'Pending Payouts', value: `$${Number(dashboardData.pendingPayouts || 0).toFixed(2)}` },
          { metric: 'New Orders (Today)', value: dashboardData.newOrders },
          { metric: 'Pending Assignments', value: dashboardData.pendingAssignments },
          { metric: 'Jobs Needing Reassignment', value: dashboardData.jobsNeedingReassignment },
          { metric: 'New Applicants (Today)', value: dashboardData.newApplicants },
          { metric: 'Pending Applications', value: dashboardData.pendingApplicants },
          { metric: 'Overdue Rentals', value: dashboardData.overdueRentals },
          { metric: 'Low Ratings (≤3★)', value: dashboardData.lowRatings },
          { metric: 'Unread Messages', value: dashboardData.unreadMessages },
          { metric: 'Active Bubblers', value: dashboardData.activeBubblers }
        ];
        filename = `dashboard_summary_${timestamp}.csv`;
        break;
    }
    
    // Add date range info
    data.unshift({ metric: 'Date Range', value: getDateRangeLabel() });
    data.unshift({ metric: 'Export Date', value: now.toLocaleString() });
    
    const csvContent = generateCSV(data);
    downloadCSV(csvContent, filename);
  };

  const generateCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, icon: Icon, change, color = 'brand-aqua' }) => (
    <div className="card-hover">
      <div className="flex items-center">
        <div className={`p-3 bg-${color}-100 rounded-xl`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {change !== null && (
            <p className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last week
            </p>
          )}
        </div>
      </div>
    </div>
  );

  StatCard.propTypes = {
    change: PropTypes.number,
    color: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  };

  StatCard.defaultProps = {
    change: null,
    color: 'brand-aqua'
  };

  const QuickAction = ({ title, description, icon: Icon, onClick, color = 'brand-aqua' }) => (
    <button
      onClick={onClick}
      className="card-hover w-full text-left group"
    >
        <div className="flex items-center">
        <div className={`p-3 bg-${color}-100 rounded-xl group-hover:bg-${color}-200 transition-colors`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
        <div className="ml-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
        <FiArrowRight className="ml-auto h-4 w-4 text-gray-400 group-hover:text-brand-aqua transition-colors" />
      </div>
    </button>
  );

  QuickAction.propTypes = {
    color: PropTypes.string,
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired
  };

  QuickAction.defaultProps = {
    color: 'brand-aqua'
  };

  const RecentActivity = () => (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-800 mb-4 font-poppins">Recent Activity</h3>
      <div className="space-y-4">
        {dashboardData.recentActivity.length > 0 ? (
          dashboardData.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-brand-aqua rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <FiClock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render bubbler dashboard for bubblers
  if (isBubbler && !isAdmin) {
    console.log('Dashboard: Rendering BubblerDashboard for bubbler user');
    return <BubblerDashboard />;
  }

  // Additional check: if user is not admin and has a role, they should see bubbler dashboard
  if (!isAdmin && user && user.email && !user.email.includes('admin')) {
    console.log('Dashboard: User is not admin and has email, rendering BubblerDashboard as fallback');
    return <BubblerDashboard />;
  }

  // Render admin dashboard for admins
  if (isAdmin) {
    console.log('Dashboard: Rendering Admin Dashboard for admin user');
  } else {
    console.log('Dashboard: User is neither admin nor bubbler, rendering admin dashboard as fallback');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  // Only render dashboard content when on the dashboard route
  const location = useLocation();
  if (location.pathname !== '/dashboard') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh controls and date range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiDownload className="h-4 w-4" />
              Export
            </button>
            
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10 min-w-48">
                <button
                  onClick={() => {
                    exportDashboardData('all');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  Export All Data
                </button>
                <button
                  onClick={() => {
                    exportDashboardData('revenue');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  Export Revenue Data
                </button>
                <button
                  onClick={() => {
                    exportDashboardData('orders');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  Export Orders Data
                </button>
                <button
                  onClick={() => {
                    exportDashboardData('applicants');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  Export Applicants Data
                </button>
                <button
                  onClick={() => {
                    exportDashboardData('operations');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  Export Operations Data
                </button>
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">{getDateRangeLabel()}</span>
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 min-w-64">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Ranges</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setQuickDateRange('today')}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setQuickDateRange('week')}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        This Week
                      </button>
                      <button
                        onClick={() => setQuickDateRange('month')}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        This Month
                      </button>
                      <button
                        onClick={() => setQuickDateRange('quarter')}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        This Quarter
                      </button>
                      <button
                        onClick={() => setQuickDateRange('year')}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        This Year
                      </button>
                    </div>
      </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Range</label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={dateRange.startDate.toISOString().split('T')[0]}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="date"
                        value={dateRange.endDate.toISOString().split('T')[0]}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowDatePicker(false);
                        refreshData(true);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Business Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {/* Revenue Cards */}
        <div 
          className="group relative bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-green-300" 
          onClick={() => handleCardClick('deposits', 'Deposits Collected')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-green-700 mb-1">Deposits Collected</div>
              <div className="text-2xl font-bold text-green-900">${Number(dashboardData.revenueDeposits || 0).toFixed(2)}</div>
              <div className="text-xs text-green-600 mt-1">Total deposits</div>
            </div>
            <div className="p-3 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
              <FiDollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-green-600" />
          </div>
        </div>

        <div 
          className="group relative bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-blue-300" 
          onClick={() => handleCardClick('completed', 'Revenue (Completed Jobs)')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-700 mb-1">Revenue (Completed)</div>
              <div className="text-2xl font-bold text-blue-900">${Number(dashboardData.revenueCompleted || 0).toFixed(2)}</div>
              <div className="text-xs text-blue-600 mt-1">Completed jobs</div>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
              <FiTrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        {/* Payouts Cards */}
        <div 
          className="group relative bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-purple-300" 
          onClick={() => handleCardClick('paid-payouts', 'Total Payouts')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-purple-700 mb-1">Total Payouts</div>
              <div className="text-2xl font-bold text-purple-900">${Number(dashboardData.totalPayouts || 0).toFixed(2)}</div>
              <div className="text-xs text-purple-600 mt-1">Paid to bubblers</div>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
              <FiCheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-purple-600" />
          </div>
        </div>

        <div 
          className="group relative bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-yellow-300" 
          onClick={() => handleCardClick('pending-payouts', 'Pending Payouts')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-700 mb-1">Pending Payouts</div>
              <div className="text-2xl font-bold text-yellow-900">${Number(dashboardData.pendingPayouts || 0).toFixed(2)}</div>
              <div className="text-xs text-yellow-600 mt-1">Awaiting payment</div>
            </div>
            <div className="p-3 bg-yellow-500 rounded-lg group-hover:bg-yellow-600 transition-colors">
              <FiClock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-yellow-600" />
          </div>
        </div>

        {/* Orders/Jobs Cards */}
        <div 
          className="group relative bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-indigo-300" 
          onClick={() => handleCardClick('new-orders', 'New Orders (Today)')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-indigo-700 mb-1">New Orders (Today)</div>
              <div className="text-2xl font-bold text-indigo-900">{dashboardData.newOrders}</div>
              <div className="text-xs text-indigo-600 mt-1">Fresh requests</div>
            </div>
            <div className="p-3 bg-indigo-500 rounded-lg group-hover:bg-indigo-600 transition-colors">
              <FiPlus className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-indigo-600" />
          </div>
        </div>

        <div 
          className="group relative bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-orange-300" 
          onClick={() => handleCardClick('pending-assignments', 'Pending Assignments')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-orange-700 mb-1">Pending Assignments</div>
              <div className="text-2xl font-bold text-orange-900">{dashboardData.pendingAssignments}</div>
              <div className="text-xs text-orange-600 mt-1">Awaiting acceptance</div>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
              <FiClock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-orange-600" />
          </div>
        </div>

        <div 
          className="group relative bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-red-300" 
          onClick={() => handleCardClick('reassignment', 'Jobs Needing Reassignment')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-red-700 mb-1">Needs Reassignment</div>
              <div className="text-2xl font-bold text-red-900">{dashboardData.jobsNeedingReassignment}</div>
              <div className="text-xs text-red-600 mt-1">Requires attention</div>
            </div>
            <div className="p-3 bg-red-500 rounded-lg group-hover:bg-red-600 transition-colors">
              <FiAlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-red-600" />
          </div>
        </div>

        {/* Applicants Cards */}
        <div 
          className="group relative bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-cyan-300" 
          onClick={() => handleCardClick('new-applicants', 'New Applicants (Today)')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-cyan-700 mb-1">New Applicants (Today)</div>
              <div className="text-2xl font-bold text-cyan-900">{dashboardData.newApplicants}</div>
              <div className="text-xs text-cyan-600 mt-1">Fresh applications</div>
            </div>
            <div className="p-3 bg-cyan-500 rounded-lg group-hover:bg-cyan-600 transition-colors">
              <FiUser className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-cyan-600" />
          </div>
        </div>

        <div 
          className="group relative bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-amber-300" 
          onClick={() => handleCardClick('pending-applicants', 'Pending Applications')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-700 mb-1">Pending Applications</div>
              <div className="text-2xl font-bold text-amber-900">{dashboardData.pendingApplicants}</div>
              <div className="text-xs text-amber-600 mt-1">Under review</div>
            </div>
            <div className="p-3 bg-amber-500 rounded-lg group-hover:bg-amber-600 transition-colors">
              <FiUser className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-amber-600" />
          </div>
        </div>

        {/* Equipment Card */}
        <div 
          className="group relative bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-rose-300" 
          onClick={() => handleCardClick('overdue-rentals', 'Overdue Rentals')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-rose-700 mb-1">Overdue Rentals</div>
              <div className="text-2xl font-bold text-rose-900">{dashboardData.overdueRentals}</div>
              <div className="text-xs text-rose-600 mt-1">Past due date</div>
            </div>
            <div className="p-3 bg-rose-500 rounded-lg group-hover:bg-rose-600 transition-colors">
              <FiPackage className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-rose-600" />
          </div>
        </div>

        {/* Ratings Card */}
        <div 
          className="group relative bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-yellow-300" 
          onClick={() => handleCardClick('low-ratings', 'Low Ratings (≤3★)')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-700 mb-1">Low Ratings (≤3★)</div>
              <div className="text-2xl font-bold text-yellow-900">{dashboardData.lowRatings}</div>
              <div className="text-xs text-yellow-600 mt-1">Needs attention</div>
            </div>
            <div className="p-3 bg-yellow-500 rounded-lg group-hover:bg-yellow-600 transition-colors">
              <FiStar className="h-6 w-6 text-white" />
                </div>
              </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-yellow-600" />
                </div>
              </div>

        {/* Messages Card */}
        <div 
          className="group relative bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-blue-300" 
          onClick={() => handleCardClick('unread-messages', 'Unread Messages')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-700 mb-1">Unread Messages</div>
              <div className="text-2xl font-bold text-blue-900">{dashboardData.unreadMessages}</div>
              <div className="text-xs text-blue-600 mt-1">Require response</div>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
              <FiMessageCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          
        {/* Bubblers Card */}
        <div 
          className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-emerald-300" 
          onClick={() => handleCardClick('active-bubblers', 'Active Bubblers')}
        > 
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-emerald-700 mb-1">Active Bubblers</div>
              <div className="text-2xl font-bold text-emerald-900">{dashboardData.activeBubblers}</div>
              <div className="text-xs text-emerald-600 mt-1">Available workers</div>
            </div>
            <div className="p-3 bg-emerald-500 rounded-lg group-hover:bg-emerald-600 transition-colors">
              <FiUsers className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <FiArrowRight className="h-4 w-4 text-emerald-600" />
              </div>
                </div>
              </div>
              
      {/* Recent Payouts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Recent Payouts</h3>
          <button 
            onClick={() => navigate('/earnings')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            View All
            <FiArrowRight className="h-4 w-4" />
          </button>
              </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bubbler</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {dashboardData.recentPayouts.length > 0 ? (
                dashboardData.recentPayouts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/earnings/${p.id}`)}>
                    <td className="px-4 py-3 text-sm text-gray-900">{p.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.bubblerName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    <FiClock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No recent payouts</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
                </div>
              </div>
              
      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Recent Activity</h3>
          <button 
            onClick={() => navigate('/activity')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            View All
            <FiArrowRight className="h-4 w-4" />
          </button>
              </div>
        <div className="space-y-4">
          {dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'job' ? 'bg-blue-500' :
                  activity.type === 'applicant' ? 'bg-green-500' :
                  activity.type === 'rating' ? 'bg-yellow-500' :
                  activity.type === 'equipment' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Modal */}
      <BreakdownModal
        isOpen={breakdownModal.isOpen}
        onClose={closeBreakdownModal}
        type={breakdownModal.type}
        title={breakdownModal.title}
        data={breakdownModal.data}
      />
    </div>
  );
};

export default Dashboard;