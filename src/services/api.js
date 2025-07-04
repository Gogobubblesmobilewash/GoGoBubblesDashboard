// Google Apps Script API endpoints
const API_BASE = 'https://script.google.com/macros/s/AKfycbwJiqDeF-vNMLe2dhGoTDU3rjifJUIgI0WpJQxoLZaUQlcSE9nGUdMMiyqDaHVgqswaSA/exec';

// Admin Notes API endpoint
const ADMIN_NOTES_API = 'https://script.google.com/macros/s/AKfycbzSATztTlD88djYLlTTeW747OUaMkKGuvTcoYbr_5SCgzcrdqCq8wIaL-D6qMTub9KsQg/exec';

// Jobs Google Apps Script API endpoint
const JOBS_API = 'https://script.google.com/macros/s/AKfycbzM7AVH7DpFOl76YL2f0sHI48L9IQJ1fD74MwW7KGMfu42ncvxVeDF9a9r_l1Sgh-sjKA/exec';

// Orders Google Apps Script API endpoint (for split-job functionality)
// Update this URL with your new Orders Management script deployment URL
export const ORDERS_API = 'https://script.google.com/macros/s/AKfycbwclBp7hoN6XnNWVGAMoPDjMfV38uUsaN6M_Ucas_3dGV3SoQ5aTT5FKO7aV3VKeiY/exec';

// CORS Proxy for development (only used in development mode)
const CORS_PROXY = 'http://localhost:8080/';

// Helper function to add CORS proxy in development
const addCorsProxy = (url) => {
  // Only use proxy in development (when running on localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return CORS_PROXY + url;
  }
  return url;
};

// Service configuration and rules
export const SERVICE_CONFIG = {
  'Mobile Car Wash': {
    tiers: ['Express Shine', 'Signature Shine', 'Supreme Shine'],
    vehicleTypes: ['Car', 'SUV', 'Truck', 'Minivan'],
    addons: [
      'Clay Bar Treatment',
      'Bug & Tar Removal', 
      'Plastic Trim Restoration',
      'Upholstery Shampoo',
      'Interior Shampoo'
    ],
    maxVehiclesPerOrder: 3,
    perks: {
      'Express Shine': { firstTime: 'Free Car Freshener' },
      'Signature Shine': { always: 'Free Car Freshener' },
      'Supreme Shine': { always: 'Free Car Freshener' }
    },
    photoRequired: ['Interior Shampoo', 'Upholstery Shampoo']
  },
  'Home Cleaning': {
    tiers: ['Refresh Clean', 'Signature Deep Clean'],
    addons: [
      'Deep Dusting',
      'Deep Clean Bedroom',
      'Refrigerator Cleaning',
      'Oven Cleaning',
      'Freezer Cleaning',
      'Carpet Cleaning',
      'Steam Mopping'
    ],
    perks: {
      'Signature Deep Clean': { always: 'Free Candle' },
      'Refresh Clean': { everyThird: 'Free Candle' }
    },
    photoRequired: ['Signature Deep Clean']
  },
  'Laundry Service': {
    bagTypes: ['Essentials Bag', 'Family Bag', 'Delicates Bag', 'Ironing Bag'],
    addons: [
      'Eco-friendly detergent',
      'Same-day service'
    ],
    alwaysGrouped: true, // Laundry is always one job regardless of bag count
    photoRequired: ['pickup', 'delivery'], // Always requires 2 photos
    perks: {} // No perks for laundry
  }
};

// Helper function to determine if a service requires photos
export const getPhotoRequirements = (serviceType, tier, addons = []) => {
  const config = SERVICE_CONFIG[serviceType];
  if (!config) return [];
  
  const requirements = [];
  
  // Check service-specific photo requirements
  if (config.photoRequired) {
    if (Array.isArray(config.photoRequired)) {
      requirements.push(...config.photoRequired);
    } else if (typeof config.photoRequired === 'string') {
      requirements.push(config.photoRequired);
    }
  }
  
  // Check addon-specific photo requirements
  if (addons && addons.length > 0) {
    addons.forEach(addon => {
      if (config.photoRequired && config.photoRequired.includes(addon)) {
        requirements.push(addon);
      }
    });
  }
  
  return requirements;
};

