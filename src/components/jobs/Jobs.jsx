import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiCamera, FiUpload, FiDownload } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { 
  JOB_STATUSES, 
  SERVICE_TYPES, 
  TIERS, 
  ADDONS, 
  BAG_TYPES,
  getPhotoRequirements, 
  getPerks, 
  getPayoutRules
} from '../../constants';
import QRScanner from './QRScanner';
import Modal from '../shared/Modal';

const Jobs = () => {
  const { user, isAdmin } = useStore();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedJobForPhoto, setSelectedJobForPhoto] = useState(null);
  const [photoUploadMode, setPhotoUploadMode] = useState('before');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [jobToDecline, setJobToDecline] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(12); // Pagination

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      setFilteredJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadQRScanData = async () => {
    // Load QR scan data if needed
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customerAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.jobStatus === statusFilter);
    }

    // Apply service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(job => job.serviceType === serviceFilter);
    }

    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    loadQRScanData();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter, serviceFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQRScan = (decodedText) => {
    try {
      const jobData = JSON.parse(decodedText);
      const job = jobs.find(j => j.jobId === jobData.jobId);
      
      if (job) {
        setSelectedJob(job);
        setShowPhotoModal(true);
      } else {
        toast.error('Job not found');
      }
    } catch {
      toast.error('Invalid QR code');
    }
  };

  const handlePhotoUpload = async (jobId, photoData) => {
    const uploadPromise = new Promise((resolve, reject) => {
      (async () => {
        try {
          // Upload photo to Supabase Storage
          const fileName = `${jobId}_${Date.now()}.jpg`;
          const { error } = await supabase.storage
            .from('job-photos')
            .upload(fileName, photoData);

          if (error) throw error;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('job-photos')
            .getPublicUrl(fileName);

          // Update job with photo URL
          const { error: updateError } = await supabase
            .from('job_assignments')
            .update({ 
              photoUploadLink: urlData.publicUrl,
              timestampCompleted: new Date().toISOString()
            })
            .eq('id', jobId);

          if (updateError) throw updateError;

          // Reload jobs
        await loadJobs();
          setShowPhotoModal(false);
          setSelectedJob(null);
          resolve();
    } catch (error) {
          console.error('Error uploading photo:', error);
          reject(error);
        }
      })();
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading photo...',
      success: 'Photo uploaded successfully!',
      error: 'Failed to upload photo'
    });
  };

  const handleLaundryPhotoUpload = async (jobId, photoData, mode) => {
    const uploadPromise = new Promise((resolve, reject) => {
      (async () => {
        try {
          const fileName = `${jobId}_${mode}_${Date.now()}.jpg`;
          const { error } = await supabase.storage
            .from('laundry-photos')
            .upload(fileName, photoData);

          if (error) throw error;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('laundry-photos')
            .getPublicUrl(fileName);

          // Update job with photo URL based on mode
          const updateData = mode === 'before' 
            ? { beforePhotoLink: urlData.publicUrl }
            : { afterPhotoLink: urlData.publicUrl };

          const { error: updateError } = await supabase
            .from('job_assignments')
            .update(updateData)
            .eq('id', jobId);

          if (updateError) throw updateError;

        await loadJobs();
          setShowPhotoUploadModal(false);
          setSelectedJobForPhoto(null);
          resolve();
    } catch (error) {
          console.error('Error uploading laundry photo:', error);
          reject(error);
        }
      })();
    });

    toast.promise(uploadPromise, {
      loading: `Uploading ${mode} photo...`,
      success: `${mode.charAt(0).toUpperCase() + mode.slice(1)} photo uploaded successfully!`,
      error: `Failed to upload ${mode} photo`
    });
  };



  const handleEditJob = (job) => {
    setEditingJob({ ...job });
    setShowEditModal(true);
  };

  const handleSaveJob = async () => {
    if (!editingJob) return;

    const savePromise = new Promise((resolve, reject) => {
      (async () => {
        try {
          if (editingJob.id) {
            // Update existing job
            const { error } = await supabase
              .from('job_assignments')
              .update({
                customerName: editingJob.customerName,
                customerAddress: editingJob.customerAddress,
                customerPhone: editingJob.customerPhone,
                customerEmail: editingJob.customerEmail,
                serviceType: editingJob.serviceType,
                tier: editingJob.tier,
                addons: editingJob.addons,
                scheduledDateTime: editingJob.scheduledDateTime,
                earningsEstimate: editingJob.earningsEstimate,
                updated_at: new Date().toISOString()
              })
              .eq('id', editingJob.id);

            if (error) throw error;
      } else {
            // Create new job
            const { error } = await supabase
              .from('job_assignments')
              .insert([editingJob]);

            if (error) throw error;
          }

        await loadJobs();
          setShowEditModal(false);
          setEditingJob(null);
          resolve();
    } catch (error) {
          console.error('Error saving job:', error);
          reject(error);
        }
      })();
    });

    toast.promise(savePromise, {
      loading: 'Saving job...',
      success: 'Job saved successfully!',
      error: 'Failed to save job'
    });
  };

  const handleDeclineJob = (job) => {
    setJobToDecline(job);
    setShowDeclineModal(true);
  };

  const confirmDeclineJob = async () => {
    if (!jobToDecline) return;

    const declinePromise = new Promise((resolve, reject) => {
      (async () => {
        try {
          const { error } = await supabase
            .from('job_assignments')
            .update({ 
              jobStatus: 'declined',
              declinedAt: new Date().toISOString(),
              declinedBy: user?.email || 'Unknown'
            })
            .eq('id', jobToDecline.id);

          if (error) throw error;
        await loadJobs();
          setShowDeclineModal(false);
          setJobToDecline(null);
          resolve();
    } catch (error) {
          console.error('Error declining job:', error);
          reject(error);
        }
      })();
    });

    toast.promise(declinePromise, {
      loading: 'Declining job...',
      success: 'Job declined successfully!',
      error: 'Failed to decline job'
    });
  };

  // Pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getPhotoRequirementsForJob = (job) => {
    const serviceType = job.serviceType;
    const tier = job.tier || '';
    const addons = job.addons ? job.addons.split(',').map(a => a.trim()) : [];
    
    return getPhotoRequirements(serviceType, tier, addons);
  };

  getPhotoRequirementsForJob.propTypes = {
    job: PropTypes.shape({
      serviceType: PropTypes.string.isRequired,
      tier: PropTypes.string,
      addons: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ])
    }).isRequired
  };

  const getPerksForJob = (job) => {
    const serviceType = job.serviceType;
    const tier = job.tier || '';
    const isFirstTime = job.isFirstTime || false;
    const refreshCleanCount = job.refreshCleanCount || 0;
    
    return getPerks(serviceType, tier, isFirstTime, refreshCleanCount);
  };

  getPerksForJob.propTypes = {
    job: PropTypes.shape({
      serviceType: PropTypes.string.isRequired,
      tier: PropTypes.string,
      isFirstTime: PropTypes.bool,
      refreshCleanCount: PropTypes.number
    }).isRequired
  };

  const getPayoutForJob = (job) => {
    const serviceType = job.serviceType;
    const tier = job.tier || '';
    const addons = job.addons ? job.addons.split(',').map(a => a.trim()) : [];
    
    return getPayoutRules(serviceType, tier, addons);
  };

  getPayoutForJob.propTypes = {
    job: PropTypes.shape({
      serviceType: PropTypes.string.isRequired,
      tier: PropTypes.string,
      addons: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ])
    }).isRequired
  };

  const JobCard = ({ job }) => {
    const photoRequirements = getPhotoRequirementsForJob(job);
    const perks = getPerksForJob(job);
    const payout = getPayoutForJob(job);
    const isActiveJob = job.jobStatus === 'assigned' || job.jobStatus === 'in-progress';
    
    return (
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{job.customerName}</h3>
            <p className="text-sm text-gray-600">{job.customerAddress}</p>
            <p className="text-xs text-gray-500">Job ID: {job.jobId}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            job.jobStatus === 'completed' ? 'bg-green-100 text-green-800' :
            job.jobStatus === 'in-progress' ? 'bg-blue-100 text-blue-800' :
            job.jobStatus === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
            job.jobStatus === 'declined' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {job.jobStatus.replace('-', ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-900">{job.serviceType}</p>
            {job.tier && <p className="text-sm text-gray-600">Tier: {job.tier}</p>}
              </div>
            
            {job.addons && job.addons.length > 0 && (
            <div>
              <p className="text-sm text-gray-600">Add-ons: {job.addons}</p>
            </div>
            )}
            
          {job.bubblerAssigned && (
            <div>
              <p className="text-sm text-gray-600">Assigned to: {job.bubblerAssigned}</p>
              </div>
            )}
            
          {job.scheduledDateTime && (
            <div>
              <p className="text-sm text-gray-600">Scheduled: {job.scheduledDateTime}</p>
              </div>
            )}

          {job.earningsEstimate && (
            <div>
              <p className="text-sm font-medium text-green-600">Est. Earnings: ${job.earningsEstimate}</p>
              </div>
            )}
        </div>

        {/* Perks Display (only for Bubblers) */}
        {!isAdmin && perks && perks.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 mb-2">Perks:</p>
            <div className="flex flex-wrap gap-1">
              {perks.map((perk) => (
                <span key={`perk-${perk}`} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
        {/* Payout Rules (only for Bubblers in expanded view) */}
        {!isAdmin && payout && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">Payout Structure:</p>
            <div className="text-sm text-green-800">
              <p>Base: ${payout.base}</p>
              {payout.addons && payout.addons.length > 0 && (
                <p>Add-ons: ${payout.addons.join(', ')}</p>
              )}
              <p className="font-medium">Total: ${payout.total}</p>
          </div>
          </div>
          )}
          
        {/* Photo Requirements */}
        {photoRequirements && photoRequirements.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Photo Requirements:</p>
            <div className="flex flex-wrap gap-1">
              {photoRequirements.map((req) => (
                <span key={`req-${req}`} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {req}
                </span>
              ))}
            </div>
            </div>
          )}
          
        {/* Action Buttons */}
          <div className="flex space-x-2">
          {isActiveJob && (
              <button 
              onClick={() => {
                setSelectedJob(job);
                setShowPhotoModal(true);
              }}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <FiCamera className="mr-1" />
              Upload Photo
              </button>
            )}
            
          {job.serviceType === 'Laundry Service' && isActiveJob && (
                <button 
              onClick={() => {
                setSelectedJobForPhoto(job);
                setPhotoUploadMode('before');
                setShowPhotoUploadModal(true);
              }}
              className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Before Photo
                </button>
          )}

          {job.serviceType === 'Laundry Service' && isActiveJob && (
              <button 
              onClick={() => {
                setSelectedJobForPhoto(job);
                setPhotoUploadMode('after');
                setShowPhotoUploadModal(true);
              }}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              After Photo
              </button>
            )}
            
            {isAdmin && (
              <>
                <button 
                  onClick={() => handleEditJob(job)} 
                className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
                >
                Edit
                </button>
                <button 
                onClick={() => handleDeclineJob(job)}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                Decline
                </button>
              </>
          )}
        </div>
      </div>
    );
  };

  JobCard.propTypes = {
    job: PropTypes.shape({
      addons: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ]),
      bagTypes: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ]),
      bubblerAssigned: PropTypes.string,
      customerAddress: PropTypes.string,
      customerEmail: PropTypes.string,
      customerName: PropTypes.string,
      customerPhone: PropTypes.string,
      deliveryRequired: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.bool
      ]),
      earningsEstimate: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      includedPerks: PropTypes.string,
      isFirstTime: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.bool
      ]),
      jobId: PropTypes.string,
      jobStatus: PropTypes.string,
      orderId: PropTypes.string,
      photoUploadLink: PropTypes.string,
      refreshCleanCount: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
      scheduledDateTime: PropTypes.string,
      serviceType: PropTypes.string,
      tier: PropTypes.string,
      timestampCompleted: PropTypes.string
    }).isRequired
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
        </div>
            ))}
          </div>
                </div>
              </div>
            );
  }
          
            return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
        <div className="flex space-x-2">
            <button 
            onClick={() => setShowQRScanner(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
            <FiCamera className="mr-2" />
            Scan QR
            </button>
          {isAdmin && (
            <button 
              onClick={() => handleEditJob({})}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <FiPlus className="mr-2" />
              New Job
            </button>
          )}
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {JOB_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace('-', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Services</option>
              {SERVICE_TYPES.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid with Pagination */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {currentJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mb-6">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`px-3 py-2 border rounded-md ${
                currentPage === number
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No jobs found matching your criteria.</p>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <Modal title="Scan QR Code" onClose={() => setShowQRScanner(false)}>
          <QRScanner
            onScanSuccess={handleQRScan}
            onScanError={(error) => console.error('QR Scan error:', error)}
            onClose={() => setShowQRScanner(false)}
          />
        </Modal>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && selectedJob && (
        <PhotoUploadModal 
          job={selectedJob}
          onUpload={handlePhotoUpload}
          onClose={() => { setShowPhotoModal(false); setSelectedJob(null); }}
        />
      )}

      {/* Laundry Photo Upload Modal */}
      {showPhotoUploadModal && selectedJobForPhoto && (
        <LaundryPhotoUploadModal 
          job={selectedJobForPhoto}
          mode={photoUploadMode}
          onUpload={handleLaundryPhotoUpload}
          onClose={() => { setShowPhotoUploadModal(false); setSelectedJobForPhoto(null); }}
        />
      )}

      {/* Job Edit Modal */}
      {showEditModal && editingJob && (
        <JobEditModal
          job={editingJob}
          onSave={handleSaveJob}
          onClose={() => { setShowEditModal(false); setEditingJob(null); }}
        />
      )}

      {/* Decline Confirmation Modal */}
      {showDeclineModal && jobToDecline && (
        <Modal title="Confirm Job Decline" onClose={() => { setShowDeclineModal(false); setJobToDecline(null); }}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Decline Job</h3>
              <p className="text-red-800"><strong>Customer:</strong> {jobToDecline.customerName}</p>
              <p className="text-red-800"><strong>Job ID:</strong> {jobToDecline.jobId}</p>
              <p className="text-red-800"><strong>Service:</strong> {jobToDecline.serviceType}</p>
            </div>
            
            <p className="text-gray-600">Are you sure you want to decline this job? This action cannot be undone.</p>
            
            <div className="flex space-x-2 pt-4">
              <button 
                onClick={confirmDeclineJob}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Confirm Decline
              </button>
              <button 
                onClick={() => { setShowDeclineModal(false); setJobToDecline(null); }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Photo Upload Modal Component
const PhotoUploadModal = ({ job, onUpload, onClose }) => (
  <Modal title={`Upload Photo for ${job.customerName}`} onClose={onClose}>
          <div className="space-y-4">
      <p className="text-gray-600">Upload a photo for job completion verification.</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            onUpload(job.id, file);
          }
        }}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
          </div>
        </Modal>
);

PhotoUploadModal.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    customerName: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired
};

// Laundry Photo Upload Modal Component
const LaundryPhotoUploadModal = ({ job, mode, onUpload, onClose }) => (
  <Modal title={`Upload ${mode.charAt(0).toUpperCase() + mode.slice(1)} Photo for ${job.customerName}`} onClose={onClose}>
          <div className="space-y-4">
      <p className="text-gray-600">Upload a {mode} photo for laundry service verification.</p>
              <input
                type="file"
                accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            onUpload(job.id, file, mode);
          }
        }}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
          </div>
        </Modal>
);

LaundryPhotoUploadModal.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    customerName: PropTypes.string.isRequired
  }).isRequired,
  mode: PropTypes.oneOf(['before', 'after']).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired
};

