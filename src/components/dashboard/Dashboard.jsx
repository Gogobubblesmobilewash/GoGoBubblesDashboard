import React, { useState } from 'react';
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
import { useAuth } from '../../store/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  
  // Mock data that shows what you'll need in Supabase
  const [mockData] = useState({
    // Revenue & Financial Data (for 'revenue' table)
    revenue: {
      totalRevenue: 125000,
      totalDeposits: 15000,
      totalPayouts: 85000,
      pendingPayouts: 5000,
      stripeRevenue: 120000,
      taxableSales: 118000,
      processingFees: 2000,
      netRevenue: 123000
    },
    
    // Job Data (for 'jobs' and 'job_assignments' tables)
    jobs: {
      totalJobs: 45,
      pendingAssignments: 12,
      completedToday: 8,
      jobsNeedingReassignment: 3,
      recentJobs: [
        { id: 1, customer: 'John Smith', service: 'Home Cleaning', status: 'assigned', amount: 150 },
        { id: 2, customer: 'Sarah Johnson', service: 'Laundry Service', status: 'completed', amount: 85 },
        { id: 3, customer: 'Mike Davis', service: 'Car Wash', status: 'pending', amount: 75 }
      ]
    },
    
    // Applicant Data (for 'applicants' table)
    applicants: {
      totalApplicants: 23,
      pendingApplicants: 8,
      approvedApplicants: 12,
      declinedApplicants: 3,
      recentApplicants: [
        { id: 1, name: 'Alex Wilson', status: 'pending', applied: '2024-01-15' },
        { id: 2, name: 'Taylor Brown', status: 'approved', applied: '2024-01-14' },
        { id: 3, name: 'Jordan Lee', status: 'pending', applied: '2024-01-13' }
      ]
    },
    
    // Bubbler Data (for 'bubblers' table)
    bubblers: {
      totalBubblers: 18,
      activeBubblers: 15,
      newThisMonth: 3,
      recentActivity: [
        { id: 1, name: 'Emma Garcia', action: 'Completed job #123', time: '2 hours ago' },
        { id: 2, name: 'David Chen', action: 'Started job #124', time: '3 hours ago' },
        { id: 3, name: 'Lisa Rodriguez', action: 'Updated profile', time: '5 hours ago' }
      ]
    },
    
    // Equipment Data (for 'equipment' table)
    equipment: {
      totalEquipment: 25,
      availableEquipment: 18,
      inUse: 7,
      overdueRentals: 2,
      equipmentList: [
        { id: 1, name: 'Vacuum Cleaner', status: 'available', assignedTo: null },
        { id: 2, name: 'Steam Cleaner', status: 'in_use', assignedTo: 'Emma Garcia' },
        { id: 3, name: 'Laundry Kit', status: 'overdue', assignedTo: 'David Chen' }
      ]
    },
    
    // Messages Data (for 'messages' table)
    messages: {
      unreadMessages: 5,
      totalMessages: 23,
      recentMessages: [
        { id: 1, from: 'Customer Support', subject: 'Job inquiry', unread: true },
        { id: 2, from: 'System', subject: 'Payment processed', unread: false },
        { id: 3, from: 'Admin', subject: 'Schedule update', unread: true }
      ]
    },
    
    // Ratings Data (for 'ratings' table)
    ratings: {
      averageRating: 4.8,
      totalRatings: 156,
      lowRatings: 3,
      recentRatings: [
        { id: 1, customer: 'John Smith', rating: 5, comment: 'Excellent service!' },
        { id: 2, customer: 'Sarah Johnson', rating: 4, comment: 'Good work' },
        { id: 3, customer: 'Mike Davis', rating: 5, comment: 'Highly recommend' }
      ]
    }
  });

  // Only render dashboard content when on the dashboard route
  if (location.pathname !== '/dashboard') {
    return null;
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      }
      if (format === 'percentage') {
        return `${val}%`;
      }
      return val.toLocaleString();
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

  const QuickAction = ({ title, description, icon: Icon, onClick, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className={`inline-flex p-3 rounded-full bg-${color}-100 mb-4`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user?.email}! This is mock data showing what you'll need in Supabase.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('This would refresh real data from Supabase')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-aqua text-white rounded-lg hover:bg-brand-aqua-dark transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Supabase Setup Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">📋 Supabase Tables You'll Need</h2>
        <p className="text-blue-700 mb-3">
          This dashboard shows mock data. To make it real, you'll need these Supabase tables:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          <div className="bg-blue-100 rounded p-2">• <strong>revenue</strong> - Financial data</div>
          <div className="bg-blue-100 rounded p-2">• <strong>jobs</strong> - Job assignments</div>
          <div className="bg-blue-100 rounded p-2">• <strong>applicants</strong> - Job applications</div>
          <div className="bg-blue-100 rounded p-2">• <strong>bubblers</strong> - Worker profiles</div>
          <div className="bg-blue-100 rounded p-2">• <strong>equipment</strong> - Equipment tracking</div>
          <div className="bg-blue-100 rounded p-2">• <strong>messages</strong> - Communication</div>
          <div className="bg-blue-100 rounded p-2">• <strong>ratings</strong> - Customer reviews</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={mockData.revenue.totalRevenue}
          icon={FiDollarSign}
          color="green"
          format="currency"
        />
        <StatCard
          title="Active Jobs"
          value={mockData.jobs.totalJobs}
          icon={FiCalendar}
          color="blue"
        />
        <StatCard
          title="Active Bubblers"
          value={mockData.bubblers.activeBubblers}
          icon={FiUsers}
          color="purple"
        />
        <StatCard
          title="Pending Applicants"
          value={mockData.applicants.pendingApplicants}
          icon={FiAlertCircle}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="View All Jobs"
          description="See all job assignments and status"
          icon={FiCalendar}
          color="blue"
          onClick={() => navigate('/admin/jobs')}
        />
        <QuickAction
          title="Manage Bubblers"
          description="View and manage worker profiles"
          icon={FiUsers}
          color="purple"
          onClick={() => navigate('/bubblers')}
        />
        <QuickAction
          title="Review Applicants"
          description="Process job applications"
          icon={FiFileText}
          color="orange"
          onClick={() => navigate('/applicants')}
        />
        <QuickAction
          title="Equipment Status"
          description="Track equipment assignments"
          icon={FiBriefcase}
          color="green"
          onClick={() => navigate('/admin/equipment')}
        />
        <QuickAction
          title="Financial Reports"
          description="View revenue and payout data"
          icon={FiBarChart2}
          color="indigo"
          onClick={() => navigate('/earnings')}
        />
        <QuickAction
          title="Messages"
          description="Check communications"
          icon={FiMessageCircle}
          color="pink"
          onClick={() => navigate('/messages')}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
          </div>
          <div className="p-6 space-y-4">
            {mockData.jobs.recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{job.customer}</h4>
                  <p className="text-sm text-gray-600">{job.service}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(job.amount)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    job.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applicants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applicants</h3>
          </div>
          <div className="p-6 space-y-4">
            {mockData.applicants.recentApplicants.map((applicant) => (
              <div key={applicant.id} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{applicant.name}</h4>
                  <p className="text-sm text-gray-600">Applied: {applicant.applied}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  applicant.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  applicant.status === 'declined' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {applicant.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;