// Helper function to determine perks for a service
export const getPerks = (serviceType, tier, isFirstTime = false, refreshCleanCount = 0) => {
  const config = SERVICE_CONFIG[serviceType];
  if (!config || !config.perks || !config.perks[tier]) return [];
  
  const perks = [];
  const tierPerks = config.perks[tier];
  
  if (tierPerks.always) {
    perks.push(tierPerks.always);
  }
  
  if (tierPerks.firstTime && isFirstTime) {
    perks.push(tierPerks.firstTime);
  }
  
  if (tierPerks.everyThird && refreshCleanCount > 0 && refreshCleanCount % 3 === 0) {
    perks.push(tierPerks.everyThird);
  }
  
  return perks;
};

// Helper function to parse services and determine splitting rules
export const parseServicesForSplitting = (servicesJson) => {
  if (!servicesJson) return [];
  
  try {
    const services = JSON.parse(servicesJson);
    if (!Array.isArray(services)) return [];
    
    const parsedServices = [];
    let laundryServices = [];
    
    services.forEach((service, index) => {
      const serviceName = service.service || 'Unknown Service';
      const tier = service.tier || '';
      const addons = service.addons || [];
      const vehicleType = service.vehicleType || '';
      const bagType = service.bagType || '';
      const quantity = service.quantity || 1;
      
      // Group laundry services together
      if (serviceName === 'Laundry Service') {
        laundryServices.push({
          service: serviceName,
          tier,
          addons,
          bagType,
          quantity,
          originalIndex: index
        });
      } else {
        // Other services get their own job
        parsedServices.push({
          service: serviceName,
          tier,
          addons,
          vehicleType,
          quantity,
          originalIndex: index
        });
      }
    });
    
    // Add grouped laundry as one service if any exist
    if (laundryServices.length > 0) {
      parsedServices.push({
        service: 'Laundry Service',
        tier: laundryServices[0].tier,
        addons: [...new Set(laundryServices.flatMap(s => s.addons))], // Unique addons
        bagTypes: laundryServices.map(s => ({ type: s.bagType, quantity: s.quantity })),
        totalBags: laundryServices.reduce((sum, s) => sum + s.quantity, 0),
        originalIndexes: laundryServices.map(s => s.originalIndex)
      });
    }
    
    return parsedServices;
  } catch (error) {
    console.error('Error parsing services JSON:', error);
    return [];
  }
};

