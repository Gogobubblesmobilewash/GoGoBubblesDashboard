import React, { useState, useEffect } from 'react';
import {
  FiCalendar as Calendar,
  FiClock as Clock,
  FiMapPin as MapPin,
  FiDollarSign as DollarSign,
  FiCamera as Camera,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiPlay as Play,
  FiAlertCircle as AlertCircle,
  FiSearch as Search,
  FiPlus as Plus,
  FiEdit as Edit,
  FiTrash2 as Trash2,
  FiUpload as Upload,
  FiUsers as Users,
  FiUserCheck as UserCheck,
  FiUserX as UserX,
  FiWifi as Wifi,
  FiExternalLink as ExternalLink,
  FiGift as Gift,
  FiBox as Car,
  FiHome as Home,
  FiPackage as Package,
  FiCpu as QrCode,
  FiCheckSquare as CheckSquare
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import Modal from '../shared/Modal';
import QRScanner from './QRScanner';
import { 
  jobsAPI, 
  qrAPI,
  getPhotoRequirements, 
  getPerks, 
  SERVICE_CONFIG,
  generateJobId,
  mockData
} from '../../services/api';

const Jobs = () => {
  const { user, isAdmin, jobs, setJobs, loading, setLoading } = useStore();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    serviceType: 'all',
    search: ''
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  
  // Job assignment states
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedJobForAssignment, setSelectedJobForAssignment] = useState(null);
  const [availableBubblers, setAvailableBubblers] = useState([]);
  const [error, setError] = useState(null);

  // QR Scanning states for laundry
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScanMode, setQrScanMode] = useState(null); // 'pickup' or 'delivery'
  const [selectedJobForQR, setSelectedJobForQR] = useState(null);
  const [scannedBags, setScannedBags] = useState({});

  // Photo upload states for laundry
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [photoUploadMode, setPhotoUploadMode] = useState(null); // 'pickup' or 'delivery'
  const [selectedJobForPhoto, setSelectedJobForPhoto] = useState(null);

  useEffect(() => {
    loadJobs();
    if (isAdmin) {
      loadAvailableBubblers();
    }
  }, [isAdmin]);

  // Load QR scan data for existing jobs
  useEffect(() => {
    if (jobs.length > 0 && !isAdmin) {
      loadQRScanData();
    }
  }, [jobs, isAdmin]);

  const loadQRScanData = async () => {
    try {
      // Load QR scan data for the current user's jobs
      const response = await qrAPI.getScansByBubbler(user?.email);
      
      if (response.success && response.data) {
        // Group scans by job ID and scan type
        const groupedScans = {};
        response.data.forEach(scan => {
          if (!groupedScans[scan.jobId]) {
            groupedScans[scan.jobId] = { pickup: [], delivery: [] };
          }
          if (scan.scanType === 'pickup' || scan.scanType === 'delivery') {
            groupedScans[scan.jobId][scan.scanType].push(scan);
          }
        });
        
        setScannedBags(groupedScans);
      }
    } catch (error) {
      console.error('Error loading QR scan data:', error);
      // Don't show error to user as this is not critical
    }
  };

  useEffect(() => {
    filterJobs();
  }, [jobs, filters]);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading jobs from Jobs sheet...');
      let data;
      if (isAdmin) {
        // Admin sees all jobs
        data = await jobsAPI.getAllJobs();
      } else {
        // Bubblers only see their assigned jobs
        data = await jobsAPI.getJobsByBubbler(user?.email);
        
        // Apply data protection: remove sensitive info from completed jobs
        data = applyDataProtection(data);
      }
      setJobs(data);
      console.log('✅ Jobs loaded successfully:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading jobs:', error);
      setError('Error loading jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Data protection function to remove sensitive customer information
  const applyDataProtection = (jobsData) => {
    if (!jobsData || !Array.isArray(jobsData)) return jobsData;
    
    return jobsData.map(job => {
      // Define statuses that should have customer data protected
      const protectedStatuses = ['Completed', 'Cancelled', 'Declined'];
      const isReassigned = job.jobStatus === 'Assigned' && job.bubblerAssigned !== user?.email;
      
      // If job is in a protected status or reassigned to someone else, remove sensitive customer information
      if (protectedStatuses.includes(job.jobStatus) || isReassigned) {
        return {
          ...job,
          customerName: '*** PROTECTED ***',
          customerAddress: '*** PROTECTED ***',
          customerPhone: '*** PROTECTED ***',
          customerEmail: '*** PROTECTED ***',
          notes: job.notes ? '*** PROTECTED ***' : '',
          // Keep job metadata for statistics
          jobId: job.jobId,
          orderId: job.orderId,
          serviceType: job.serviceType,
          jobStatus: job.jobStatus,
          bubblerAssigned: job.bubblerAssigned,
          scheduledDateTime: job.scheduledDateTime,
          timestampCompleted: job.timestampCompleted,
          // Keep earnings information
          earningsEstimate: job.earningsEstimate,
          // Keep service details for reference
          tier: job.tier,
          addons: job.addons,
          bagTypes: job.bagTypes,
          // Keep photo links for audit purposes
          photoLink: job.photoLink,
          photoLinkPickup: job.photoLinkPickup,
          photoLinkDelivery: job.photoLinkDelivery
        };
      }
      return job;
    });
  };

  // Get completion statistics for bubblers
  const getCompletionStats = () => {
    const completedJobs = jobs.filter(job => job.jobStatus === 'Completed');
    const cancelledJobs = jobs.filter(job => job.jobStatus === 'Cancelled');
    const declinedJobs = jobs.filter(job => job.jobStatus === 'Declined');
    const reassignedJobs = jobs.filter(job => job.jobStatus === 'Assigned' && job.bubblerAssigned !== user?.email);
    
    const totalCompleted = completedJobs.length;
    const totalCancelled = cancelledJobs.length;
    const totalDeclined = declinedJobs.length;
    const totalReassigned = reassignedJobs.length;
    
    // Calculate earnings from completed jobs only
    const totalEarnings = completedJobs.reduce((sum, job) => {
      return sum + (parseFloat(job.earningsEstimate) || 0);
    }, 0);
    
    // Group by service type for completed jobs
    const serviceStats = completedJobs.reduce((stats, job) => {
      const serviceType = job.serviceType || 'Unknown';
      stats[serviceType] = (stats[serviceType] || 0) + 1;
      return stats;
    }, {});
    
    return {
      totalCompleted,
      totalCancelled,
      totalDeclined,
      totalReassigned,
      totalEarnings: totalEarnings.toFixed(2),
      serviceStats
    };
  };

  const loadAvailableBubblers = async (serviceType = null) => {
    // Use mockData.users and filter by permissions if serviceType is provided
    let bubblers = mockData.users.filter(u => u.role === 'bubbler');
    if (serviceType) {
      bubblers = bubblers.filter(b => b.permissions && b.permissions.includes(serviceType));
    }
    setAvailableBubblers(bubblers.map(b => ({ email: b.email, name: b.name, permissions: b.permissions })));
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (filters.status !== 'all') {
      filtered = filtered.filter(job => job.jobStatus === filters.status);
    }
    if (filters.serviceType !== 'all') {
      filtered = filtered.filter(job => job.serviceType === filters.serviceType);
    }
    if (filters.search) {
      filtered = filtered.filter(job =>
        job.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.customerAddress.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.serviceType.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    setFilteredJobs(filtered);
  };

  // QR Scanning functions for laundry
  const handleStartQRScan = (job, mode) => {
    setSelectedJobForQR(job);
    setQrScanMode(mode);
    setShowQRScanner(true);
    
    // Initialize scanned bags for this job if not exists
    if (!scannedBags[job.id]) {
      setScannedBags(prev => ({
        ...prev,
        [job.id]: { pickup: [], delivery: [] }
      }));
    }
  };

  const handleQRScanSuccess = async (decodedText, decodedResult) => {
    if (!selectedJobForQR || !qrScanMode) return;

    try {
      setLoading(true);
      
      // Parse the QR code data (assuming it contains bag information)
      const bagData = {
        jobId: selectedJobForQR.id,
        orderId: selectedJobForQR.orderId,
        customerName: selectedJobForQR.customerName,
        bagId: decodedText,
        scanType: qrScanMode, // 'pickup' or 'delivery'
        bubblerEmail: user?.email,
        bubblerName: user?.name,
        timestamp: new Date().toISOString(),
        location: selectedJobForQR.customerAddress
      };

      // Add scan to the API
      const response = await qrAPI.addScan(bagData);
      
      if (response.success) {
        // Update local state
        setScannedBags(prev => ({
          ...prev,
          [selectedJobForQR.id]: {
            ...prev[selectedJobForQR.id],
            [qrScanMode]: [...(prev[selectedJobForQR.id]?.[qrScanMode] || []), bagData]
          }
        }));

        // Calculate new scanned count after update
        const newScannedCount = (scannedBags[selectedJobForQR.id]?.[qrScanMode]?.length || 0) + 1;
        const totalBags = getTotalBagsForJob(selectedJobForQR);
        
        alert(`✅ Bag ${decodedText} scanned successfully for ${qrScanMode}! (${newScannedCount}/${totalBags})`);
        
        // Check if all bags are scanned for this mode
        if (newScannedCount >= totalBags) {
          alert(`✅ All bags scanned for ${qrScanMode}! Job tracking updated.`);
          setShowQRScanner(false);
          setSelectedJobForQR(null);
          setQrScanMode(null);
          
          // Optionally update job status or add a note
          if (qrScanMode === 'pickup') {
            // Could update job status to "In Progress" or add a note
            console.log('All bags picked up - job in progress');
          } else if (qrScanMode === 'delivery') {
            // Could update job status to "Completed" or add a note
            console.log('All bags delivered - job completed');
          }
        }
      } else {
        setError('Error recording scan: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error recording QR scan:', error);
      setError('Error recording scan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanError = (error) => {
    console.warn('QR Scan error:', error);
    // Don't show error for normal scan attempts
  };

  const getScannedBagsCount = (jobId, mode) => {
    return scannedBags[jobId]?.[mode]?.length || 0;
  };

  const getTotalBagsForJob = (job) => {
    if (job.bagTypes) {
      return job.bagTypes.split(',').length;
    }
    return 0;
  };

  // Photo upload functions for laundry
  const handleStartPhotoUpload = (job, mode) => {
    setSelectedJobForPhoto(job);
    setPhotoUploadMode(mode);
    setShowPhotoUploadModal(true);
  };

  const handleLaundryPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedJobForPhoto || !photoUploadMode) return;

    setLoading(true);
    setError(null);
    try {
      // Create a temporary URL for the file
      const photoUrl = URL.createObjectURL(file);
      
      // Upload the photo with specific mode
      const response = await jobsAPI.uploadPhoto(selectedJobForPhoto.id, photoUrl);
      
      if (response.success) {
        alert(`✅ ${photoUploadMode} photo uploaded successfully!`);
        setShowPhotoUploadModal(false);
        setSelectedJobForPhoto(null);
        setPhotoUploadMode(null);
        await loadJobs();
      } else {
        setError(`Error uploading ${photoUploadMode} photo: ` + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error(`Error uploading ${photoUploadMode} photo:`, error);
      setError(`Error uploading ${photoUploadMode} photo: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoStatus = (job) => {
    const hasPickupPhoto = job.photoLinkPickup && job.photoLinkPickup.trim() !== '';
    const hasDeliveryPhoto = job.photoLinkDelivery && job.photoLinkDelivery.trim() !== '';
    return { hasPickupPhoto, hasDeliveryPhoto };
  };

  const updateJobStatus = async (jobId, status) => {
    setLoading(true);
    setError(null);
    try {
      // Call the API to update the job status
      const response = await jobsAPI.updateJobStatus(jobId, status);
      
      if (response.success) {
        // Update local state after successful API call
        const updated = jobs.map(job =>
          job.id === jobId ? { ...job, jobStatus: status } : job
        );
        setJobs(updated);
        
        // Reload jobs to ensure sync with server
        await loadJobs();
      } else {
        setError('Error updating job status: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      setError('Error updating job status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob({ ...job });
    setIsAddMode(false);
    setShowJobModal(true);
  };

  const handleAddJob = () => {
    setEditingJob({
      jobId: generateJobId(),
      orderId: '',
      customerName: '',
      serviceType: '',
      customerAddress: '',
      jobDate: '',
      timeWindow: '',
      status: 'Pending',
      bubblerAssigned: '',
      photoUploadLink: '',
      notes: '',
      timestamp: new Date().toISOString().slice(0, 16),
    });
    setIsAddMode(true);
    setShowJobModal(true);
  };

  const handleSaveJob = async () => {
    if (editingJob) {
      setLoading(true);
      setError(null);
      try {
        if (isAddMode) {
          // Create new job
          const response = await jobsAPI.createJob({
            "Job ID": editingJob.jobId,
            "Order ID": editingJob.orderId,
            "Customer Name": editingJob.customerName,
            "Service Type": editingJob.serviceType,
            "Customer Address": editingJob.customerAddress,
            "Scheduled Date/Time": editingJob.jobDate + ' ' + editingJob.timeWindow,
            "Job Status": editingJob.status,
            "Bubbler Assigned": editingJob.bubblerAssigned,
            "Photo Upload Link": editingJob.photoUploadLink,
            "Notes": editingJob.notes,
            "Timestamp": editingJob.timestamp,
          });
          console.log('Job created response:', response);
        } else {
          // Update existing job (not implemented here)
          // You can add update logic if needed
        }
        await loadJobs();
        setShowJobModal(false);
        setEditingJob(null);
      } catch (error) {
        console.error('Error saving job:', error);
        setError('Error saving job: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteJob = async () => {
    if (selectedJob) {
      setLoading(true);
      setError(null);
      try {
        const response = await jobsAPI.cancelJob(selectedJob.id, 'Deleted by admin');
        console.log('Job deleted response:', response);
        
        // Reload jobs to get updated data
        await loadJobs();
        setShowDeleteModal(false);
        setSelectedJob(null);
      } catch (error) {
        console.error('Error deleting job:', error);
        setError('Error deleting job: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

      setLoading(true);
    setError(null);
    try {
      // Create a temporary URL for the file
      const photoUrl = URL.createObjectURL(file);
      
      // Upload the photo (you'll need to implement this)
          const response = await jobsAPI.uploadPhoto(selectedJob.id, photoUrl);
          
      if (response.success) {
        alert('✅ Photo uploaded successfully!');
          setShowPhotoModal(false);
          setSelectedJob(null);
        await loadJobs();
      } else {
        setError('Error uploading photo: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Error uploading photo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJob = (job) => {
    setSelectedJobForAssignment(job);
    // Only load bubblers with permission for this job's service type
    loadAvailableBubblers(job.serviceType);
    setShowAssignmentModal(true);
  };

  const assignJobToBubbler = async (jobId, bubblerEmail, bubblerName, isReassignment = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsAPI.assignJob(jobId, bubblerEmail, bubblerName);
      
      if (response.success) {
        alert(`✅ Job assigned to ${bubblerName}!`);
        setShowAssignmentModal(false);
        setSelectedJobForAssignment(null);
        await loadJobs();
      } else {
        setError('Error assigning job: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning job:', error);
      setError('Error assigning job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsAPI.acceptJob(jobId, user?.email || '');
      
      if (response.success) {
        alert('✅ Job accepted successfully!');
        await loadJobs();
      } else {
        setError('Error accepting job: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error accepting job:', error);
      setError('Error accepting job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineJob = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsAPI.declineJob(jobId, user?.email || '');
      
      if (response.success) {
        alert('✅ Job declined successfully!');
        await loadJobs();
      } else {
        setError('Error declining job: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error declining job:', error);
      setError('Error declining job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkArrival = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsAPI.markArrival(jobId, user?.email || '');
      
      if (response.success) {
        alert('✅ Arrival marked successfully!');
        await loadJobs();
      } else {
        setError('Error marking arrival: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error marking arrival:', error);
      setError('Error marking arrival: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = async (job) => {
    // For laundry service, check if both pickup and delivery photos are uploaded
    if (job.serviceType === 'Laundry Service') {
      const photoStatus = getPhotoStatus(job);
      if (!photoStatus.hasPickupPhoto || !photoStatus.hasDeliveryPhoto) {
        alert('❌ Laundry service requires both pickup and delivery photos before completion!');
        return;
      }
    }
    
    setSelectedJob(job);
    setShowPhotoModal(true);
  };

  const completeJob = async (photoLink = '', photoLinkPickup = '', photoLinkDelivery = '', notes = '') => {
    if (!selectedJob) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await jobsAPI.completeJob({
        jobId: selectedJob.id,
        bubblerAssigned: user?.email || selectedJob.bubblerAssigned,
        photoLink,
        photoLinkPickup,
        photoLinkDelivery,
        notes,
      });
      
      if (response.success) {
        alert('✅ Job completed successfully!');
        setShowPhotoModal(false);
        setSelectedJob(null);
        await loadJobs();
      } else {
        setError('Error completing job: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error completing job:', error);
      setError('Error completing job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMeta = (status) => {
    const statusMeta = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Assigned': { color: 'bg-blue-100 text-blue-800', icon: Users },
      'Accepted': { color: 'bg-green-100 text-green-800', icon: UserCheck },
      'Declined': { color: 'bg-red-100 text-red-800', icon: UserX },
      'Progressing': { color: 'bg-orange-100 text-orange-800', icon: Play },
      'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return statusMeta[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'Mobile Car Wash':
        return <Car className="h-4 w-4" />;
      case 'Home Cleaning':
        return <Home className="h-4 w-4" />;
      case 'Laundry Service':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getPhotoRequirementsForJob = (job) => {
    const serviceType = job.serviceType;
    const tier = job.tier || '';
    const addons = job.addons ? job.addons.split(',').map(a => a.trim()) : [];
    
    return getPhotoRequirements(serviceType, tier, addons);
  };

  const getPerksForJob = (job) => {
    const serviceType = job.serviceType;
    const tier = job.tier || '';
    const isFirstTime = job.isFirstTime || false;
    const refreshCleanCount = job.refreshCleanCount || 0;
    
    return getPerks(serviceType, tier, isFirstTime, refreshCleanCount);
  };

  const JobCard = ({ job }) => {
    const { color, icon: Icon } = getStatusMeta(job.jobStatus);
    const photoRequirements = getPhotoRequirementsForJob(job);
    const perks = getPerksForJob(job);
    const isLaundryJob = job.serviceType === 'Laundry Service';
    const totalBags = getTotalBagsForJob(job);
    const pickupScanned = getScannedBagsCount(job.id, 'pickup');
    const deliveryScanned = getScannedBagsCount(job.id, 'delivery');
    const photoStatus = getPhotoStatus(job);
    const isCompletedJob = job.jobStatus === 'Completed';
    const isProtectedJob = ['Completed', 'Cancelled', 'Declined'].includes(job.jobStatus) || 
                          (job.jobStatus === 'Assigned' && job.bubblerAssigned !== user?.email);
    
    return (
      <div className="card-hover">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{job.customerName}</h3>
            <div className="flex items-center space-x-2">
              {getServiceIcon(job.serviceType)}
              <p className="text-sm text-gray-600">{job.serviceType}</p>
            </div>
            <p className="text-xs text-gray-500">Job ID: {job.jobId}</p>
            {job.orderId && (
              <p className="text-xs text-gray-500">Order ID: {job.orderId}</p>
            )}
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {job.jobStatus}
          </span>
        </div>
        
        {/* Service Details */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="space-y-2">
            {job.tier && (
              <div className="flex items-center text-sm text-gray-700">
                <span className="font-medium">Tier:</span>
                <span className="ml-2">{job.tier}</span>
              </div>
            )}
            
            {job.addons && job.addons.length > 0 && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Add-ons:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {job.addons.split(',').map((addon, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {addon.trim()}
                    </span>
                  ))}
            </div>
            </div>
            )}
            
            {job.bagTypes && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Bags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {job.bagTypes.split(',').map((bag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {bag.trim()}
                    </span>
                  ))}
          </div>
              </div>
            )}
            
            {/* Laundry Bag Tracking */}
            {isLaundryJob && totalBags > 0 && (
              <div className="text-sm text-gray-700">
                <span className="font-medium flex items-center">
                  <QrCode className="h-4 w-4 mr-1" />
                  Bag Tracking:
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-xs">Pickup:</span>
                    <span className="text-xs font-medium">
                      {pickupScanned}/{totalBags}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-xs">Delivery:</span>
                    <span className="text-xs font-medium">
                      {deliveryScanned}/{totalBags}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Laundry Photo Requirements */}
            {isLaundryJob && (
              <div className="text-sm text-gray-700">
                <span className="font-medium flex items-center">
                  <Camera className="h-4 w-4 mr-1" />
                  Required Photos:
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className={`flex items-center justify-between p-2 rounded border ${
                    photoStatus.hasPickupPhoto ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <span className="text-xs">Pickup Photo:</span>
                    <span className={`text-xs font-medium ${
                      photoStatus.hasPickupPhoto ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {photoStatus.hasPickupPhoto ? '✅ Uploaded' : '❌ Required'}
                    </span>
          </div>
                  <div className={`flex items-center justify-between p-2 rounded border ${
                    photoStatus.hasDeliveryPhoto ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <span className="text-xs">Delivery Photo:</span>
                    <span className={`text-xs font-medium ${
                      photoStatus.hasDeliveryPhoto ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {photoStatus.hasDeliveryPhoto ? '✅ Uploaded' : '❌ Required'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Perks */}
            {perks.length > 0 && (
              <div className="text-sm text-gray-700">
                <span className="font-medium flex items-center">
                  <Gift className="h-4 w-4 mr-1" />
                  Perks:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {perks.map((perk, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Photo Requirements */}
            {photoRequirements.length > 0 && (
              <div className="text-sm text-gray-700">
                <span className="font-medium flex items-center">
                  <Camera className="h-4 w-4 mr-1" />
                  Required Photos:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {photoRequirements.map((req, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {job.customerAddress}
          </div>
          
                    {/* Privacy Notice for Protected Jobs */}
          {isProtectedJob && !isAdmin && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="font-medium">Privacy Protected</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                {job.jobStatus === 'Completed' && 'Job completed - customer information protected for privacy.'}
                {job.jobStatus === 'Cancelled' && 'Job cancelled - customer information protected for privacy.'}
                {job.jobStatus === 'Declined' && 'Job declined - customer information protected for privacy.'}
                {job.jobStatus === 'Assigned' && job.bubblerAssigned !== user?.email && 'Job reassigned - customer information protected for privacy.'}
                Contact admin for details.
            </p>
          </div>
          )}
          
          {job.scheduledDateTime && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(job.scheduledDateTime).toLocaleDateString()}
            </div>
          )}
          
          {job.bubblerAssigned && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              {job.bubblerAssigned}
            </div>
          )}
          
          {job.notes && (
            <div className="text-sm text-gray-600">
              <strong>Notes:</strong> {job.notes}
          </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-2">
            {/* Show different actions based on job status and user role */}
            {isAdmin && job.jobStatus === 'Pending' && (
              <button 
                onClick={() => handleAssignJob(job)} 
                className="btn-primary text-sm"
              >
                <Users className="h-4 w-4 mr-1" /> Assign
              </button>
            )}
            
            {!isAdmin && job.jobStatus === 'Assigned' && job.bubblerAssigned === user?.email && (
              <>
                <button 
                  onClick={() => handleAcceptJob(job.id)} 
                  className="btn-primary text-sm"
                >
                  <UserCheck className="h-4 w-4 mr-1" /> Accept
                </button>
                <button 
                  onClick={() => handleDeclineJob(job.id)} 
                  className="btn-secondary text-sm"
                >
                  <UserX className="h-4 w-4 mr-1" /> Decline
                </button>
              </>
            )}
            
            {!isAdmin && job.jobStatus === 'Accepted' && job.bubblerAssigned === user?.email && (
              <button 
                onClick={() => handleMarkArrival(job.id)} 
                className="btn-primary text-sm"
              >
                <MapPin className="h-4 w-4 mr-1" /> Mark Arrival
              </button>
            )}
            
            {!isAdmin && job.jobStatus === 'Progressing' && job.bubblerAssigned === user?.email && (
              <button 
                onClick={() => handleCompleteJob(job)} 
                className="btn-primary text-sm"
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Complete
              </button>
            )}
            
            {/* Laundry QR Scanning Buttons */}
            {isLaundryJob && !isAdmin && job.bubblerAssigned === user?.email && (
              <>
                <button 
                  onClick={() => handleStartQRScan(job, 'pickup')} 
                  className="btn-secondary text-sm"
                  disabled={pickupScanned >= totalBags}
                >
                  <QrCode className="h-4 w-4 mr-1" /> 
                  Scan Pickup ({pickupScanned}/{totalBags})
                </button>
                <button 
                  onClick={() => handleStartQRScan(job, 'delivery')} 
                  className="btn-secondary text-sm"
                  disabled={deliveryScanned >= totalBags}
                >
                  <CheckSquare className="h-4 w-4 mr-1" /> 
                  Scan Delivery ({deliveryScanned}/{totalBags})
                </button>
              </>
            )}

            {/* Laundry Photo Upload Buttons */}
            {isLaundryJob && !isAdmin && job.bubblerAssigned === user?.email && (
              <>
                <button 
                  onClick={() => handleStartPhotoUpload(job, 'pickup')} 
                  className={`btn-secondary text-sm ${
                    photoStatus.hasPickupPhoto ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''
                  }`}
                >
                  <Camera className="h-4 w-4 mr-1" /> 
                  {photoStatus.hasPickupPhoto ? '✅ Pickup Photo' : '📸 Pickup Photo'}
                </button>
                <button 
                  onClick={() => handleStartPhotoUpload(job, 'delivery')} 
                  className={`btn-secondary text-sm ${
                    photoStatus.hasDeliveryPhoto ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''
                  }`}
                >
                  <Camera className="h-4 w-4 mr-1" /> 
                  {photoStatus.hasDeliveryPhoto ? '✅ Delivery Photo' : '📸 Delivery Photo'}
                </button>
              </>
            )}
            
            {isAdmin && (
              <>
                <button 
                  onClick={() => handleEditJob(job)} 
                  className="btn-secondary text-sm"
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </button>
                <button 
                  onClick={() => { setSelectedJob(job); setShowDeleteModal(true); }} 
                  className="btn-secondary text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </button>
              </>
            )}
              </div>
          
          {job.photoUploadLink && (
            <button 
              onClick={() => window.open(job.photoUploadLink, '_blank')} 
              className="btn-secondary text-sm"
            >
              <Camera className="h-4 w-4 mr-1" /> View Photo
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? 'Jobs Management' : 'My Jobs'}</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin 
              ? 'Manage jobs created from split orders - assign to bubblers and track progress' 
              : 'Your assigned jobs - accept, complete, and track your work'
            }
          </p>
        </div>
        {isAdmin && (
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button className="btn-secondary" onClick={() => window.location.href = '/orders'}>
              <ExternalLink className="h-4 w-4 mr-2" /> View Orders
            </button>
            <button className="btn-primary" onClick={handleAddJob}>
              <Plus className="h-4 w-4 mr-2" /> Add New Job
            </button>
          </div>
        )}
      </div>

            {/* Job Statistics for Bubblers */}
      {!isAdmin && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Job Statistics
          </h2>
          {(() => {
            const stats = getCompletionStats();
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-700">{stats.totalCompleted}</div>
                  <div className="text-sm text-green-600">Completed</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-700">{stats.totalCancelled}</div>
                  <div className="text-sm text-red-600">Cancelled</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-700">{stats.totalDeclined}</div>
                  <div className="text-sm text-orange-600">Declined</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-700">{stats.totalReassigned}</div>
                  <div className="text-sm text-blue-600">Reassigned</div>
                </div>
              </div>
            );
          })()}
          
          {/* Earnings and Service Breakdown */}
          {(() => {
            const stats = getCompletionStats();
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-700">${stats.totalEarnings}</div>
                  <div className="text-sm text-blue-600">Total Earnings (Completed Only)</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-700">
                    <div className="font-medium mb-1">Completed by Service Type:</div>
                    {Object.entries(stats.serviceStats).map(([service, count]) => (
                      <div key={service} className="flex justify-between">
                        <span>{service}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          </div>
        )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
      </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-400 hover:text-red-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
              <option value="Progressing">Progressing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Services</option>
              <option value="Home Cleaning">Home Cleaning</option>
              <option value="Laundry Service">Laundry Service</option>
              <option value="Mobile Car Wash">Mobile Car Wash</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* jobs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredJobs.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your filters.</p>
        </div>
      )}

      {/* Add/Edit Job Modal */}
      {showJobModal && editingJob && (
        <Modal title={isAddMode ? "Add New Job" : "Edit Job"} onClose={() => { setShowJobModal(false); setEditingJob(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
              <input type="text" value={editingJob.jobId} onChange={e => setEditingJob({ ...editingJob, jobId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              <input type="text" value={editingJob.orderId} onChange={e => setEditingJob({ ...editingJob, orderId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bubbler Name</label>
              <input type="text" value={editingJob.bubblerName} onChange={e => setEditingJob({ ...editingJob, bubblerName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bubbler Email</label>
              <input type="email" value={editingJob.bubblerEmail} onChange={e => setEditingJob({ ...editingJob, bubblerEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bubbler Title</label>
              <input type="text" value={editingJob.bubblerTitle} onChange={e => setEditingJob({ ...editingJob, bubblerTitle: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select value={editingJob.serviceType} onChange={e => setEditingJob({ ...editingJob, serviceType: e.target.value, tier: '' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" required>
                <option value="">Select Service</option>
                <option value="Home Cleaning">Home Cleaning</option>
                <option value="Laundry Service">Laundry Service</option>
                <option value="Mobile Car Wash">Mobile Car Wash</option>
                <option value="Merch">Merch</option>
              </select>
            </div>
            {editingJob.serviceType === 'Home Cleaning' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select value={editingJob.tier} onChange={e => setEditingJob({ ...editingJob, tier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                  <option value="">Select Tier</option>
                  <option value="Signature Deep Clean">Signature Deep Clean</option>
                  <option value="Refresh Clean">Refresh Clean</option>
                </select>
              </div>
            )}
            {editingJob.serviceType === 'Mobile Car Wash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select value={editingJob.tier} onChange={e => setEditingJob({ ...editingJob, tier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                  <option value="">Select Tier</option>
                  <option value="Signature Shine">Signature Shine</option>
                  <option value="Supreme Shine">Supreme Shine</option>
                  <option value="Express Shine">Express Shine</option>
                </select>
              </div>
            )}
            {editingJob.serviceType === 'Laundry Service' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bag Type</label>
                <input type="text" value={editingJob.bagType} onChange={e => setEditingJob({ ...editingJob, bagType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Addons</label>
              <input type="text" value={editingJob.addons} onChange={e => setEditingJob({ ...editingJob, addons: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" placeholder="Comma separated" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input type="text" value={editingJob.customerName} onChange={e => setEditingJob({ ...editingJob, customerName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <input type="text" value={editingJob.customerAddress} onChange={e => setEditingJob({ ...editingJob, customerAddress: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Included Perks</label>
              <input type="text" value={editingJob.includedPerks} onChange={e => setEditingJob({ ...editingJob, includedPerks: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merch Purchases</label>
              <input type="text" value={editingJob.merchPurchases} onChange={e => setEditingJob({ ...editingJob, merchPurchases: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" placeholder="Comma separated" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input type="date" value={editingJob.scheduledDate} onChange={e => setEditingJob({ ...editingJob, scheduledDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
              <input type="text" value={editingJob.timeSlot} onChange={e => setEditingJob({ ...editingJob, timeSlot: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 9:00 AM - 11:00 AM" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Status</label>
              <select value={editingJob.jobStatus} onChange={e => setEditingJob({ ...editingJob, jobStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" required>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Required</label>
              <select value={editingJob.deliveryRequired} onChange={e => setEditingJob({ ...editingJob, deliveryRequired: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo Required</label>
              <select value={editingJob.photoRequired} onChange={e => setEditingJob({ ...editingJob, photoRequired: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo Link</label>
              <input type="text" value={editingJob.photoLink} onChange={e => setEditingJob({ ...editingJob, photoLink: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating Given</label>
              <input type="number" value={editingJob.ratingGiven} onChange={e => setEditingJob({ ...editingJob, ratingGiven: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" min="1" max="5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Earnings Estimate</label>
              <input type="number" value={editingJob.earningsEstimate} onChange={e => setEditingJob({ ...editingJob, earningsEstimate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp Completed</label>
              <input type="datetime-local" value={editingJob.timestampCompleted} onChange={e => setEditingJob({ ...editingJob, timestampCompleted: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo Link Pickup</label>
              <input type="text" value={editingJob.photoLinkPickup} onChange={e => setEditingJob({ ...editingJob, photoLinkPickup: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo Link Delivery</label>
              <input type="text" value={editingJob.photoLinkDelivery} onChange={e => setEditingJob({ ...editingJob, photoLinkDelivery: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={editingJob.notes} onChange={e => setEditingJob({ ...editingJob, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" rows="2" />
            </div>
            <div className="flex space-x-2 pt-4">
              <button onClick={handleSaveJob} className="btn-primary flex-1">{isAddMode ? 'Add Job' : 'Save Changes'}</button>
              <button onClick={() => { setShowJobModal(false); setEditingJob(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedJob && (
        <Modal title="Confirm Deletion" onClose={() => { setShowDeleteModal(false); setSelectedJob(null); }}>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the job for <strong>{selectedJob.customerName}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-2 pt-4">
              <button onClick={handleDeleteJob} className="btn-primary bg-red-600 hover:bg-red-700 flex-1">Delete Job</button>
              <button onClick={() => { setShowDeleteModal(false); setSelectedJob(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && selectedJob && (
        <Modal title={`Upload Photo for ${selectedJob.customerName}`} onClose={() => { setShowPhotoModal(false); setSelectedJob(null); }}>
          <div className="space-y-4">
            <p className="text-gray-600">
              Please upload a photo of the completed work for {selectedJob.customerName}.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="btn-primary cursor-pointer">
                Choose File
              </label>
            </div>
            <div className="flex space-x-2 pt-4">
              <button onClick={() => { setShowPhotoModal(false); setSelectedJob(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Job Assignment Modal */}
      {showAssignmentModal && selectedJobForAssignment && (
        <Modal title={`${selectedJobForAssignment.jobStatus === 'declined' || selectedJobForAssignment.bubblerAssigned ? 'Reassign' : 'Assign'} Job to Bubbler`} onClose={() => { setShowAssignmentModal(false); setSelectedJobForAssignment(null); }}>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Job Details</h3>
              <p className="text-blue-800"><strong>Customer:</strong> {selectedJobForAssignment.customerName}</p>
              <p className="text-blue-800"><strong>Service:</strong> {selectedJobForAssignment.serviceType}</p>
              <p className="text-blue-800"><strong>Address:</strong> {selectedJobForAssignment.customerAddress}</p>
              {selectedJobForAssignment.bubblerAssigned && (
                <p className="text-blue-800"><strong>Currently Assigned:</strong> {selectedJobForAssignment.bubblerAssigned}</p>
              )}
              {selectedJobForAssignment.jobStatus === 'declined' && (
                <p className="text-red-800"><strong>Status:</strong> Declined by previous bubbler</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Bubbler</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableBubblers.map((bubbler) => (
                  <button
                    key={bubbler.email}
                    onClick={() => assignJobToBubbler(
                      selectedJobForAssignment.id, 
                      bubbler.email, 
                      bubbler.name,
                      selectedJobForAssignment.jobStatus === 'declined' || selectedJobForAssignment.bubblerAssigned
                    )}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-cyan-500 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{bubbler.name}</div>
                    <div className="text-sm text-gray-600">{bubbler.email}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button onClick={() => { setShowAssignmentModal(false); setSelectedJobForAssignment(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && selectedJobForQR && (
        <Modal title={`Scan Bags for ${selectedJobForQR.customerName}`} onClose={() => { setShowQRScanner(false); setSelectedJobForQR(null); }}>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                {qrScanMode === 'pickup' ? 'Pickup Scanning' : 'Delivery Scanning'}
              </h3>
              <p className="text-blue-800 mb-2">
                <strong>Customer:</strong> {selectedJobForQR.customerName}
              </p>
              <p className="text-blue-800 mb-2">
                <strong>Service:</strong> {selectedJobForQR.serviceType}
              </p>
              <p className="text-blue-800 mb-2">
                <strong>Bags:</strong> {getTotalBagsForJob(selectedJobForQR)} total
              </p>
              <p className="text-blue-800">
                <strong>Progress:</strong> {getScannedBagsCount(selectedJobForQR.id, qrScanMode)}/{getTotalBagsForJob(selectedJobForQR)} scanned
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Instructions:</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Point camera at the QR code on each laundry bag</li>
                <li>• Scan each bag individually</li>
                <li>• {qrScanMode === 'pickup' ? 'Scan all bags during pickup' : 'Scan all bags during delivery'}</li>
                <li>• System will automatically track progress</li>
              </ul>
            </div>
            
            <QRScanner
              onScanSuccess={handleQRScanSuccess}
              onScanError={handleQRScanError}
              onClose={() => { setShowQRScanner(false); setSelectedJobForQR(null); }}
            />
            
            <div className="flex space-x-2 pt-4">
              <button onClick={() => { setShowQRScanner(false); setSelectedJobForQR(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Laundry Photo Upload Modal */}
      {showPhotoUploadModal && selectedJobForPhoto && (
        <Modal title={`Upload ${photoUploadMode} Photo for ${selectedJobForPhoto.customerName}`} onClose={() => { setShowPhotoUploadModal(false); setSelectedJobForPhoto(null); }}>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                {photoUploadMode === 'pickup' ? 'Pickup Photo' : 'Delivery Photo'}
              </h3>
              <p className="text-blue-800 mb-2">
                <strong>Customer:</strong> {selectedJobForPhoto.customerName}
              </p>
              <p className="text-blue-800 mb-2">
                <strong>Service:</strong> {selectedJobForPhoto.serviceType}
              </p>
              <p className="text-blue-800">
                <strong>Location:</strong> {selectedJobForPhoto.customerAddress}
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Photo Requirements:</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• {photoUploadMode === 'pickup' ? 'Take photo of all bags at pickup location' : 'Take photo of all bags at delivery location'}</li>
                <li>• Ensure bags are clearly visible in the photo</li>
                <li>• Include location context in the background</li>
                <li>• Photo is required for job completion</li>
              </ul>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLaundryPhotoUpload}
                className="hidden"
                id="laundry-photo-upload"
              />
              <label htmlFor="laundry-photo-upload" className="btn-primary cursor-pointer">
                Choose Photo
              </label>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button onClick={() => { setShowPhotoUploadModal(false); setSelectedJobForPhoto(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Jobs;