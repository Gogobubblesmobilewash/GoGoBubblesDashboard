import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Authentication
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      rememberMe: false,

      // Orders (from Orders sheet)
      orders: [],
      
      // Jobs (from Jobs sheet - created after splitting orders)
      jobs: [],
      dailyJobs: [],
      jobStatuses: ['pending', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled'],

      // Equipment
      equipment: [],
      assignedEquipment: [],

      // QR Scans
      qrScans: [],

      // Ratings
      ratings: [],

      // Admin Notes
      adminNotes: [],

      // UI State
      loading: false,
      error: null,
      activeTab: 'dashboard',

      // Actions
      login: (userData) => {
        set({
          user: userData,
          isAuthenticated: true,
          isAdmin: true,
          error: null
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          orders: [],
          jobs: [],
          dailyJobs: [],
          equipment: [],
          assignedEquipment: [],
          qrScans: [],
          ratings: [],
          adminNotes: [],
          loading: false,
          error: null,
          activeTab: 'dashboard'
        });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Order Actions
      setOrders: (orders) => set({ orders }),
      updateOrder: (orderId, updates) => {
        const { orders } = get();
        const updatedOrders = orders.map(order => 
          (order['Order ID'] || order.orderId) === orderId ? { ...order, ...updates } : order
        );
        set({ orders: updatedOrders });
      },

      // Job Actions
      setJobs: (jobs) => set({ jobs }),
      setDailyJobs: (jobs) => set({ dailyJobs: jobs }),
      updateJobStatus: (jobId, status) => {
        const { jobs, dailyJobs } = get();
        const updatedJobs = jobs.map(job => 
          job.id === jobId ? { ...job, status } : job
        );
        const updatedDailyJobs = dailyJobs.map(job => 
          job.id === jobId ? { ...job, status } : job
        );
        set({ jobs: updatedJobs, dailyJobs: updatedDailyJobs });
      },

      // Equipment Actions
      setEquipment: (equipment) => set({ equipment }),
      setAssignedEquipment: (equipment) => set({ assignedEquipment: equipment }),
      updateEquipmentStatus: (equipmentId, status) => {
        const { equipment, assignedEquipment } = get();
        const updatedEquipment = equipment.map(item => 
          item.id === equipmentId ? { ...item, status } : item
        );
        const updatedAssignedEquipment = assignedEquipment.map(item => 
          item.id === equipmentId ? { ...item, status } : item
        );
        set({ equipment: updatedEquipment, assignedEquipment: updatedAssignedEquipment });
      },

      // QR Scan Actions
      setQrScans: (scans) => set({ qrScans: scans }),
      addQrScan: (scan) => {
        const { qrScans } = get();
        set({ qrScans: [...qrScans, scan] });
      },

      // Ratings Actions
      setRatings: (ratings) => set({ ratings }),

      // Admin Notes Actions
      setAdminNotes: (notes) => set({ adminNotes: notes }),
      addAdminNote: (note) => {
        const { adminNotes } = get();
        set({ adminNotes: [...adminNotes, note] });
      },

      // Remember Me
      setRememberMe: (remember) => set({ rememberMe: remember }),
    }),
    {
      name: 'bubbler-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        rememberMe: state.rememberMe,
      }),
    }
  )
);

export default useStore; 