// Helper function to generate unique IDs
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORDER-${timestamp}${random}`;
};

export const generateJobId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `JOB-${timestamp}${random}`;
};

// Helper function to make API calls to Google Apps Script
const apiCall = async (action, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (data) {
      options.body = JSON.stringify({ action, ...data });
    } else if (method === 'GET') {
      options.body = null;
    }

    const response = await fetch(addCorsProxy(API_BASE), options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Helper for POST requests to Google Apps Script
async function postToJobsAPI(action, data = {}) {
  const payload = JSON.stringify({ action, ...data });
  const response = await fetch(addCorsProxy(JOBS_API), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

// Helper for POST requests to Orders API
async function postToOrdersAPI(action, data = {}) {
  try {
    // Ensure action is always included and not undefined
    if (!action) {
      throw new Error('Action parameter is required');
    }
    
    // Create payload with action as the first property
    const payload = JSON.stringify({ 
      action: action,
      ...data 
    });
    console.log('Orders API POST request:', { action, data, payload });
    
    // Use CORS proxy in development for POST requests
    const response = await fetch(addCorsProxy(ORDERS_API), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: payload,
      // Allow redirects for Google Apps Script
      redirect: 'follow'
    });
    
    console.log('Orders API POST response status:', response.status);
    console.log('Orders API POST response URL:', response.url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Orders API POST error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Orders API POST success response:', result);
    return result;
  } catch (error) {
    console.error('Orders API POST request failed:', error);
    throw error;
  }
}

// Jobs API
export const jobsAPI = {
  // Create a new job (admin)
  async createJob(jobData) {
    return await postToJobsAPI('createJob', jobData);
  },
  
  // Get all jobs (admin) - updated to support filtering by assigned bubbler
  async getAllJobs(bubblerEmail = null) {
    if (bubblerEmail) {
      return await postToJobsAPI('getJobsByBubbler', { bubblerEmail });
    }
    return await postToJobsAPI('getAllJobs');
  },
  
  // Get jobs assigned to a specific bubbler
  async getJobsByBubbler(bubblerEmail) {
    return await postToJobsAPI('getJobsByBubbler', { bubblerEmail });
  },
  
  // Assign a job to a bubbler (admin only)
  async assignJob(jobId, bubblerEmail, bubblerName) {
    return await postToJobsAPI('assignJob', {
      jobId,
      bubblerEmail,
      bubblerName,
      assignmentDate: new Date().toISOString()
    });
  },
  
  // Accept a job assignment (bubbler)
  async acceptJob(jobId, bubblerEmail, notes = "") {
    return await postToJobsAPI('updateJobStatus', {
      "Job ID": jobId,
      "Job Status": "Accepted",
      "Bubbler Assigned": bubblerEmail,
      "Bubbler Notes": notes,
      "Assignment Accepted": new Date().toISOString(),
      "Timestamp": new Date().toISOString(),
    });
  },
  
  // Mark arrival at job location (bubbler)
  async markArrival(jobId, bubblerEmail, notes = "") {
    return await postToJobsAPI('updateJobStatus', {
      "Job ID": jobId,
      "Job Status": "Progressing", // Updated to match new status flow
      "Bubbler Assigned": bubblerEmail,
      "Bubbler Notes": notes,
      "Arrival Time": new Date().toISOString(),
      "Timestamp": new Date().toISOString(),
    });
  },
  
  // Decline a job assignment (bubbler)
  async declineJob(jobId, bubblerEmail, notes = "") {
    return await postToJobsAPI('updateJobStatus', {
      "Job ID": jobId,
      "Job Status": "Pending", // Reset to Pending when declined
      "Bubbler Assigned": bubblerEmail,
      "Bubbler Notes": notes,
      "Assignment Declined": new Date().toISOString(),
      "Timestamp": new Date().toISOString(),
    });
  },
  
  // Reassign a job to a different bubbler (admin) - clears previous acceptance/decline
  async reassignJob(jobId, newBubblerEmail, newBubblerName) {
    return await postToJobsAPI('reassignJob', {
      jobId,
      newBubblerEmail,
      newBubblerName,
      reassignmentDate: new Date().toISOString(),
      // Clear previous acceptance/decline status
      "Assignment Accepted": "",
      "Assignment Declined": "",
      "Bubbler Notes": `Reassigned from previous bubbler to ${newBubblerName} on ${new Date().toLocaleString()}`
    });
  },
  
  // Mark job complete (with optional photos/notes)
  async completeJob({
    jobId,
    bubblerAssigned,
    photoLink = "",
    photoLinkPickup = "",
    photoLinkDelivery = "",
    notes = "",
    timestampCompleted = new Date().toISOString(),
  }) {
    return await postToJobsAPI('updateJobStatus', {
      "Job ID": jobId,
      "Job Status": "Completed",
      "Bubbler Assigned": bubblerAssigned,
      "Photo Link": photoLink,
      "Photo Link Pickup": photoLinkPickup,
      "Photo Link Delivery": photoLinkDelivery,
      "Bubbler Notes": notes,
      "Timestamp Completed": timestampCompleted,
    });
  },
  
  // Add/update notes for a job
  async addJobNote(jobId, notes) {
    return await postToJobsAPI('updateJobStatus', {
      "Job ID": jobId,
      "Bubbler Notes": notes,
      "Timestamp": new Date().toISOString(),
    });
  },
  
  // Get daily jobs for a bubbler
  async getDailyJobs(bubblerEmail, date) {
    return await postToJobsAPI('getDailyJobs', { bubblerEmail, date });
  },
  
  // Cancel a job
  async cancelJob(jobId, reason) {
    return await postToJobsAPI('cancelJob', { jobId, reason });
  },
  
  // Upload photo for a job
  async uploadPhoto(jobId, photoUrl) {
    return await postToJobsAPI('uploadPhoto', { jobId, photoUrl });
  },
  
  // Get pending jobs that need assignment (admin only)
  async getPendingJobs() {
    return await postToJobsAPI('getPendingJobs');
  },
  
  // Get jobs by status
  async getJobsByStatus(status) {
    return await postToJobsAPI('getJobsByStatus', { status });
  },
  
  // General job status update (for statuses that don't require special handling)
  async updateJobStatus(jobId, status, notes = "") {
    return await postToJobsAPI('updateJobStatus', {
      "Job ID": jobId,
      "Job Status": status,
      "Bubbler Notes": notes,
      "Timestamp": new Date().toISOString(),
    });
  }
};

// Equipment API
export const equipmentAPI = {
  async getEquipment() {
    const response = await apiCall('getAllEquipment');
    return response;
  },
  async updateEquipmentStatus(id, status) {
    const response = await apiCall('updateEquipmentStatus', 'POST', { equipmentId: id, status });
    return response;
  },
  async addEquipment(equipmentData) {
    const response = await apiCall('addEquipment', 'POST', equipmentData);
    return response;
  },
  async getEquipmentByBubbler(bubblerEmail) {
    const response = await apiCall('getEquipmentByBubbler', 'POST', { bubblerEmail });
    return response;
  },
  async assignEquipment(equipmentId, bubblerEmail) {
    const response = await apiCall('assignEquipment', 'POST', { equipmentId, bubblerEmail });
    return response;
  },
  async returnEquipment(equipmentId, returnDate) {
    const response = await apiCall('returnEquipment', 'POST', { equipmentId, returnDate });
    return response;
  },
};

// Authentication API
export const authAPI = {
  async login(credentials) {
    const response = await apiCall('login', 'POST', credentials);
    return response;
  },
  async resetPassword(email) {
    const response = await apiCall('resetPassword', 'POST', { email });
    return response;
  },
  async verifyResetToken(token) {
    const response = await apiCall('verifyResetToken', 'POST', { token });
    return response;
  },
  async changePassword(token, newPassword) {
    const response = await apiCall('changePassword', 'POST', { token, newPassword });
    return response;
  },
};

// QR Scans API
export const qrAPI = {
  async getAllScans() {
    const response = await apiCall('getAllScans');
    return response;
  },
  async getScansByBubbler(bubblerEmail) {
    const response = await apiCall('getScansByBubbler', 'POST', { bubblerEmail });
    return response;
  },
  async addScan(scanData) {
    const response = await apiCall('addScan', 'POST', scanData);
    return response;
  },
  async getScanHistory(customerName) {
    const response = await apiCall('getScanHistory', 'POST', { customerName });
    return response;
  },
};

// Ratings API
export const ratingsAPI = {
  async getAllRatings() {
    const response = await apiCall('getAllRatings');
    return response;
  },
  async getRatingsByBubbler(bubblerName) {
    const response = await apiCall('getRatingsByBubbler', 'POST', { bubblerName });
    return response;
  },
  async addRating(ratingData) {
    const response = await apiCall('addRating', 'POST', ratingData);
    return response;
  },
  async respondToRating(ratingId, response) {
    const result = await apiCall('respondToRating', 'POST', { ratingId, response });
    return result;
  },
};

// Admin Notes API
export const notesAPI = {
  async getAllNotes() {
    try {
      const response = await fetch(`${ADMIN_NOTES_API}?action=getAllNotes`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Admin Notes API Error:', error);
      throw error;
    }
  },
  async getNotesByJob(relatedJobId) {
    try {
      const response = await fetch(`${ADMIN_NOTES_API}?action=getNotesByJob&relatedJobId=${encodeURIComponent(relatedJobId)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Admin Notes API Error:', error);
      throw error;
    }
  },
  async addNote(noteData) {
    try {
      const params = new URLSearchParams({
        action: 'addNote',
        relatedJobId: noteData.relatedJobId || '',
        date: noteData.date || new Date().toISOString().split('T')[0],
        teamMember: noteData.teamMember || '',
        followUp: noteData.followUp || 'No',
        author: noteData.author || '',
        content: noteData.content || ''
      });
      const response = await fetch(`${ADMIN_NOTES_API}?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Admin Notes API Error:', error);
      throw error;
    }
  },
};

// Earnings API
export const earningsAPI = {
  async getEarningsByBubbler(bubblerEmail, dateRange) {
    const response = await apiCall('getEarningsByBubbler', 'POST', { bubblerEmail, dateRange });
    return response;
  },
  async getAllEarnings(dateRange) {
    const response = await apiCall('getAllEarnings', 'POST', { dateRange });
    return response;
  },
  async updateEarnings(jobId, earnings) {
    const response = await apiCall('updateEarnings', 'POST', { jobId, earnings });
    return response;
  },
};

// Test Orders API connection
export async function testOrdersAPI() {
  try {
    console.log('🧪 Testing Orders API connection...');
    console.log('📡 Orders API URL:', ORDERS_API);
    
    // Test 1: Simple GET request with action parameter
    console.log('📡 Test 1: GET request with action parameter...');
    const getResponse = await fetch(`${ORDERS_API}?action=test`);
    console.log('GET response status:', getResponse.status);
    console.log('GET response headers:', Object.fromEntries(getResponse.headers.entries()));
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ GET request successful:', getResult);
      alert(`Orders API Test: SUCCESS (GET)\nStatus: ${getResponse.status}\nData: ${JSON.stringify(getResult, null, 2)}`);
      return;
    } else {
      const errorText = await getResponse.text();
      console.log('❌ GET request failed:', errorText);
    }
    
    // Test 2: POST request with explicit action
    console.log('📡 Test 2: POST request with explicit action...');
    const postPayload = JSON.stringify({ action: 'test' });
    console.log('POST payload:', postPayload);
    
    const postResponse = await fetch(ORDERS_API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: postPayload,
    });
    
    console.log('POST response status:', postResponse.status);
    
    if (postResponse.ok) {
      const postResult = await postResponse.json();
      console.log('✅ POST request successful:', postResult);
      alert(`Orders API Test: SUCCESS (POST)\nStatus: ${postResponse.status}\nData: ${JSON.stringify(postResult, null, 2)}`);
      return;
    } else {
      const errorText = await postResponse.text();
      console.log('❌ POST request failed:', errorText);
      alert(`Orders API Test: FAILED\nStatus: ${postResponse.status}\nError: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Orders API test failed:', error);
    alert(`Orders API Test: FAILED\nError: ${error.message}\n\nCheck browser console for detailed logs.`);
  }
}

// Orders API - uses GET only (no CORS errors)
export const ordersAPI = {
  // Get all orders
  async getAllOrders() {
    return await getFromOrdersAPI('getOrders');
  },
  
  // Get orders that need to be split (multi-service orders)
  async getOrdersToSplit() {
    return await getFromOrdersAPI('getOrdersToSplit');
  },
  
  // Split a multi-service order into individual jobs
  async splitOrder(orderId) {
    return await getFromOrdersAPI('splitOrder', { orderId });
  },
  
  // Revert a split order
  async revertSplit(orderId) {
    return await getFromOrdersAPI('revertSplit', { orderId });
  },
  
  // Get details of a single order
  async getOrderById(orderId) {
    return await getFromOrdersAPI('getOrderById', { orderId });
  },
  
  // Complete an order
  async completeOrder(orderId, completionNotes = '', completedBy = 'Admin') {
    return await getFromOrdersAPI('completeOrder', {
      orderId, 
      completionNotes, 
      completedBy,
      completionDate: new Date().toISOString()
    });
  },
  
  // Cancel an order
  async cancelOrder(orderId, reason, cancelledBy = 'Admin') {
    return await getFromOrdersAPI('cancelOrder', {
      orderId, 
      reason, 
      cancelledBy,
      cancellationDate: new Date().toISOString()
    });
  },
  
  // Get cancelled orders
  async getCancelledOrders() {
    return await getFromOrdersAPI('getCancelledOrders');
  },
  
  // Trigger updates to split status if needed
  async updateSplitStatus() {
    return await getFromOrdersAPI('updateSplitStatus');
  }
};

// Helper for GET-based orders API
async function getFromOrdersAPI(action, params = {}) {
  try {
    if (!action) throw new Error('Action parameter is required');
    
    const url = new URL(addCorsProxy(ORDERS_API));
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    console.log('📡 Orders API GET request:', url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET'
    });
    
    console.log('✅ Orders API GET response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Orders API GET error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Orders API GET success:', result);
    return result;
  } catch (error) {
    console.error('❌ Orders API GET failed:', error);
    throw error;
  }
}

