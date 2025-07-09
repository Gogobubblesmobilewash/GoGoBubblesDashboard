import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiUser,
  FiBriefcase,
  FiStar,
  FiAlertCircle,
  FiArrowRight,
  FiPlus,
  FiList,
  FiCamera,
  FiMapPin,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { supabase, getWeeklyPayoutBalance } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const BubblerDashboard = () => {
  const navigate = useNavigate();
  const { setDailyJobs, loading, setLoading } = useStore();
  const { user, isShineBubbler, isSparkleBubbler, isFreshBubbler, isEliteBubbler, canDoLaundry, canDoCarWash, canDoHomeCleaning } = useAuth();
  const [bubblerProfile, setBubblerProfile] = useState(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    totalEarnings: 0,
    averageRating: 0,
    thisWeekEarnings: 0,
    weeklyPayoutBalance: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [upcomingJobs, setUpcomingJobs] = useState([]);

  const getBubblerRole = () => {
    if (isEliteBubbler) return 'Elite Bubbler';
    if (isShineBubbler) return 'Shine Bubbler';
    if (isSparkleBubbler) return 'Sparkle Bubbler';
    if (isFreshBubbler) return 'Fresh Bubbler';
    return 'Bubbler';
  };

  const getBubblerServices = () => {
    const services = [];
    if (canDoCarWash) services.push('Mobile Car Wash');
    if (canDoHomeCleaning) services.push('Home Cleaning');
    if (canDoLaundry) services.push('Laundry Service');
    return services.join(', ');
  };

  const loadBubblerData = async () => {
    setLoading(true);
    try {
      // Fetch bubbler profile
      const { data: profile, error: profileError } = await supabase
        .from('bubblers')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (profileError) throw profileError;
      setBubblerProfile(profile);

      // Fetch jobs assigned to this bubbler
      const { data: jobs, error: jobsError } = await supabase
        .from('job_assignments')
        .select('*')
        .eq('bubbler_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (jobsError) throw jobsError;
      
      const jobsArray = Array.isArray(jobs) ? jobs : [];
      setDailyJobs(jobsArray);

      // Calculate stats
      const totalJobs = jobsArray.length;
      const completedJobs = jobsArray.filter(j => j.status === 'completed').length;
      const pendingJobs = jobsArray.filter(j => j.status === 'pending' || j.status === 'assigned').length;
      const totalEarnings = jobsArray.reduce((sum, j) => sum + (parseFloat(j.earnings) || 0), 0);
      
      // Calculate this week's earnings
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekJobs = jobsArray.filter(j => new Date(j.created_at) >= oneWeekAgo);
      const thisWeekEarnings = thisWeekJobs.reduce((sum, j) => sum + (parseFloat(j.earnings) || 0), 0);

      // Get weekly payout balance
      const weeklyPayoutData = await getWeeklyPayoutBalance(profile.id);

      // Fetch ratings for this bubbler
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('bubbler_id', profile.id);
      
      if (ratingsError) throw ratingsError;
      
      const ratingsArray = Array.isArray(ratings) ? ratings : [];
      const averageRating = ratingsArray.length > 0 ? 
        (ratingsArray.reduce((sum, r) => sum + (parseFloat(r.rating) || 0), 0) / ratingsArray.length).toFixed(1) : 0;

      setStats({
        totalJobs,
        completedJobs,
        pendingJobs,
        totalEarnings,
        averageRating,
        thisWeekEarnings,
        weeklyPayoutBalance: weeklyPayoutData.weeklyPayout
      });

      // Set recent and upcoming jobs
      const today = new Date();
      const upcoming = jobsArray.filter(j => 
        j.status === 'assigned' || j.status === 'pending'
      ).slice(0, 5);
      
      const recent = jobsArray.filter(j => 
        j.status === 'completed'
      ).slice(0, 5);

      setUpcomingJobs(upcoming);
      setRecentJobs(recent);

    } catch (err) {
      console.error('Error loading bubbler data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBubblerData();
    }
  }, [user]);

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

  const JobCard = ({ job, type = 'upcoming' }) => (
    <div className={`p-4 rounded-xl border ${
      type === 'upcoming' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-semibold text-gray-900">{job.service_type || 'Service'}</div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          job.status === 'completed' ? 'bg-green-100 text-green-800' :
          job.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {job.status}
        </span>
      </div>
      <div className="text-sm text-gray-700 mb-1">
        <span className="font-medium">Customer:</span> {job.customer_name}
      </div>
      <div className="text-sm text-gray-700 mb-2">
        <span className="font-medium">Address:</span> {job.customer_address}
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">Job ID: {job.id}</div>
        <div className="font-semibold text-green-600">${parseFloat(job.earnings || 0).toFixed(2)}</div>
      </div>
    </div>
  );

  JobCard.propTypes = {
    job: PropTypes.object.isRequired,
    type: PropTypes.oneOf(['upcoming', 'recent'])
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="bg-cyan-100 rounded-full h-16 w-16 flex items-center justify-center font-bold text-3xl text-cyan-700">
            {bubblerProfile?.name?.[0] || user?.email?.[0] || 'B'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, {bubblerProfile?.name || 'Bubbler'}!</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-aqua text-white">
                {getBubblerRole()}
              </span>
              <div className="flex items-center">
                <FiStar className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium">{stats.averageRating} Rating</span>
              </div>
            </div>
            <p className="text-gray-600 mt-2">Services: {getBubblerServices()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={FiList}
          color="brand-aqua"
        />
        <StatCard
          title="Completed"
          value={stats.completedJobs}
          icon={FiCheckCircle}
          color="green"
        />
        <StatCard
          title="Pending"
          value={stats.pendingJobs}
          icon={FiClock}
          color="brand-blue"
        />
        <StatCard
          title="This Week"
          value={`$${stats.thisWeekEarnings.toFixed(2)}`}
          icon={FiDollarSign}
          color="brand-aqua"
        />
        <StatCard
          title="Weekly Payout"
          value={`$${stats.weeklyPayoutBalance.toFixed(2)}`}
          icon={FiDollarSign}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4 font-poppins">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="My Jobs"
              description="View all your assigned jobs"
              icon={FiBriefcase}
              onClick={() => navigate('/jobs')}
              color="brand-aqua"
            />
            <QuickAction
              title="Pending Jobs"
              description="Jobs awaiting your action"
              icon={FiClock}
              onClick={() => navigate('/jobs?status=pending')}
              color="brand-blue"
            />
            {canDoLaundry && (
              <QuickAction
                title="QR Scanner"
                description="Scan laundry bags and equipment"
                icon={FiCamera}
                onClick={() => navigate('/qr-scanner')}
                color="purple"
              />
            )}
            <QuickAction
              title="My Earnings"
              description="View your earnings and performance"
              icon={FiDollarSign}
              onClick={() => navigate('/earnings')}
              color="green"
            />
            <QuickAction
              title="My Profile"
              description="Update your information"
              icon={FiUser}
              onClick={() => navigate('/profile')}
              color="brand-aqua"
            />
          </div>
        </div>

        {/* Profile Summary */}
        <div>
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4 font-poppins">Profile Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiMail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{bubblerProfile?.email || user?.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiPhone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{bubblerProfile?.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiMapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{bubblerProfile?.home_location || 'Not set'}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-green-600">${stats.totalEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4 font-poppins">Upcoming Jobs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingJobs.map((job) => (
              <JobCard key={job.id} job={job} type="upcoming" />
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed Jobs */}
      {recentJobs.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4 font-poppins">Recent Completed Jobs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} type="recent" />
            ))}
          </div>
        </div>
      )}

      {/* No Jobs Message */}
      {upcomingJobs.length === 0 && recentJobs.length === 0 && (
        <div className="card">
          <div className="text-center py-8">
            <FiBriefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Yet</h3>
            <p className="text-gray-500">You don't have any assigned jobs at the moment. Check back later!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BubblerDashboard; 