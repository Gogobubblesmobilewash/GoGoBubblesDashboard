import React, { useEffect, useState } from 'react';
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
  FiCamera
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';

const Dashboard = () => {
  const { user, isAdmin, setDailyJobs, loading, setLoading } = useStore();
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalEarnings: 0,
    averageRating: 0,
    activeEquipment: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch jobs from Supabase
      const { data: jobs, error: jobsError } = await supabase
        .from('job_assignments')
        .select('*');
      if (jobsError) throw jobsError;
      setDailyJobs(jobs);

      // Calculate stats
      const totalJobs = jobs.length;
      const completedJobs = jobs.filter(j => j.jobStatus === 'completed').length;
      const pendingJobs = jobs.filter(j => j.jobStatus === 'pending').length;
      const totalEarnings = jobs.reduce((sum, j) => sum + (parseFloat(j.earningsEstimate) || 0), 0);

      // Fetch ratings (if available)
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating');
      if (ratingsError) throw ratingsError;
      const averageRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0) / ratings.length).toFixed(2) : 0;

      // Fetch equipment (if available)
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*');
      if (equipmentError) throw equipmentError;
      const activeEquipment = equipment.filter(e => e.status === 'active').length;

      setStats({
        totalJobs,
        completedJobs,
        pendingJobs,
        totalEarnings,
        averageRating,
        activeEquipment
      });

      // Fetch recent activity (last 5 jobs)
      const recent = jobs
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 5)
        .map(j => ({
          id: j.id,
          type: j.jobStatus,
          message: `${j.serviceType} for ${j.customerName} (${j.jobStatus})`,
          time: new Date(j.updated_at || j.created_at).toLocaleString()
        }));
      setRecentActivity(recent);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line
  }, []);

  const StatCard = ({ title, value, icon: Icon, change }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== null && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last week
            </p>
          )}
        </div>
      </div>
    </div>
  );

  StatCard.propTypes = {
    change: PropTypes.number,
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  };

  StatCard.defaultProps = {
    change: null
  };

  const QuickAction = ({ title, description, icon: Icon, onClick }) => (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-center">
        <div className="p-2 bg-green-100 rounded-lg">
          <Icon className="h-5 w-5 text-green-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );

  QuickAction.propTypes = {
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired
  };

  const RecentActivity = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {recentActivity.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={FiList}
          change={12}
        />
        <StatCard
          title="Completed"
          value={stats.completedJobs}
          icon={FiCheckCircle}
          change={8}
        />
        <StatCard
          title="Pending"
          value={stats.pendingJobs}
          icon={FiClock}
          change={-3}
        />
        <StatCard
          title="Total Earnings"
          value={`$${stats.totalEarnings}`}
          icon={FiDollarSign}
          change={15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="New Job"
              description="Create a new job assignment"
              icon={FiPlus}
              onClick={() => {/* Handle new job */}}
            />
            <QuickAction
              title="Scan QR"
              description="Scan QR code for job verification"
              icon={FiCamera}
              onClick={() => {/* Handle QR scan */}}
            />
            <QuickAction
              title="View Jobs"
              description="See all active jobs"
              icon={FiList}
              onClick={() => {/* Handle view jobs */}}
            />
            <QuickAction
              title="Manage Team"
              description="View and manage bubblers"
              icon={FiUsers}
              onClick={() => {/* Handle team management */}}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <RecentActivity />
        </div>
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
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer Satisfaction</span>
                <span className="font-semibold text-blue-600">4.8/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96%' }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue This Week</span>
                <span className="font-semibold text-purple-600">$12,450</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '87%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;