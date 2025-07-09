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
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { setDailyJobs, loading, setLoading } = useStore();
  const { user, isAdmin } = useAuth();
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
      
      // Ensure jobs is an array, default to empty array if null/undefined
      const jobsArray = Array.isArray(jobs) ? jobs : [];
      setDailyJobs(jobsArray);

      // Calculate stats
      const totalJobs = jobsArray.length;
      const completedJobs = jobsArray.filter(j => j.jobStatus === 'completed').length;
      const pendingJobs = jobsArray.filter(j => j.jobStatus === 'pending').length;
      const totalEarnings = jobsArray.reduce((sum, j) => sum + (parseFloat(j.earningsEstimate) || 0), 0);

      // Fetch ratings (if available)
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating');
      if (ratingsError) throw ratingsError;
      
      // Ensure ratings is an array, default to empty array if null/undefined
      const ratingsArray = Array.isArray(ratings) ? ratings : [];
      const averageRating = ratingsArray.length > 0 ? (ratingsArray.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0) / ratingsArray.length).toFixed(2) : 0;

      // Fetch equipment (if available)
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*');
      if (equipmentError) throw equipmentError;
      
      // Ensure equipment is an array, default to empty array if null/undefined
      const equipmentArray = Array.isArray(equipment) ? equipment : [];
      const activeEquipment = equipmentArray.filter(e => e.status === 'active').length;

      setStats({
        totalJobs,
        completedJobs,
        pendingJobs,
        totalEarnings,
        averageRating,
        activeEquipment
      });

      // Fetch recent activity (last 5 jobs)
      const recent = jobsArray
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
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs ?? 0}
          icon={FiList}
          change={12}
          color="brand-aqua"
        />
        <StatCard
          title="Completed"
          value={stats.completedJobs ?? 0}
          icon={FiCheckCircle}
          change={8}
          color="green"
        />
        <StatCard
          title="Pending"
          value={stats.pendingJobs ?? 0}
          icon={FiClock}
          change={-3}
          color="brand-blue"
        />
        <StatCard
          title="Total Earnings"
          value={`$${Number(stats.totalEarnings || 0).toFixed(2)}`}
          icon={FiDollarSign}
          change={15}
          color="brand-aqua"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4 font-poppins">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="Total Jobs"
              description="View all jobs and their statuses"
              icon={FiList}
              onClick={() => navigate('/jobs?status=all')}
              color="brand-aqua"
            />
            <QuickAction
              title="Pending"
              description="Jobs awaiting acceptance or assignment"
              icon={FiClock}
              onClick={() => navigate('/jobs?status=pending')}
              color="brand-blue"
            />
            <QuickAction
              title="Completed"
              description="View all completed jobs"
              icon={FiCheckCircle}
              onClick={() => navigate('/jobs?status=completed')}
              color="green"
            />
              <QuickAction
              title="View Jobs"
              description="See all active/in-progress jobs"
              icon={FiBriefcase}
              onClick={() => navigate('/jobs?status=active')}
              color="brand-aqua"
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
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-poppins">System Alerts</h3>
            <div className="space-y-4">
              <div className="flex items-start p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <FiAlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800">Equipment Return Due</p>
                  <p className="text-sm text-yellow-700 mt-1">3 items need to be returned today</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <FiClock className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-800">Pending Job Assignments</p>
                  <p className="text-sm text-blue-700 mt-1">5 jobs need to be assigned</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-poppins">Performance Overview</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Team Completion Rate</span>
                  <span className="font-bold text-green-600">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: '94%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Customer Satisfaction</span>
                  <span className="font-bold text-brand-blue">4.8/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-brand-blue h-2 rounded-full transition-all duration-500" style={{ width: '96%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 font-medium">Revenue This Week</span>
                  <span className="font-bold text-brand-aqua">$12,450</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-brand-aqua h-2 rounded-full transition-all duration-500" style={{ width: '87%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;