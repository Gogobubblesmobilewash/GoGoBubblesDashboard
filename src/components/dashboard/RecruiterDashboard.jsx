import React, { useEffect, useState } from 'react';
import {
  FiUsers,
  FiUserPlus,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiStar,
  FiFileText,
  FiMail,
  FiCalendar,
  FiShield,
  FiAlertCircle,
  FiFilter,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { loading, setLoading } = useStore();
  const { user, isRecruiter } = useAuth();
  
  // Security check - ensure only recruiter users can access this dashboard
  useEffect(() => {
    if (!isRecruiter) {
      console.warn('RecruiterDashboard: Non-recruiter user attempted to access recruiter dashboard');
      navigate('/dashboard');
    }
  }, [isRecruiter, navigate]);
  
  const [applicantData, setApplicantData] = useState({
    totalApplicants: 0,
    newApplicants: 0,
    pendingReview: 0,
    approved: 0,
    declined: 0,
    inOnboarding: 0,
    flagged: 0
  });

  const [recentApplicants, setRecentApplicants] = useState([]);
  const [flaggedApplicants, setFlaggedApplicants] = useState([]);
  const [onboardingQueue, setOnboardingQueue] = useState([]);

  const loadRecruiterData = async () => {
    setLoading(true);
    try {
      // Fetch applicants data
      const { data: applicants, error: applicantsError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (applicantsError) console.warn('Applicants fetch warning:', applicantsError);
      const applicantsArray = Array.isArray(applicants) ? applicants : [];

      // Calculate applicant statistics
      const totalApplicants = applicantsArray.length;
      const newApplicants = applicantsArray.filter(a => a.application_status === 'new').length;
      const pendingReview = applicantsArray.filter(a => a.application_status === 'pending').length;
      const approved = applicantsArray.filter(a => a.application_status === 'approved').length;
      const declined = applicantsArray.filter(a => a.application_status === 'declined').length;
      const inOnboarding = applicantsArray.filter(a => a.application_status === 'onboarding').length;
      const flagged = applicantsArray.filter(a => a.flagged === true).length;

      setApplicantData({
        totalApplicants,
        newApplicants,
        pendingReview,
        approved,
        declined,
        inOnboarding,
        flagged
      });

      // Set recent applicants
      setRecentApplicants(applicantsArray.slice(0, 5));

      // Set flagged applicants
      setFlaggedApplicants(applicantsArray.filter(a => a.flagged === true));

      // Set onboarding queue
      setOnboardingQueue(applicantsArray.filter(a => a.application_status === 'onboarding'));

    } catch (error) {
      console.error('Error loading recruiter data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRecruiter) {
      loadRecruiterData();
    }
  }, [isRecruiter]);

  const StatCard = ({ title, value, icon: Icon, color = 'purple' }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200`}>
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

  const QuickAction = ({ title, description, icon: Icon, onClick, color = 'purple' }) => (
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

  const ApplicantItem = ({ applicant, onClick }) => (
    <div 
      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <FiUsers className="h-5 w-5 text-gray-400" />
        <div>
          <h4 className="font-medium text-gray-900">{`${applicant.first_name} ${applicant.last_name}`}</h4>
          <p className="text-sm text-gray-600">{applicant.email} • {applicant.role_applied_for}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{new Date(applicant.created_at).toLocaleDateString()}</span>
        <span className={`px-2 py-1 text-xs rounded-full ${
          applicant.application_status === 'approved' ? 'bg-green-100 text-green-800' :
          applicant.application_status === 'declined' ? 'bg-red-100 text-red-800' :
          applicant.application_status === 'onboarding' ? 'bg-blue-100 text-blue-800' :
          applicant.application_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {applicant.application_status}
        </span>
        {applicant.flagged && (
          <FiAlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiShield className="h-5 w-5 text-purple-600" />
          <div>
            <h4 className="font-medium text-purple-800">Recruiter Access Level</h4>
            <p className="text-sm text-purple-700">
              You have access to applicant data and recruitment functions only. Job assignments and financial data are restricted.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
          <p className="text-sm text-gray-600">
            Applicant management and recruitment overview - Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadRecruiterData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Applicant Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Applicants"
          value={applicantData.totalApplicants}
          icon={FiUsers}
          color="purple"
        />
        <StatCard
          title="New Applications"
          value={applicantData.newApplicants}
          icon={FiUserPlus}
          color="blue"
        />
        <StatCard
          title="Pending Review"
          value={applicantData.pendingReview}
          icon={FiClock}
          color="yellow"
        />
        <StatCard
          title="Approved"
          value={applicantData.approved}
          icon={FiCheckCircle}
          color="green"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="In Onboarding"
          value={applicantData.inOnboarding}
          icon={FiCalendar}
          color="indigo"
        />
        <StatCard
          title="Declined"
          value={applicantData.declined}
          icon={FiXCircle}
          color="red"
        />
        <StatCard
          title="Flagged"
          value={applicantData.flagged}
          icon={FiAlertCircle}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="Review Applications"
          description="Process new applications"
          icon={FiFileText}
          color="purple"
          onClick={() => navigate('/applicants')}
        />
        <QuickAction
          title="Schedule Interviews"
          description="Set up candidate interviews"
          icon={FiCalendar}
          color="blue"
          onClick={() => alert('Opening interview scheduler...')}
        />
        <QuickAction
          title="Onboarding Queue"
          description="Manage onboarding process"
          icon={FiUsers}
          color="green"
          onClick={() => alert('Opening onboarding queue...')}
        />
        <QuickAction
          title="Flagged Applicants"
          description="Review flagged applications"
          icon={FiAlertCircle}
          color="orange"
          onClick={() => alert('Opening flagged applicants...')}
        />
        <QuickAction
          title="Export Data"
          description="Download applicant reports"
          icon={FiDownload}
          color="indigo"
          onClick={() => alert('Exporting applicant data...')}
        />
        <QuickAction
          title="Send Messages"
          description="Contact applicants"
          icon={FiMail}
          color="purple"
          onClick={() => alert('Opening message center...')}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applicants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentApplicants.length > 0 ? (
              recentApplicants.map((applicant) => (
                <ApplicantItem key={applicant.id} applicant={applicant} onClick={() => navigate(`/applicants/${applicant.id}`)} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent applications</p>
            )}
          </div>
        </div>

        {/* Onboarding Queue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Onboarding Queue</h3>
          </div>
          <div className="p-6 space-y-4">
            {onboardingQueue.length > 0 ? (
              onboardingQueue.map((applicant) => (
                <ApplicantItem key={applicant.id} applicant={applicant} onClick={() => navigate(`/applicants/${applicant.id}`)} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No applicants in onboarding</p>
            )}
          </div>
        </div>
      </div>

      {/* Access Restrictions Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiAlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <h4 className="font-medium text-yellow-800">Recruiter Access Restrictions</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Recruiters have access to applicant data only and cannot view job assignments, revenue, or scheduling information.
            </p>
            <div className="text-xs text-yellow-700 space-y-1">
              <p><strong>❌ Restricted Access:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Job assignments and scheduling</li>
                <li>Revenue and financial data</li>
                <li>Customer information</li>
                <li>Equipment and logistics</li>
                <li>Bubbler management (except applicants)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard; 