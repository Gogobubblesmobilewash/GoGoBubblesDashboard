import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/api';
import Modal from '../shared/Modal';
import { 
  FiSearch, 
  FiFilter, 
  FiCheckCircle, 
  FiX, 
  FiClock, 
  FiUser, 
  FiMail, 
  FiPhone,
  FiMapPin,
  FiEdit,
  FiEye,
  FiAlertCircle,
  FiCheck,
  FiXCircle,
  FiClock as FiWaitlist
} from 'react-icons/fi';

const Applicants = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(null);

  // Mock data for testing when no applications exist
  const mockApplications = [
    {
      id: 'mock-1',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '555-123-4567',
      address: '123 Main St, Anytown, USA',
      role_applied_for: 'Sparkle',
      application_status: 'pending',
      travel_radius_minutes: 30,
      authorized_to_work: true,
      age_verified: true,
      has_transportation: true,
      primary_language: 'English',
      english_comfort: 'Fluent',
      experience: '2 years cleaning experience',
      availability: 'Weekdays 9AM-5PM',
      created_at: new Date().toISOString(),
      equipment_ready: true,
      disqualified: false,
      disqualification_reason: null
    }
  ];

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [disqualifiedFilter, setDisqualifiedFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    console.log('Applications loaded:', applications.length);
    console.log('Filtered applications:', filteredApplications.length);
    filterApplications();
  }, [applications, searchTerm, roleFilter, statusFilter, equipmentFilter, disqualifiedFilter, languageFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Applications table not available:', error);
        setApplications([]);
        return;
      }

      // Process applications to add computed fields
      const processedApplications = data.map(app => ({
        ...app,
        equipment_ready: calculateEquipmentReady(app),
        disqualified: calculateDisqualified(app),
        disqualification_reason: calculateDisqualificationReason(app)
      }));

      setApplications(processedApplications || []);
    } catch (err) {
      console.warn('Applications not available:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateEquipmentReady = (app) => {
    const role = app.role_applied_for?.toLowerCase();
    
    if (role === 'fresh') return true; // No equipment required for laundry
    
    if (role === 'sparkle') {
      // Must have basic cleaning supplies AND vacuum (or willing to rent)
      const requiredSupplies = [
        app.has_mop, app.has_toilet_brush, app.has_all_purpose_cleaner,
        app.has_glass_cleaner, app.has_bathroom_cleaner, app.has_broom_dustpan
      ];
      const hasClothsOrSponges = app.has_cloths || app.has_sponges;
      const hasVacuumOrWillingToRent = app.has_vacuum || app.willing_to_rent_equipment;
      return requiredSupplies.every(supply => supply) && hasClothsOrSponges && hasVacuumOrWillingToRent;
    }
    
    if (role === 'shine') {
      // Must have basic supplies and either own equipment or willing to rent
      const hasBasicSupplies = app.has_bucket && app.has_towels && app.has_soap;
      const hasEquipment = (app.has_water_supply && app.has_power_supply) || app.willing_to_rent_equipment;
      return hasBasicSupplies && hasEquipment;
    }
    
    return false;
  };

  const calculateDisqualified = (app) => {
    return !app.authorized_to_work || 
           !app.age_verified || 
           !app.has_transportation ||
           (app.role_applied_for?.toLowerCase() === 'sparkle' && app.selected_none_supplies) ||
           (app.role_applied_for?.toLowerCase() === 'sparkle' && 
            !app.has_vacuum && !app.willing_to_rent_equipment) ||
           (app.role_applied_for?.toLowerCase() === 'shine' && 
            !app.has_water_supply && !app.willing_to_rent_equipment &&
            !app.has_power_supply && !app.willing_to_rent_equipment);
  };

  const calculateDisqualificationReason = (app) => {
    if (!app.authorized_to_work) return 'Not authorized to work in the U.S.';
    if (!app.age_verified) return 'Under 18';
    if (!app.has_transportation) return 'No transportation';
    if (app.role_applied_for?.toLowerCase() === 'sparkle' && app.selected_none_supplies) {
      return 'Missing required supplies';
    }
    if (app.role_applied_for?.toLowerCase() === 'sparkle' && 
        !app.has_vacuum && !app.willing_to_rent_equipment) {
      return 'No vacuum and unwilling to rent';
    }
    if (app.role_applied_for?.toLowerCase() === 'shine' && 
        !app.has_water_supply && !app.willing_to_rent_equipment &&
        !app.has_power_supply && !app.willing_to_rent_equipment) {
      return 'Unwilling to rent required equipment';
    }
    return null;
  };

  const filterApplications = () => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.first_name?.toLowerCase().includes(term) ||
        app.last_name?.toLowerCase().includes(term) ||
        app.email?.toLowerCase().includes(term) ||
        app.role_applied_for?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(app => app.role_applied_for?.toLowerCase() === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.application_status === statusFilter);
    }

    // Equipment filter
    if (equipmentFilter !== 'all') {
      filtered = filtered.filter(app => {
        const ready = calculateEquipmentReady(app);
        return equipmentFilter === 'ready' ? ready : !ready;
      });
    }

    // Disqualified filter
    if (disqualifiedFilter !== 'all') {
      filtered = filtered.filter(app => {
        const disqualified = calculateDisqualified(app);
        return disqualifiedFilter === 'disqualified' ? disqualified : !disqualified;
      });
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(app => app.primary_language === languageFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleViewDetails = (application) => {
    console.log('handleViewDetails called with:', application);
    setSelectedApplication(application);
    setShowDetailsModal(true);
    console.log('Modal should now be visible');
    
    // Fallback alert in case modal doesn't show
    setTimeout(() => {
      if (!showDetailsModal) {
        alert(`View Details for ${application.first_name} ${application.last_name}\n\nEmail: ${application.email}\nPhone: ${application.phone}\nRole: ${application.role_applied_for}\nStatus: ${application.application_status}\n\nThis would show detailed application information in a modal.`);
      }
    }, 100);
  };

  const handleApprove = (application) => {
    setSelectedApplication(application);
    setShowApprovalModal(true);
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ application_status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Refresh applications
      await fetchApplications();
      
      alert(`Application ${newStatus} successfully!`);
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Error updating application status: ' + err.message);
    }
  };

  const handleApproveAndOnboard = async () => {
    if (!tempPassword.trim()) {
      alert('Please enter a temporary password');
      return;
    }

    try {
      // Insert into bubblers table
      const role = selectedApplication.role_applied_for?.toUpperCase();
      const bubblerData = {
        name: `${selectedApplication.first_name} ${selectedApplication.last_name}`,
        email: selectedApplication.email,
        phone: selectedApplication.phone,
        address: selectedApplication.address,
        travel_radius_minutes: selectedApplication.travel_radius_minutes,
        role: role,
        is_active: true,
        join_date: new Date().toISOString(),
        last_active: new Date().toISOString(),
        jobs_completed: 0,
        jobs_assigned: 0,
        jobs_cancelled: 0,
        jobs_declined: 0,
        jobs_reassigned: 0,
        total_earnings: 0,
        rating: 0,
        temp_password: tempPassword, // Store temporary password
        password_reset_required: true, // Flag that password reset is required
        onboarding_completed: false
      };

      const { data: newBubbler, error: bubblerError } = await supabase
        .from('bubblers')
        .insert([bubblerData])
        .select()
        .single();

      if (bubblerError) throw bubblerError;

      // Update application status
      const { error: appError } = await supabase
        .from('applications')
        .update({ 
          application_status: 'approved',
          approved_at: new Date().toISOString(),
          bubbler_id: newBubbler.id
        })
        .eq('id', selectedApplication.id);

      if (appError) throw appError;

      // Generate onboarding link
      const onboardingLink = `${window.location.origin}/onboarding/${newBubbler.id}`;

      setShowApprovalModal(false);
      setTempPassword('');
      setSelectedApplication(null);

      // Show success with onboarding link
      alert(`Applicant approved and onboarded successfully!\n\nOnboarding Link: ${onboardingLink}\n\nPlease share this link with the new Bubbler.`);

      // Refresh applications
      await fetchApplications();

    } catch (err) {
      console.error('Error approving and onboarding applicant:', err);
      alert('Error approving applicant: ' + err.message);
    }
  };

  const handleUpdateNotes = async (applicationId, notes) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ admin_notes: notes })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, admin_notes: notes } : app
      ));

      setEditingNotes(null);
      alert('Notes updated successfully!');
    } catch (err) {
      console.error('Error updating notes:', err);
      alert('Error updating notes: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      waitlisted: 'bg-blue-100 text-blue-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getEquipmentBadge = (ready) => {
    return ready 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getDisqualifiedBadge = (disqualified) => {
    return disqualified 
      ? 'bg-red-100 text-red-800' 
      : 'bg-green-100 text-green-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Applicant Management
          </h1>
          <p className="text-gray-600">
            Review and manage bubbler applications
          </p>
          
          {/* Test button to verify eye button functionality */}
          <div className="mt-4 space-x-4">
            <button 
              onClick={() => alert('Eye button test - This confirms the onClick functionality works!')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Test Eye Button Functionality
            </button>
            
            <button 
              onClick={() => {
                const testApp = {
                  id: 'test',
                  first_name: 'Test',
                  last_name: 'User',
                  email: 'test@example.com',
                  phone: '555-1234',
                  role_applied_for: 'Sparkle',
                  application_status: 'pending'
                };
                handleViewDetails(testApp);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test View Details Modal
            </button>
          </div>
        </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="shine">Shine Bubbler</option>
              <option value="sparkle">Sparkle Bubbler</option>
              <option value="fresh">Fresh Bubbler</option>
              <option value="elite">Elite Bubbler</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="waitlisted">Waitlisted</option>
            </select>
          </div>

          {/* Equipment Filter */}
          <div>
            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Equipment</option>
              <option value="ready">Equipment Ready</option>
              <option value="not_ready">Not Ready</option>
            </select>
          </div>

          {/* Disqualified Filter */}
          <div>
            <select
              value={disqualifiedFilter}
              onChange={(e) => setDisqualifiedFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Applicants</option>
              <option value="qualified">Qualified</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Applications ({filteredApplications.length} total)
          </h3>
          {filteredApplications.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              No applications found. This might be because there are no applications in the database.
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Travel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-brand-aqua flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {app.first_name} {app.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{app.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {app.role_applied_for}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(app.application_status)}`}>
                      {app.application_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEquipmentBadge(app.equipment_ready)}`}>
                      {app.equipment_ready ? 'Ready' : 'Not Ready'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {app.travel_radius_minutes} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(app.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(app)}
                        className="text-brand-aqua hover:text-brand-blue"
                        title="View Details"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      {app.application_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(app)}
                            className="text-green-600 hover:text-green-800"
                            title="Approve"
                            disabled={app.disqualified}
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(app.id, 'declined')}
                            className="text-red-600 hover:text-red-800"
                            title="Decline"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(app.id, 'waitlisted')}
                            className="text-blue-600 hover:text-blue-800"
                            title="Waitlist"
                          >
                            <FiWaitlist className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FiUser className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No applications found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Application Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedApplication.first_name} {selectedApplication.last_name}</p>
                  <p><strong>Email:</strong> {selectedApplication.email}</p>
                  <p><strong>Phone:</strong> {selectedApplication.phone}</p>
                  <p><strong>Address:</strong> {selectedApplication.address}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Application Details</h3>
                <div className="space-y-2">
                  <p><strong>Role:</strong> {selectedApplication.role_applied_for}</p>
                  <p><strong>Status:</strong> {selectedApplication.application_status}</p>
                  <p><strong>Applied:</strong> {formatDate(selectedApplication.created_at)}</p>
                  <p><strong>Travel Radius:</strong> {selectedApplication.travel_radius_minutes} minutes</p>
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Qualifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p><strong>Authorized to Work:</strong> 
                    <span className={selectedApplication.authorized_to_work ? 'text-green-600' : 'text-red-600'}>
                      {selectedApplication.authorized_to_work ? ' Yes' : ' No'}
                    </span>
                  </p>
                  <p><strong>Age Verified:</strong> 
                    <span className={selectedApplication.age_verified ? 'text-green-600' : 'text-red-600'}>
                      {selectedApplication.age_verified ? ' Yes' : ' No'}
                    </span>
                  </p>
                  <p><strong>Has Transportation:</strong> 
                    <span className={selectedApplication.has_transportation ? 'text-green-600' : 'text-red-600'}>
                      {selectedApplication.has_transportation ? ' Yes' : ' No'}
                    </span>
                  </p>
                  <p><strong>Equipment Ready:</strong> 
                    <span className={selectedApplication.equipment_ready ? 'text-green-600' : 'text-red-600'}>
                      {selectedApplication.equipment_ready ? ' Yes' : ' No'}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p><strong>Primary Language:</strong> {selectedApplication.primary_language}</p>
                  <p><strong>English Comfort:</strong> {selectedApplication.english_comfort}</p>
                  <p><strong>Experience:</strong> {selectedApplication.experience}</p>
                  <p><strong>Availability:</strong> {selectedApplication.availability}</p>
                </div>
              </div>
            </div>

            {/* Disqualification */}
            {selectedApplication.disqualified && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-800 font-semibold mb-2">Disqualification Reason</h4>
                <p className="text-red-700">{selectedApplication.disqualification_reason}</p>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Admin Notes</h3>
              {editingNotes === selectedApplication.id ? (
                <div className="space-y-2">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Add notes about this applicant..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateNotes(selectedApplication.id, adminNotes)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(null);
                        setAdminNotes(selectedApplication.admin_notes || '');
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedApplication.admin_notes || 'No notes added yet.'}
                  </p>
                  <button
                    onClick={() => {
                      setEditingNotes(selectedApplication.id);
                      setAdminNotes(selectedApplication.admin_notes || '');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <FiEdit className="h-4 w-4 mr-1" />
                    Edit Notes
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedApplication && (
        <Modal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title="Approve and Onboard Applicant"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-semibold mb-2">Confirm Approval</h4>
              <p className="text-blue-700">
                You are about to approve <strong>{selectedApplication.first_name} {selectedApplication.last_name}</strong> 
                as a {selectedApplication.role_applied_for}. This will:
              </p>
              <ul className="text-blue-700 mt-2 list-disc list-inside">
                <li>Add them to the Bubblers table</li>
                <li>Mark their application as approved</li>
                <li>Generate an onboarding link</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporary Password *
              </label>
              <input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Enter temporary password for new Bubbler"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This password will be used for their initial login
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleApproveAndOnboard}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve & Onboard
              </button>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  </div>
  );
};

export default Applicants; 