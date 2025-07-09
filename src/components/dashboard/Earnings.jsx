import React, { useEffect, useState } from 'react';
import { FiDollarSign, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { useAuth } from '../../store/AuthContext';
import { supabase, getWeeklyPayoutBalance, getPayoutHistory } from '../../services/api';

const Earnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyPayout, setWeeklyPayout] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [earningsBreakdown, setEarningsBreakdown] = useState({
    totalEarnings: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    averagePerJob: 0
  });

  useEffect(() => {
    if (user) {
      loadEarningsData();
    }
  }, [user]);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      // Get bubbler profile
      const { data: profile, error: profileError } = await supabase
        .from('bubblers')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (profileError) throw profileError;

      // Get weekly payout balance
      const weeklyData = await getWeeklyPayoutBalance(profile.id);
      setWeeklyPayout(weeklyData);

      // Get payout history
      const history = await getPayoutHistory(profile.id, 20);
      setPayoutHistory(history);

      // Calculate earnings breakdown
      const { data: allJobs, error: jobsError } = await supabase
        .from('job_assignments')
        .select(`
          *,
          orders!inner(
            service_type,
            tier,
            addons,
            status
          )
        `)
        .eq('bubbler_id', profile.id)
        .eq('orders.status', 'completed');

      if (jobsError) throw jobsError;

      const jobs = allJobs || [];
      const totalEarnings = jobs.reduce((sum, job) => {
        const order = job.orders;
        const payoutRules = getPayoutRules(
          order.service_type,
          order.tier,
          order.addons || []
        );
        return sum + payoutRules.total;
      }, 0);

      // Calculate time-based earnings
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const thisWeekJobs = jobs.filter(job => new Date(job.created_at) >= oneWeekAgo);
      const lastWeekJobs = jobs.filter(job => {
        const jobDate = new Date(job.created_at);
        return jobDate >= twoWeeksAgo && jobDate < oneWeekAgo;
      });
      const thisMonthJobs = jobs.filter(job => new Date(job.created_at) >= oneMonthAgo);

      const thisWeekEarnings = thisWeekJobs.reduce((sum, job) => {
        const order = job.orders;
        const payoutRules = getPayoutRules(
          order.service_type,
          order.tier,
          order.addons || []
        );
        return sum + payoutRules.total;
      }, 0);

      const lastWeekEarnings = lastWeekJobs.reduce((sum, job) => {
        const order = job.orders;
        const payoutRules = getPayoutRules(
          order.service_type,
          order.tier,
          order.addons || []
        );
        return sum + payoutRules.total;
      }, 0);

      const thisMonthEarnings = thisMonthJobs.reduce((sum, job) => {
        const order = job.orders;
        const payoutRules = getPayoutRules(
          order.service_type,
          order.tier,
          order.addons || []
        );
        return sum + payoutRules.total;
      }, 0);

      setEarningsBreakdown({
        totalEarnings,
        thisWeek: thisWeekEarnings,
        lastWeek: lastWeekEarnings,
        thisMonth: thisMonthEarnings,
        averagePerJob: jobs.length > 0 ? totalEarnings / jobs.length : 0
      });

    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPayoutRules = (serviceType, tier, addons = []) => {
    const basePayouts = {
      'Mobile Car Wash': {
        'Express Wash': 12,
        'Signature Shine': 18,
        'Supreme Shine': 25,
        default: 12
      },
      'Home Cleaning': {
        'Refresh Clean': 20,
        'Signature Deep Clean': 30,
        'Supreme Deep Clean': 45,
        default: 20
      },
      'Laundry Service': {
        'Fresh & Fold': 15,
        'Signature Care': 25,
        'Supreme Care': 35,
        default: 15
      }
    };

    const addonPayouts = {
      'Tire Shine': 4,
      'Interior Detail': 8,
      'Premium Detailing': 12,
      'Deep Cleaning': 10,
      'Premium Care': 8,
      'Express Service': 5
    };

    const base = basePayouts[serviceType]?.[tier] || basePayouts[serviceType]?.default || 0;
    const addonTotal = addons.reduce((sum, addon) => sum + (addonPayouts[addon] || 0), 0);

    return {
      total: base + addonTotal,
      base: base,
      addons: addons.map(addon => ({ addon, payout: addonPayouts[addon] || 0 }))
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">My Earnings</h1>
        <p className="text-gray-600">Track your earnings, payouts, and performance</p>
      </div>

      {/* Weekly Payout Balance */}
      {weeklyPayout && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Weekly Payout Balance</h2>
              <p className="text-gray-600 mb-4">
                Week of {formatDate(weeklyPayout.weekStart)} • {weeklyPayout.jobCount} completed jobs
              </p>
              <div className="text-3xl font-bold text-green-600">
                ${weeklyPayout.weeklyPayout.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="bg-green-100 rounded-full p-3">
                <FiDollarSign className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mt-2">Available for payout</p>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiTrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-800">${earningsBreakdown.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <FiCalendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-800">${earningsBreakdown.thisWeek.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FiCalendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-800">${earningsBreakdown.thisMonth.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-xl">
              <FiDollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-gray-600">Avg per Job</p>
              <p className="text-2xl font-bold text-gray-800">${earningsBreakdown.averagePerJob.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Payout History</h2>
          <button className="flex items-center gap-2 text-brand-aqua hover:text-brand-aqua-dark">
            <FiDownload className="h-4 w-4" />
            Export
          </button>
        </div>
        
        {payoutHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jobs</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payoutHistory.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(payout.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      ${parseFloat(payout.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payout.job_ids?.length || 0} jobs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payout History</h3>
            <p className="text-gray-500">Your payout history will appear here once you receive your first payout.</p>
          </div>
        )}
      </div>

      {/* Weekly Breakdown */}
      {weeklyPayout && weeklyPayout.jobBreakdown && weeklyPayout.jobBreakdown.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-6">This Week's Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyPayout.jobBreakdown.map((job) => (
              <div key={job.jobId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-gray-900">{job.serviceType}</div>
                  <span className="text-sm font-semibold text-green-600">${job.payout.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Tier:</span> {job.tier}
                </div>
                {job.addons && job.addons.length > 0 && (
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Addons:</span> {job.addons.join(', ')}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {formatDate(job.completedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings; 