// Mock data for development (remove when connecting to real API)
export const mockData = {
  users: [
    // Admin
    { id: 1, email: 'admin@gogobubbles.com', name: 'Admin User', role: 'admin', phone: '+1234567891' },
    // Shine Bubbler: Mobile Car Wash only
    { 
      id: 2, 
      email: 'shine@gogobubbles.com', 
      name: 'Shine Bubbler', 
      role: 'bubbler', 
      phone: '+1000000001', 
      permissions: ['Mobile Car Wash'],
      jobsAssigned: 15,
      jobsCompleted: 12,
      jobsCancelled: 1,
      jobsDeclined: 0,
      jobsReassigned: 2,
      totalEarnings: 450.00,
      rating: 4.8,
      lastActive: '2024-01-15T10:30:00Z',
      joinDate: '2023-06-15T00:00:00Z',
      currentJobs: [
        {
          id: 'JOB-001',
          serviceType: 'Mobile Car Wash',
          customerName: 'John Smith',
          address: '123 Main St, City, State',
          scheduledDate: '2024-01-15T14:00:00Z',
          status: 'In Progress',
          earnings: 45.00,
          orderId: 'ORDER-001'
        }
      ],
      upcomingJobs: [
        {
          id: 'JOB-002',
          serviceType: 'Mobile Car Wash',
          customerName: 'Sarah Johnson',
          address: '456 Oak Ave, City, State',
          scheduledDate: '2024-01-16T10:00:00Z',
          status: 'Assigned',
          earnings: 55.00,
          orderId: 'ORDER-002'
        },
        {
          id: 'JOB-003',
          serviceType: 'Mobile Car Wash',
          customerName: 'Mike Davis',
          address: '789 Pine Rd, City, State',
          scheduledDate: '2024-01-17T13:00:00Z',
          status: 'Assigned',
          earnings: 40.00,
          orderId: 'ORDER-003'
        }
      ]
    },
    // Sparkle Bubbler: Home Cleaning only
    { 
      id: 3, 
      email: 'sparkle@gogobubbles.com', 
      name: 'Sparkle Bubbler', 
      role: 'bubbler', 
      phone: '+1000000002', 
      permissions: ['Home Cleaning'],
      jobsAssigned: 22,
      jobsCompleted: 20,
      jobsCancelled: 0,
      jobsDeclined: 1,
      jobsReassigned: 1,
      totalEarnings: 680.00,
      rating: 4.9,
      lastActive: '2024-01-15T14:20:00Z',
      joinDate: '2023-08-20T00:00:00Z',
      currentJobs: [
        {
          id: 'JOB-004',
          serviceType: 'Home Cleaning',
          customerName: 'Lisa Wilson',
          address: '321 Elm St, City, State',
          scheduledDate: '2024-01-15T16:00:00Z',
          status: 'In Progress',
          earnings: 120.00,
          orderId: 'ORDER-004'
        }
      ],
      upcomingJobs: [
        {
          id: 'JOB-005',
          serviceType: 'Home Cleaning',
          customerName: 'Robert Brown',
          address: '654 Maple Dr, City, State',
          scheduledDate: '2024-01-16T09:00:00Z',
          status: 'Assigned',
          earnings: 95.00,
          orderId: 'ORDER-005'
        }
      ]
    },
    // Fresh Bubbler: Laundry only
    { 
      id: 4, 
      email: 'fresh@gogobubbles.com', 
      name: 'Fresh Bubbler', 
      role: 'bubbler', 
      phone: '+1000000003', 
      permissions: ['Laundry'],
      jobsAssigned: 35,
      jobsCompleted: 32,
      jobsCancelled: 2,
      jobsDeclined: 0,
      jobsReassigned: 1,
      totalEarnings: 520.00,
      rating: 4.7,
      lastActive: '2024-01-15T16:45:00Z',
      joinDate: '2023-09-10T00:00:00Z',
      currentJobs: [
        {
          id: 'JOB-006',
          serviceType: 'Laundry',
          customerName: 'Emma Taylor',
          address: '987 Cedar Ln, City, State',
          scheduledDate: '2024-01-15T18:00:00Z',
          status: 'In Progress',
          earnings: 35.00,
          orderId: 'ORDER-006'
        }
      ],
      upcomingJobs: [
        {
          id: 'JOB-007',
          serviceType: 'Laundry',
          customerName: 'David Miller',
          address: '147 Birch Way, City, State',
          scheduledDate: '2024-01-16T11:00:00Z',
          status: 'Assigned',
          earnings: 42.00,
          orderId: 'ORDER-007'
        },
        {
          id: 'JOB-008',
          serviceType: 'Laundry',
          customerName: 'Jennifer Garcia',
          address: '258 Spruce Ct, City, State',
          scheduledDate: '2024-01-17T15:00:00Z',
          status: 'Assigned',
          earnings: 38.00,
          orderId: 'ORDER-008'
        }
      ]
    },
    // Elite Bubbler: Mobile Car Wash + Laundry
    { 
      id: 5, 
      email: 'elite1@gogobubbles.com', 
      name: 'Elite Bubbler 1', 
      role: 'bubbler', 
      phone: '+1000000004', 
      permissions: ['Mobile Car Wash', 'Laundry'],
      jobsAssigned: 28,
      jobsCompleted: 25,
      jobsCancelled: 1,
      jobsDeclined: 1,
      jobsReassigned: 1,
      totalEarnings: 890.00,
      rating: 4.9,
      lastActive: '2024-01-15T12:15:00Z',
      joinDate: '2023-07-05T00:00:00Z',
      currentJobs: [
        {
          id: 'JOB-009',
          serviceType: 'Mobile Car Wash',
          customerName: 'Alex Thompson',
          address: '369 Willow St, City, State',
          scheduledDate: '2024-01-15T15:30:00Z',
          status: 'In Progress',
          earnings: 50.00,
          orderId: 'ORDER-009'
        }
      ],
      upcomingJobs: [
        {
          id: 'JOB-010',
          serviceType: 'Laundry',
          customerName: 'Maria Rodriguez',
          address: '741 Aspen Ave, City, State',
          scheduledDate: '2024-01-16T12:00:00Z',
          status: 'Assigned',
          earnings: 45.00,
          orderId: 'ORDER-010'
        }
      ]
    },
    // Elite Bubbler: Home Cleaning + Laundry
    { 
      id: 6, 
      email: 'elite2@gogobubbles.com', 
      name: 'Elite Bubbler 2', 
      role: 'bubbler', 
      phone: '+1000000005', 
      permissions: ['Home Cleaning', 'Laundry'],
      jobsAssigned: 31,
      jobsCompleted: 29,
      jobsCancelled: 0,
      jobsDeclined: 1,
      jobsReassigned: 1,
      totalEarnings: 950.00,
      rating: 5.0,
      lastActive: '2024-01-15T15:30:00Z',
      joinDate: '2023-05-12T00:00:00Z',
      currentJobs: [
        {
          id: 'JOB-011',
          serviceType: 'Home Cleaning',
          customerName: 'Chris Lee',
          address: '852 Poplar Rd, City, State',
          scheduledDate: '2024-01-15T17:00:00Z',
          status: 'In Progress',
          earnings: 110.00,
          orderId: 'ORDER-011'
        }
      ],
      upcomingJobs: [
        {
          id: 'JOB-012',
          serviceType: 'Laundry',
          customerName: 'Amanda White',
          address: '963 Sycamore Dr, City, State',
          scheduledDate: '2024-01-16T14:00:00Z',
          status: 'Assigned',
          earnings: 40.00,
          orderId: 'ORDER-012'
        }
      ]
    },
    // Elite Bubbler: Laundry + Mobile Car Wash or Home Cleaning
    { 
      id: 7, 
      email: 'elite3@gogobubbles.com', 
      name: 'Elite Bubbler 3', 
      role: 'bubbler', 
      phone: '+1000000006', 
      permissions: ['Laundry', 'Mobile Car Wash', 'Home Cleaning'],
      jobsAssigned: 42,
      jobsCompleted: 38,
      jobsCancelled: 2,
      jobsDeclined: 1,
      jobsReassigned: 1,
      totalEarnings: 1200.00,
      rating: 4.8,
      lastActive: '2024-01-15T18:00:00Z',
      joinDate: '2023-04-01T00:00:00Z',
      currentJobs: [
        {
          id: 'JOB-013',
          serviceType: 'Home Cleaning',
          customerName: 'Kevin Martinez',
          address: '159 Magnolia Ln, City, State',
          scheduledDate: '2024-01-15T19:00:00Z',
          status: 'In Progress',
          earnings: 130.00,
          orderId: 'ORDER-013'
        }
      ],
      upcomingJobs: [
        {
          id: 'JOB-014',
          serviceType: 'Mobile Car Wash',
          customerName: 'Rachel Green',
          address: '357 Dogwood Way, City, State',
          scheduledDate: '2024-01-16T16:00:00Z',
          status: 'Assigned',
          earnings: 60.00,
          orderId: 'ORDER-014'
        },
        {
          id: 'JOB-015',
          serviceType: 'Laundry',
          customerName: 'Tom Anderson',
          address: '486 Redwood Ct, City, State',
          scheduledDate: '2024-01-17T10:00:00Z',
          status: 'Assigned',
          earnings: 35.00,
          orderId: 'ORDER-015'
        }
      ]
    }
  ],
  jobs: [
    {
      id: 1,
      bubblerName: 'John Smith',
      bubblerEmail: 'bubbler1@gogobubbles.com',
      serviceType: 'Home Cleaning',
      tier: 'Premium',
      customerName: 'Jane Doe',
      customerAddress: '123 Main St, City, State',
      jobDate: '2024-01-15',
      timeWindow: '9:00 AM - 11:00 AM',
      jobStatus: 'pending',
      deliveryRequired: true,
      photoRequired: true,
      photoLink: '',
      ratingGiven: null,
      earningsEstimate: 85.00,
      timestampCompleted: null,
    },
  ],
  equipment: [
    {
      id: 1,
      item: 'Vacuum Cleaner',
      assignedTo: 'John Smith',
      rentalDate: '2024-01-10',
      expectedReturn: '2024-01-20',
      returned: false,
      notes: 'Professional grade vacuum',
    },
  ],
}; 