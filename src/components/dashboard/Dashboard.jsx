import React, { useEffect, useState } from 'react';
import {
  FiCalendar as Calendar,
  FiDollarSign as DollarSign,
  FiCheckCircle as CheckCircle,
  FiClock as Clock,
  FiTrendingUp as TrendingUp,
  FiUsers as Users,
  FiBriefcase as Briefcase,
  FiStar as Star,
  FiAlertCircle as AlertCircle,
  FiArrowRight as ArrowRight
} from 'react-icons/fi';
import useStore from '../../store/useStore';

const Dashboard = () => {
  const { user, isAdmin, dailyJobs, setDailyJobs, loading, setLoading } = useStore();

  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalEarnings: 0,
    averageRating: 0,
    activeEquipment: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const mockJobs = [
        {
          id: 1,
          customerName: 'Jane Doe',
          serviceType: 'Home Cleaning',
          timeWindow: '9:00 AM - 11:00 AM',
          status: 'pending',
          earnings: 85.00
        },
        {
          id: 2,
          customerName: 'John Smith',
          serviceType: 'Laundry Service',
          timeWindow: '2:00 PM - 4:00 PM',
          status: 'completed',
          earnings: 65.00
        },
        {
          id: 3,
          customerName: 'Sarah Wilson',
          serviceType: 'Mobile Car Wash',
          timeWindow: '10:00 AM - 12:00 PM',
          status: 'in-progress',
          earnings: 95.00
        }
      ];

      setDailyJobs(mockJobs);

      setStats({
        totalJobs: mockJobs.length,
        completedJobs: mockJobs.filter(j => j.status === 'completed').length,
        pendingJobs: mockJobs.filter(j => j.status === 'pending').length,
        totalEarnings: mockJobs.reduce((sum, j) => sum + j.earnings, 0),
        averageRating: 4.8,
        activeEquipment: 3
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, change }) => (
    <div className="card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last week
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-blue-500">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon: Icon, onClick }) => (
    <button
      onClick={onClick}
      className="card-hover text-left group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-blue-500 mr-4">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </button>
  );

  const RecentActivity = () => (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {dailyJobs.slice(0, 5).map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
          >
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  job.status === 'completed'
                    ? 'bg-green-500'
                    : job.status === 'in-progress'
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
                }`}
              />
              <div>
                <p className="font-medium text-gray-900">{job.customerName}</p>
                <p className="text-sm text-gray-600">{job.serviceType}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">${job.earnings}</p>
              <p className="text-xs text-gray-500">{job.timeWindow}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 dashboard-container">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Today's Jobs" value={stats.totalJobs} icon={Calendar} change={12} />
        <StatCard title="Completed" value={stats.completedJobs} icon={CheckCircle} change={8} />
        <StatCard title="Pending" value={stats.pendingJobs} icon={Clock} change={-5} />
        <StatCard
          title="Total Earnings"
          value={`$${stats.totalEarnings.toFixed(2)}`}
          icon={DollarSign}
          change={15}
        />
        <StatCard title="Average Rating" value={stats.averageRating} icon={Star} change={2} />
        <StatCard title="Active Equipment" value={stats.activeEquipment} icon={Briefcase} change={0} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <QuickAction
              title="View Today's Jobs"
              description="Check your scheduled assignments"
              icon={Calendar}
              onClick={() => window.location.href = '/jobs'}
            />
            <QuickAction
              title="Scan QR Code"
              description="Track laundry bags and equipment"
              icon={TrendingUp}
              onClick={() => window.location.href = '/qr-scanner'}
            />
            <QuickAction
              title="Check Equipment"
              description="View assigned tools and status"
              icon={Briefcase}
              onClick={() => window.location.href = '/equipment'}
            />
            {isAdmin && (
              <QuickAction
                title="Manage Team"
                description="View all bubblers and assignments"
                icon={Users}
                onClick={() => window.location.href = '/bubblers'}
              />
            )}
          </div>
        </div>
        <RecentActivity />
      </div>

      {/* Admin-specific */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="font-medium text-yellow-800">Equipment Return Due</p>
                  <p className="text-sm text-yellow-700">3 items need to be returned today</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-800">Pending Job Assignments</p>
                  <p className="text-sm text-blue-700">5 jobs need to be assigned</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Team Completion Rate</span>
                <span className="font-semibold text-green-600">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer Satisfaction</span>
                <span className="font-semibold text-blue-600">4.8/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue This Week</span>
                <span className="font-semibold text-purple-600">$12,450</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;