// Job Edit Modal Component
const JobEditModal = ({ job, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    customerName: job.customerName || '',
    customerAddress: job.customerAddress || '',
    customerPhone: job.customerPhone || '',
    customerEmail: job.customerEmail || '',
    serviceType: job.serviceType || '',
    tier: job.tier || '',
    addons: job.addons || '',
    scheduledDateTime: job.scheduledDateTime || '',
    earningsEstimate: job.earningsEstimate || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...job, ...formData });
  };

  return (
    <Modal title={job.id ? "Edit Job" : "Create New Job"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
            </div>
            
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
            <input
              type="text"
              name="customerAddress"
              value={formData.customerAddress}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
              </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            </div>
            
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Service</option>
              {SERVICE_TYPES.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            </div>
            
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
            <select
              name="tier"
              value={formData.tier}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Tier</option>
              {TIERS.map(tier => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
            </div>
            
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add-ons</label>
            <input
              type="text"
              name="addons"
              value={formData.addons}
              onChange={handleChange}
              placeholder="Comma-separated add-ons"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date/Time</label>
            <input
              type="datetime-local"
              name="scheduledDateTime"
              value={formData.scheduledDateTime}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            </div>
            
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Earnings</label>
              <input
              type="number"
              name="earningsEstimate"
              value={formData.earningsEstimate}
              onChange={handleChange}
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            {job.id ? 'Update Job' : 'Create Job'}
          </button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Cancel
          </button>
            </div>
      </form>
        </Modal>
  );
};

JobEditModal.propTypes = {
  job: PropTypes.shape({
    addons: PropTypes.string,
    customerAddress: PropTypes.string,
    customerEmail: PropTypes.string,
    customerName: PropTypes.string,
    customerPhone: PropTypes.string,
    earningsEstimate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    scheduledDateTime: PropTypes.string,
    serviceType: PropTypes.string,
    tier: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default Jobs;