import React, { useEffect, useState } from 'react';
import {
  FiUsers,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiMessageCircle,
  FiShield,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiStar,
  FiMapPin
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const LeadBubblerDashboard = () => {
  const navigate = useNavigate();
  const { loading, setLoading } = useStore();
  const { user, isLeadBubbler } = useAuth();
  
  // Security check - ensure only lead bubbler users can access this dashboard
  useEffect(() => {
    if (!isLeadBubbler) {
      console.warn('LeadBubblerDashboard: Non-lead bubbler user attempted to access lead bubbler dashboard');
      navigate('/dashboard');
    }
  }, [isLeadBubbler, navigate]);
  
  const [teamData, setTeamData] = useState({
    teamMembers: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    teamRating: 0,
    equipmentIssues: 0,
    teamMessages: 0
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [teamJobs, setTeamJobs] = useState([]);
  const [equipmentStatus, setEquipmentStatus] = useState([]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // Fetch team data (limited to assigned team members)
      // Note: In real implementation, this would filter by team assignment
      
      // Mock team data
      const mockTeamData = {
        teamMembers: 5,
        activeJobs: 8,
        completedJobs: 25,
        pendingJobs: 3,
        teamRating: 4.8,
        equipmentIssues: 2,
        teamMessages: 5
      };

      setTeamData(mockTeamData);

      // Mock team members
      const mockTeamMembers = [
        { id: 1, name: 'John Smith', role: 'Elite Bubbler', status: 'active', jobs_today: 3, rating: 4.9 },
        { id: 2, name: 'Maria Garcia', role: 'Shine Bubbler', status: 'active', jobs_today: 2, rating: 4.7 },
        { id: 3, name: 'David Lee', role: 'Fresh Bubbler', status: 'active', jobs_today: 1, rating: 4.8 },
        { id: 4, name: 'Sarah Johnson', role: 'Sparkle Bubbler', status: 'on_break', jobs_today: 0, rating: 4.6 },
        { id: 5, name: 'Mike Chen', role: 'Elite Bubbler', status: 'active', jobs_today: 2, rating: 4.9 }
      ];
      setTeamMembers(mockTeamMembers);

      // Mock team jobs
      const mockTeamJobs = [
        { id: 1, customer_name: 'Alice Brown', service_type: 'Home Cleaning', assigned_to: 'John Smith', status: 'in_progress', location: 'Houston, TX' },
        { id: 2, customer_name: 'Bob Wilson', service_type: 'Car Wash', assigned_to: 'Maria Garcia', status: 'completed', location: 'Houston, TX' },
        { id: 3, customer_name: 'Carol Davis', service_type: 'Laundry', assigned_to: 'David Lee', status: 'pending', location: 'Houston, TX' }
      ];
      setTeamJobs(mockTeamJobs);

      // Mock equipment status
      const mockEquipment = [
        { id: 1, item: 'Vacuum Cleaner', status: 'available', assigned_to: 'John Smith', condition: 'good' },
        { id: 2, item: 'Car Wash Kit', status: 'in_use', assigned_to: 'Maria Garcia', condition: 'excellent' },
        { id: 3, item: 'Laundry Equipment', status: 'maintenance', assigned_to: 'None', condition: 'needs_repair' }
      ];
      setEquipmentStatus(mockEquipment);

    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLeadBubbler) {
      loadTeamData();
    }
  }, [isLeadBubbler]);

  const StatCard = ({ title, value, icon: Icon, color = 'orange' }) => (
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

  const QuickAction = ({ title, description, icon: Icon, onClick, color = 'orange' }) => (
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

  const TeamMemberItem = ({ member, onClick }) => (
    <div 
      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <FiUsers className="h-5 w-5 text-gray-400" />
        <div>
          <h4 className="font-medium text-gray-900">{member.name}</h4>
          <p className="text-sm text-gray-600">{member.role} • {member.jobs_today} jobs today</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <FiStar className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{member.rating}</span>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          member.status === 'active' ? 'bg-green-100 text-green-800' :
          member.status === 'on_break' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {member.status}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiShield className="h-5 w-5 text-orange-600" />
          <div>
            <h4 className="font-medium text-orange-800">Lead Bubbler Access Level</h4>
            <p className="text-sm text-orange-700">
              You have access to your assigned team only. Financial data and other team information is restricted.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Bubbler Dashboard</h1>
          <p className="text-sm text-gray-600">
            Team management overview - Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadTeamData}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Team Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Team Members"
          value={teamData.teamMembers}
          icon={FiUsers}
          color="orange"
        />
        <StatCard
          title="Active Jobs"
          value={teamData.activeJobs}
          icon={FiBriefcase}
          color="blue"
        />
        <StatCard
          title="Completed Jobs"
          value={teamData.completedJobs}
          icon={FiCheckCircle}
          color="green"
        />
        <StatCard
          title="Team Rating"
          value={teamData.teamRating}
          icon={FiStar}
          color="yellow"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pending Jobs"
          value={teamData.pendingJobs}
          icon={FiClock}
          color="purple"
        />
        <StatCard
          title="Equipment Issues"
          value={teamData.equipmentIssues}
          icon={FiAlertCircle}
          color="red"
        />
        <StatCard
          title="Team Messages"
          value={teamData.teamMessages}
          icon={FiMessageCircle}
          color="indigo"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="Reassign Jobs"
          description="Help reassign missed jobs"
          icon={FiBriefcase}
          color="orange"
          onClick={() => alert('Opening job reassignment...')}
        />
        <QuickAction
          title="View Team Logs"
          description="Check team member activity"
          icon={FiUsers}
          color="blue"
          onClick={() => alert('Opening team logs...')}
        />
        <QuickAction
          title="Check Equipment"
          description="Monitor equipment status"
          icon={FiBriefcase}
          color="green"
          onClick={() => alert('Opening equipment status...')}
        />
        <QuickAction
          title="Message Team"
          description="Contact team members"
          icon={FiMessageCircle}
          color="purple"
          onClick={() => navigate('/messages')}
        />
        <QuickAction
          title="Team Performance"
          description="View team metrics"
          icon={FiStar}
          color="yellow"
          onClick={() => alert('Opening team performance...')}
        />
        <QuickAction
          title="Report Issues"
          description="Flag team problems"
          icon={FiAlertCircle}
          color="red"
          onClick={() => alert('Opening issue reporting...')}
        />
      </div>

      {/* Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          </div>
          <div className="p-6 space-y-4">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <TeamMemberItem key={member.id} member={member} onClick={() => alert(`Opening ${member.name}'s profile...`)} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No team members</p>
            )}
          </div>
        </div>

        {/* Equipment Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Equipment Status</h3>
          </div>
          <div className="p-6 space-y-4">
            {equipmentStatus.length > 0 ? (
              equipmentStatus.map((equipment) => (
                <div key={equipment.id} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{equipment.item}</h4>
                    <p className="text-sm text-gray-600">Assigned to: {equipment.assigned_to}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      equipment.status === 'available' ? 'bg-green-100 text-green-800' :
                      equipment.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                      equipment.status === 'maintenance' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {equipment.status}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      equipment.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                      equipment.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {equipment.condition}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No equipment data</p>
            )}
          </div>
        </div>
      </div>

      {/* Access Restrictions Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FiAlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <h4 className="font-medium text-yellow-800">Lead Bubbler Access Restrictions</h4>
            <p className="text-sm text-yellow-700 mb-2">
              Lead bubblers have access to their assigned team only and cannot view financial data or other team information.
            </p>
            <div className="text-xs text-yellow-700 space-y-1">
              <p><strong>❌ Restricted Access:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Financial data and payouts</li>
                <li>Other team information</li>
                <li>Revenue and business metrics</li>
                <li>Admin-level data</li>
                <li>Other bubbler payouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadBubblerDashboard; 