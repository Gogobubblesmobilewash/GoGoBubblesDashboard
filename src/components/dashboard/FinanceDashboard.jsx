import React, { useEffect, useState } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiBarChart3,
  FiFileText,
  FiCreditCard,
  FiUsers,
  FiCalendar,
  FiShield,
  FiAlertCircle
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { loading, setLoading } = useStore();
  const { user, isFinance } = useAuth();
  
  // Security check - ensure only finance users can access this dashboard
  useEffect(() => {
    if (!isFinance) {
      console.warn('FinanceDashboard: Non-finance user attempted to access finance dashboard');
      navigate('/dashboard');
    }
  }, [isFinance, navigate]);
  
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    totalDeposits: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    stripeRevenue: 0,
    taxableSales: 0,
    processingFees: 0,
    netRevenue: 0
  });

  const [recentPayouts, setRecentPayouts] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [stripeReports, setStripeReports] = useState([]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      // Fetch financial data (revenue, deposits, payouts)
      // Note: This would connect to actual financial data sources
      // For now, using mock data structure
      
      // Mock financial data - in real implementation, this would come from Stripe, bank APIs, etc.
      const mockFinanceData = {
        totalRevenue: 125000,
        totalDeposits: 15000,
        totalPayouts: 85000,
        pendingPayouts: 5000,
        stripeRevenue: 120000,
        taxableSales: 118000,
        processingFees: 2000,
        netRevenue: 123000
      };

      setFinanceData(mockFinanceData);

      // Mock recent payouts
      const mockPayouts = [
        { id: 1, bubbler_name: 'John Doe', amount: 1250, status: 'completed', date: '2024-01-15' },
        { id: 2, bubbler_name: 'Jane Smith', amount: 980, status: 'pending', date: '2024-01-14' },
        { id: 3, bubbler_name: 'Mike Johnson', amount: 1450, status: 'completed', date: '2024-01-13' }
      ];
      setRecentPayouts(mockPayouts);

      // Mock revenue trends
      const mockTrends = [
        { month: 'Jan', revenue: 25000, payouts: 18000 },
        { month: 'Feb', revenue: 28000, payouts: 20000 },
        { month: 'Mar', revenue: 32000, payouts: 22000 }
      ];
      setRevenueTrends(mockTrends);

      // Mock Stripe reports
      const mockStripeReports = [
        { id: 1, report_type: 'Daily Revenue', amount: 4200, date: '2024-01-15', status: 'completed' },
        { id: 2, report_type: 'Weekly Payouts', amount: 8500, date: '2024-01-14', status: 'completed' },
        { id: 3, report_type: 'Monthly Summary', amount: 125000, date: '2024-01-13', status: 'processing' }
      ];
      setStripeReports(mockStripeReports);

    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFinance) {
      loadFinanceData();
    }
  }, [isFinance]);

  const StatCard = ({ title, value, icon: Icon, color = 'green', format = 'currency' }) => {
    const formatValue = (val) => {
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      }
      return val;
    };

    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200`}>
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

  const QuickAction = ({ title, description, icon: Icon, onClick, color = 'green' }) => (
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

  const ReportItem = ({ report, onClick }) => (
    <div 
      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <FiFileText className="h-5 w-5 text-gray-400" />
        <div>
          <h4 className="font-medium text-gray-900">{report.report_type}</h4>
          <p className="text-sm text-gray-600">{report.date}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-900">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(report.amount)}
        </span>
        <span className={`px-2 py-1 text-xs rounded-full ${
          report.status === 'completed' ? 'bg-green-100 text-green-800' :
          report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {report.status}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiShield className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="font-medium text-green-800">Finance Access Level</h4>
            <p className="text-sm text-green-700">
              You have access to financial data and reports only. Job assignments and customer data are restricted.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-sm text-gray-600">
            Financial overview and reporting - Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadFinanceData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={financeData.totalRevenue}
          icon={FiTrendingUp}
          color="green"
        />
        <StatCard
          title="Total Deposits"
          value={financeData.totalDeposits}
          icon={FiDollarSign}
          color="blue"
        />
        <StatCard
          title="Total Payouts"
          value={financeData.totalPayouts}
          icon={FiUsers}
          color="purple"
        />
        <StatCard
          title="Pending Payouts"
          value={financeData.pendingPayouts}
          icon={FiCalendar}
          color="yellow"
        />
      </div>

      {/* Additional Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Stripe Revenue"
          value={financeData.stripeRevenue}
          icon={FiCreditCard}
          color="indigo"
        />
        <StatCard
          title="Taxable Sales"
          value={financeData.taxableSales}
          icon={FiBarChart3}
          color="orange"
        />
        <StatCard
          title="Processing Fees"
          value={financeData.processingFees}
          icon={FiFileText}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="Export Revenue Report"
          description="Download CSV of revenue data"
          icon={FiDownload}
          color="green"
          onClick={() => alert('Exporting revenue report...')}
        />
        <QuickAction
          title="View Stripe Reports"
          description="Access Stripe dashboard"
          icon={FiCreditCard}
          color="indigo"
          onClick={() => alert('Opening Stripe dashboard...')}
        />
        <QuickAction
          title="Generate Tax Report"
          description="Create tax summary report"
          icon={FiFileText}
          color="orange"
          onClick={() => alert('Generating tax report...')}
        />
        <QuickAction
          title="Payout Summary"
          description="View all bubbler payouts"
          icon={FiUsers}
          color="purple"
          onClick={() => alert('Opening payout summary...')}
        />
        <QuickAction
          title="Financial Analytics"
          description="View detailed financial metrics"
          icon={FiBarChart3}
          color="blue"
          onClick={() => alert('Opening financial analytics...')}
        />
        <QuickAction
          title="Export All Data"
          description="Download complete financial data"
          icon={FiDownload}
          color="green"
          onClick={() => alert('Exporting all financial data...')}
        />
      </div>

      {/* Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payouts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payouts</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentPayouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{payout.bubbler_name}</h4>
                  <p className="text-sm text-gray-600">{payout.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payout.amount)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    payout.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payout.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stripe Reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Stripe Reports</h3>
          </div>
          <div className="p-6 space-y-4">
            {stripeReports.map((report) => (
              <ReportItem key={report.id} report={report} onClick={() => alert(`Opening ${report.report_type}...`)} />
            ))}
          </div>
        </div>
      </div>

      {/* Access Restrictions Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiAlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <h4 className="font-medium text-yellow-800">Finance Access Restrictions</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Finance users have view-only access to financial data and cannot modify job assignments or customer information.
            </p>
            <div className="text-xs text-yellow-700 space-y-1">
              <p><strong>❌ Restricted Access:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Job assignments and scheduling</li>
                <li>Customer contact information</li>
                <li>Bubbler management</li>
                <li>Equipment and logistics</li>
                <li>Applicant screening</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard; 