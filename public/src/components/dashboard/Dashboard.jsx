import React, { useState, useEffect } from 'react'
import { supabase, getCurrentBubblerId, getUserRole } from '../../lib/supabase'
import { 
  Briefcase, 
  Wrench, 
  MessageSquare, 
  Star, 
  DollarSign, 
  LogOut,
  User,
  Calendar,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  XCircle
} from 'lucide-react'
import ErrorMessage from '../shared/ErrorMessage'
import LoadingSpinner from '../shared/LoadingSpinner'

const Dashboard = ({ session }) => {
  const [activeTab, setActiveTab] = useState('jobs')
  const [currentBubblerId, setCurrentBubblerId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // TEMPORARY: Enhanced console logging for debugging until production is confirmed
        console.log('🚀 [DEBUG] Initializing dashboard with session:', {
          userId: session?.user?.id,
          email: session?.user?.email,
          sessionExists: !!session,
          timestamp: new Date().toISOString()
        })
        
        const [bubblerId, role] = await Promise.all([
          getCurrentBubblerId(),
          getUserRole()
        ])
        
        setCurrentBubblerId(bubblerId)
        setUserRole(role)
        setSessionInfo({ userId: session?.user?.id, email: session?.user?.email })
        
        console.log('✅ [DEBUG] Dashboard initialized successfully:', {
          bubblerId,
          role,
          sessionUserId: session?.user?.id,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('❌ [DEBUG] Error initializing dashboard:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          timestamp: new Date().toISOString()
        })
        
        // Set error state to prevent infinite loading
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    initializeDashboard()
  }, [session])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <ErrorMessage 
            error={error} 
            onRetry={() => {
              setError(null)
              setLoading(true)
              // Re-initialize dashboard
              const initializeDashboard = async () => {
                try {
                  console.log('🔄 [DEBUG] Retrying dashboard initialization...')
                  const [bubblerId, role] = await Promise.all([
                    getCurrentBubblerId(),
                    getUserRole()
                  ])
                  setCurrentBubblerId(bubblerId)
                  setUserRole(role)
                  setSessionInfo({ userId: session?.user?.id, email: session?.user?.email })
                  console.log('✅ [DEBUG] Dashboard retry successful')
                } catch (retryError) {
                  console.error('❌ [DEBUG] Dashboard retry failed:', retryError)
                  setError(retryError)
                } finally {
                  setLoading(false)
                }
              }
              initializeDashboard()
            }}
            title="Dashboard Initialization Failed"
            showRetry={true}
          />
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'jobs', label: 'Daily Jobs', icon: Briefcase },
    { id: 'equipment', label: 'Equipment', icon: Wrench },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'ratings', label: 'My Ratings', icon: Star },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'feedback', label: 'Lead Feedback', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                className="h-8 w-auto"
                src="/bubblers_logo.png"
                alt="GoGoBubbles"
              />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Bubbler Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {session.user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gogobubbles-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'tab-active'
                      : 'tab-inactive'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'jobs' && (
            <DailyJobsTab currentBubblerId={currentBubblerId} userRole={userRole} />
          )}
          {activeTab === 'equipment' && (
            <EquipmentTab currentBubblerId={currentBubblerId} userRole={userRole} />
          )}
          {activeTab === 'messages' && (
            <MessagesTab currentBubblerId={currentBubblerId} userRole={userRole} />
          )}
          {activeTab === 'ratings' && (
            <RatingsTab currentBubblerId={currentBubblerId} userRole={userRole} />
          )}
          {activeTab === 'earnings' && (
            <EarningsTab currentBubblerId={currentBubblerId} userRole={userRole} />
          )}
          {activeTab === 'feedback' && (
            <LeadFeedbackTab currentBubblerId={currentBubblerId} userRole={userRole} />
          )}
        </div>
      </main>
    </div>
  )
}

// Daily Jobs Tab Component
const DailyJobsTab = ({ currentBubblerId, userRole }) => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [currentBubblerId])

  const fetchJobs = async () => {
    if (!currentBubblerId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [DEBUG] Fetching jobs for bubbler:', currentBubblerId)
      
      // Query job assignments with RLS policy compliance
      // RLS: SELECT where job_assignments.bubbler_id = current_bubbler_id()
      const { data, error } = await supabase
        .from('job_assignments')
        .select(`
          *,
          jobs (
            id,
            title,
            description,
            location,
            scheduled_date,
            estimated_duration,
            base_pay
          )
        `)
        .eq('bubbler_id', currentBubblerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [DEBUG] Supabase error fetching jobs:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          bubblerId: currentBubblerId,
          timestamp: new Date().toISOString()
        })
        
        // Check for RLS errors specifically
        if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
          error.isRLSError = true
          error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
        }
        
        throw error
      }
      
      setJobs(data || [])
      console.log('✅ [DEBUG] Jobs fetched successfully:', {
        count: data?.length || 0,
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching jobs:', {
        error: error.message,
        code: error.code,
        isRLSError: error.isRLSError,
        timestamp: new Date().toISOString()
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleJobAction = async (jobId, action) => {
    try {
      const { error } = await supabase
        .from('job_assignments')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error
      
      // Refresh jobs
      fetchJobs()
    } catch (error) {
      console.error('Error updating job status:', error)
      setError(error)
    }
  }

  if (loading) return <LoadingSpinner text="Loading jobs..." />
  if (error) return <ErrorMessage error={error} onRetry={fetchJobs} title="Failed to load jobs" />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Daily Jobs</h2>
        <button
          onClick={fetchJobs}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs assigned</h3>
          <p className="mt-1 text-sm text-gray-500">Check back later for new job assignments.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div key={job.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {job.jobs?.title || 'Job Assignment'}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  job.status === 'offered' ? 'bg-yellow-100 text-yellow-800' :
                  job.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                  job.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                  job.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{job.jobs?.location || 'Location TBD'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{job.jobs?.scheduled_date ? new Date(job.jobs.scheduled_date).toLocaleDateString() : 'Date TBD'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{job.jobs?.estimated_duration || 'Duration TBD'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>${job.jobs?.base_pay || '0'}</span>
                </div>
              </div>

              {job.status === 'offered' && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleJobAction(job.id, 'accept')}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleJobAction(job.id, 'decline')}
                    className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Decline</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Equipment Tab Component
const EquipmentTab = ({ currentBubblerId, userRole }) => {
  const [availableEquipment, setAvailableEquipment] = useState([])
  const [myEquipment, setMyEquipment] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSubTab, setActiveSubTab] = useState('available')
  const [requesting, setRequesting] = useState(new Set())

  useEffect(() => {
    fetchEquipment()
  }, [currentBubblerId, activeSubTab])

  const fetchEquipment = async () => {
    if (!currentBubblerId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [DEBUG] Fetching equipment for bubbler:', {
        bubblerId: currentBubblerId,
        subtab: activeSubTab,
        timestamp: new Date().toISOString()
      })
      
      if (activeSubTab === 'available') {
        // Get available equipment (status = 'available') - filtered by RLS policy
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .eq('status', 'available')
          .order('name')

        if (error) {
          console.error('❌ [DEBUG] Supabase error fetching available equipment:', {
            error: error.message,
            code: error.code,
            details: error.details,
            subtab: activeSubTab,
            timestamp: new Date().toISOString()
          })
          
          // Check for RLS errors
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
            error.isRLSError = true
            error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
          }
          
          throw error
        }
        setAvailableEquipment(data || [])
        console.log('✅ [DEBUG] Available equipment fetched:', { count: data?.length || 0 })
      } else if (activeSubTab === 'my') {
        // Get my equipment (assigned to current bubbler) - filtered by RLS policy
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .eq('assigned_bubbler_id', currentBubblerId)
          .order('name')

        if (error) {
          console.error('❌ [DEBUG] Supabase error fetching my equipment:', {
            error: error.message,
            code: error.code,
            details: error.details,
            subtab: activeSubTab,
            timestamp: new Date().toISOString()
          })
          
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
            error.isRLSError = true
            error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
          }
          
          throw error
        }
        setMyEquipment(data || [])
        console.log('✅ [DEBUG] My equipment fetched:', { count: data?.length || 0 })
      } else if (activeSubTab === 'requests') {
        // Get my equipment requests - filtered by RLS policy
        const { data, error } = await supabase
          .from('equipment_requests')
          .select(`
            *,
            equipment (
              id,
              name,
              description
            )
          `)
          .eq('bubbler_id', currentBubblerId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ [DEBUG] Supabase error fetching equipment requests:', {
            error: error.message,
            code: error.code,
            details: error.details,
            subtab: activeSubTab,
            timestamp: new Date().toISOString()
          })
          
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
            error.isRLSError = true
            error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
          }
          
          throw error
        }
        setMyRequests(data || [])
        console.log('✅ [DEBUG] Equipment requests fetched:', { count: data?.length || 0 })
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching equipment:', {
        error: error.message,
        code: error.code,
        isRLSError: error.isRLSError,
        subtab: activeSubTab,
        timestamp: new Date().toISOString()
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEquipmentRequest = async (equipmentId) => {
    try {
      setRequesting(prev => new Set(prev).add(equipmentId))
      
      const { error } = await supabase
        .from('equipment_requests')
        .insert({
          equipment_id: equipmentId,
          bubbler_id: currentBubblerId,
          status: 'pending'
        })

      if (error) throw error
      
      // Refresh available equipment
      fetchEquipment()
    } catch (error) {
      console.error('Error requesting equipment:', error)
      setError(error)
    } finally {
      setRequesting(prev => {
        const newSet = new Set(prev)
        newSet.delete(equipmentId)
        return newSet
      })
    }
  }

  if (loading) return <LoadingSpinner text="Loading equipment..." />
  if (error) return <ErrorMessage error={error} onRetry={fetchEquipment} title="Failed to load equipment" />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Equipment</h2>
        <button
          onClick={fetchEquipment}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'available'
                ? 'tab-active'
                : 'tab-inactive'
            }`}
          >
            Available Equipment
          </button>
          <button
            onClick={() => setActiveSubTab('my')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'my'
                ? 'tab-active'
                : 'tab-inactive'
            }`}
          >
            My Gear
          </button>
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'requests'
                ? 'tab-active'
                : 'tab-inactive'
            }`}
          >
            My Requests
          </button>
        </nav>
      </div>

      {activeSubTab === 'available' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableEquipment.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No available equipment</h3>
              <p className="mt-1 text-sm text-gray-500">All equipment is currently assigned.</p>
            </div>
          ) : (
            availableEquipment.map((equipment) => (
              <div key={equipment.id} className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {equipment.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {equipment.description}
                </p>
                <button
                  onClick={() => handleEquipmentRequest(equipment.id)}
                  disabled={requesting.has(equipment.id)}
                  className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {requesting.has(equipment.id) ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gogobubbles-200 border-t-gogobubbles-600"></div>
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <span>Request Equipment</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'my' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myEquipment.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment assigned</h3>
              <p className="mt-1 text-sm text-gray-500">Request equipment from the Available tab.</p>
            </div>
          ) : (
            myEquipment.map((equipment) => (
              <div key={equipment.id} className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {equipment.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {equipment.description}
                </p>
                <div className="text-sm text-gray-500">
                  Assigned: {equipment.assigned_at ? new Date(equipment.assigned_at).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment requests</h3>
              <p className="mt-1 text-sm text-gray-500">Request equipment from the Available tab to see your request history.</p>
            </div>
          ) : (
            myRequests.map((request) => (
              <div key={request.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.equipment?.name || 'Equipment'}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'denied' ? 'bg-red-100 text-red-800' :
                    request.status === 'fulfilled' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {request.equipment?.description || 'No description available'}
                </p>
                <div className="text-sm text-gray-500">
                  Requested: {new Date(request.created_at).toLocaleDateString()}
                  {request.updated_at && request.updated_at !== request.created_at && (
                    <span className="ml-4">
                      Updated: {new Date(request.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Messages Tab Component
const MessagesTab = ({ currentBubblerId, userRole }) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({
    recipient_group: 'admin',
    message: ''
  })
  const [sending, setSending] = useState(false)
  const [markingRead, setMarkingRead] = useState(new Set())

  useEffect(() => {
    fetchMessages()
  }, [currentBubblerId])

  const fetchMessages = async () => {
    if (!currentBubblerId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [DEBUG] Fetching messages for bubbler:', {
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
      
      // Query messages with RLS policy compliance
      // RLS: SELECT: sender OR staff in the matching group
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('bubbler_id', currentBubblerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [DEBUG] Supabase error fetching messages:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          bubblerId: currentBubblerId,
          timestamp: new Date().toISOString()
        })
        
        // Check for RLS errors
        if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
          error.isRLSError = true
          error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
        }
        
        throw error
      }
      
      setMessages(data || [])
      console.log('✅ [DEBUG] Messages fetched successfully:', {
        count: data?.length || 0,
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching messages:', {
        error: error.message,
        code: error.code,
        isRLSError: error.isRLSError,
        timestamp: new Date().toISOString()
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    try {
      setSending(true)
      
      const { error } = await supabase
        .from('messages')
        .insert({
          bubbler_id: currentBubblerId,
          recipient_group: composeData.recipient_group,
          message: composeData.message
        })

      if (error) throw error
      
      // Reset form and refresh messages
      setComposeData({ recipient_group: 'admin', message: '' })
      setShowCompose(false)
      fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      setError(error)
    } finally {
      setSending(false)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    if (!['admin', 'support', 'leader'].includes(userRole)) return
    
    try {
      setMarkingRead(prev => new Set(prev).add(messageId))
      
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId)

      if (error) throw error
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ))
    } catch (error) {
      console.error('Error marking message as read:', error)
      setError(error)
    } finally {
      setMarkingRead(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageId)
        return newSet
      })
    }
  }

  if (loading) return <LoadingSpinner text="Loading messages..." />
  if (error) return <ErrorMessage error={error} onRetry={fetchMessages} title="Failed to load messages" />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="btn-primary"
          >
            {showCompose ? 'Cancel' : 'Compose'}
          </button>
          <button
            onClick={fetchMessages}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Compose Message */}
      {showCompose && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h3>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to:
              </label>
              <select
                value={composeData.recipient_group}
                onChange={(e) => setComposeData({ ...composeData, recipient_group: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gogobubbles-500 focus:border-gogobubbles-500"
              >
                <option value="admin">Admin</option>
                <option value="support">Support</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message:
              </label>
              <textarea
                value={composeData.message}
                onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gogobubbles-500 focus:border-gogobubbles-500"
                placeholder="Type your message here..."
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              disabled={sending}
            >
              {sending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gogobubbles-200 border-t-gogobubbles-600"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
            <p className="mt-1 text-sm text-gray-500">Start a conversation by composing a message.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`card ${!message.is_read ? 'border-l-4 border-l-gogobubbles-500' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    To: {message.recipient_group}
                  </span>
                  {!message.is_read && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gogobubbles-100 text-gogobubbles-800">
                      New
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                  {['admin', 'support', 'leader'].includes(userRole) && !message.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(message.id)}
                      disabled={markingRead.has(message.id)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gogobubbles-700 bg-gogobubbles-100 hover:bg-gogobubbles-200 rounded-md disabled:opacity-50"
                    >
                      {markingRead.has(message.id) ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gogobubbles-200 border-t-gogobubbles-600 mr-1"></div>
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700">{message.message}</p>
              {message.read_at && (
                <div className="mt-2 text-xs text-gray-500">
                  Read at: {new Date(message.read_at).toLocaleString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Ratings Tab Component
const RatingsTab = ({ currentBubblerId, userRole }) => {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRatings()
  }, [currentBubblerId])

  const fetchRatings = async () => {
    if (!currentBubblerId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [DEBUG] Fetching ratings for bubbler:', {
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
      
      // Query ratings with RLS policy compliance
      // RLS: SELECT ratings where the joined job_assignments.bubbler_id = current_bubbler_id()
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          job_assignments!inner (
            id,
            jobs (
              id,
              title,
              scheduled_date
            )
          )
        `)
        .eq('job_assignments.bubbler_id', currentBubblerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [DEBUG] Supabase error fetching ratings:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          bubblerId: currentBubblerId,
          timestamp: new Date().toISOString()
        })
        
        // Check for RLS errors
        if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
          error.isRLSError = true
          error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
        }
        
        throw error
      }
      
      setRatings(data || [])
      console.log('✅ [DEBUG] Ratings fetched successfully:', {
        count: data?.length || 0,
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching ratings:', {
        error: error.message,
        code: error.code,
        isRLSError: error.isRLSError,
        timestamp: new Date().toISOString()
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading ratings..." />
  if (error) return <ErrorMessage error={error} onRetry={fetchRatings} title="Failed to load ratings" />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Ratings</h2>
        <button
          onClick={fetchRatings}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {ratings.length === 0 ? (
        <div className="text-center py-12">
          <Star className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No ratings yet</h3>
          <p className="mt-1 text-sm text-gray-500">Complete jobs to receive customer ratings.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ratings.map((rating) => (
            <div key={rating.id} className="card">
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < rating.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {rating.rating}/5
                </span>
              </div>
              
              {rating.feedback && (
                <p className="text-gray-700 mb-3">{rating.feedback}</p>
              )}
              
              <div className="text-sm text-gray-500">
                <div>Job: {rating.job_assignments?.jobs?.title || 'Unknown Job'}</div>
                <div>Date: {rating.job_assignments?.jobs?.scheduled_date ? new Date(rating.job_assignments.jobs.scheduled_date).toLocaleDateString() : 'Unknown Date'}</div>
                <div>Rated: {new Date(rating.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Earnings Tab Component
const EarningsTab = ({ currentBubblerId, userRole }) => {
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEarnings()
  }, [currentBubblerId])

  const fetchEarnings = async () => {
    if (!currentBubblerId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [DEBUG] Fetching earnings for bubbler:', {
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
      
      // Call the RPC function for earnings breakdown
      // This will return base_amount and tips_amount
      const { data, error } = await supabase
        .rpc('get_my_earnings_breakdown')

      if (error) {
        console.error('❌ [DEBUG] Supabase error fetching earnings:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          bubblerId: currentBubblerId,
          timestamp: new Date().toISOString()
        })
        
        // Check for RLS errors
        if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
          error.isRLSError = true
          error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
        }
        
        throw error
      }
      
      setEarnings(data)
      console.log('✅ [DEBUG] Earnings fetched successfully:', {
        data,
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching earnings:', {
        error: error.message,
        code: error.code,
        isRLSError: error.isRLSError,
        timestamp: new Date().toISOString()
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading earnings..." />
  if (error) return <ErrorMessage error={error} onRetry={fetchEarnings} title="Failed to load earnings" />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Earnings</h2>
        <button
          onClick={fetchEarnings}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {earnings ? (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Base Pay</h3>
                  <p className="text-sm text-gray-500">From completed jobs</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                ${earnings.base_amount || 0}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tips</h3>
                  <p className="text-sm text-gray-500">Customer appreciation</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600">
                ${earnings.tips_amount || 0}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Earnings</h3>
            <div className="text-4xl font-bold text-gogobubbles-600">
              ${(earnings.base_amount || 0) + (earnings.tips_amount || 0)}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No earnings data</h3>
          <p className="mt-1 text-sm text-gray-500">Complete jobs to see your earnings.</p>
        </div>
      )}
    </div>
  )
}

// Lead Feedback Tab Component
const LeadFeedbackTab = ({ currentBubblerId, userRole }) => {
  const [feedback, setFeedback] = useState([])
  const [leadReviews, setLeadReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSubTab, setActiveSubTab] = useState('feedback')
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({
    lead_id: '',
    feedback: '',
    is_anonymous: true
  })
  const [sending, setSending] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewData, setReviewData] = useState({
    lead_id: '',
    review_text: '',
    rating: 5,
    review_date: new Date().toISOString().split('T')[0]
  })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (activeSubTab === 'feedback') {
      fetchFeedback()
    } else if (activeSubTab === 'reviews') {
      fetchLeadReviews()
    }
  }, [currentBubblerId, userRole, activeSubTab])

  const fetchFeedback = async () => {
    if (!currentBubblerId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [DEBUG] Fetching feedback for user role:', {
        userRole,
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
      
      if (['admin', 'support', 'leader'].includes(userRole)) {
        // Staff can see all feedback
        const { data, error } = await supabase
          .from('bubbler_feedback')
          .select(`
            *,
            bubblers (
              id,
              first_name,
              last_name
            ),
            leads (
              id,
              first_name,
              last_name
            )
          `)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ [DEBUG] Supabase error fetching staff feedback:', {
            error: error.message,
            code: error.code,
            details: error.details,
            userRole,
            timestamp: new Date().toISOString()
          })
          
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
            error.isRLSError = true
            error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
          }
          
          throw error
        }
        setFeedback(data || [])
        console.log('✅ [DEBUG] Staff feedback fetched:', { count: data?.length || 0 })
      } else if (userRole === 'lead') {
        // Leads can see feedback about themselves via RPC
        const { data, error } = await supabase
          .rpc('get_bubbler_feedback_for_current_lead')

        if (error) {
          console.error('❌ [DEBUG] Supabase error fetching lead feedback via RPC:', {
            error: error.message,
            code: error.code,
            details: error.details,
            userRole,
            timestamp: new Date().toISOString()
          })
          
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
            error.isRLSError = true
            error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
          }
          
          throw error
        }
        setFeedback(data || [])
        console.log('✅ [DEBUG] Lead feedback fetched via RPC:', { count: data?.length || 0 })
      } else {
        // Bubblers can see their own feedback
        const { data, error } = await supabase
          .from('bubbler_feedback')
          .select(`
            *,
            leads (
              id,
              first_name,
              last_name
            )
          `)
          .eq('bubbler_id', currentBubblerId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ [DEBUG] Supabase error fetching bubbler feedback:', {
            error: error.message,
            code: error.code,
            details: error.details,
            userRole,
            bubblerId: currentBubblerId,
            timestamp: new Date().toISOString()
          })
          
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
            error.isRLSError = true
            error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
          }
          
          throw error
        }
        setFeedback(data || [])
        console.log('✅ [DEBUG] Bubbler feedback fetched:', { count: data?.length || 0 })
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching feedback:', {
        error: error.message,
        code: error.code,
        isRLSError: error.isRLSError,
        userRole,
        timestamp: new Date().toISOString()
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadReviews = async () => {
    if (!currentBubblerId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 [DEBUG] Fetching lead reviews for user role:', {
        userRole,
        bubblerId: currentBubblerId,
        timestamp: new Date().toISOString()
      })
      
      if (['admin', 'support', 'leader'].includes(userRole)) {
        // Staff can see all lead reviews
        const { data, error } = await supabase
          .from('lead_bubbler_review')
          .select(`
            *,
            leads (
              id,
              first_name,
              last_name
            ),
            reviewers (
              id,
              first_name,
              last_name
            )
          `)
          .order('review_date', { ascending: false })

        if (error) {
          console.error('❌ [DEBUG] Supabase error fetching staff lead reviews:', {
            error: error.message,
            code: error.code,
            details: error.details,
            userRole,
            timestamp: new Date().toISOString()
          })
          
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
            error.isRLSError = true
            error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
          }
          
          throw error
        }
        setLeadReviews(data || [])
        console.log('✅ [DEBUG] Staff lead reviews fetched:', { count: data?.length || 0 })
      } else if (userRole === 'lead') {
        // Leads can see reviews about themselves
        const { data, error } = await supabase
          .from('lead_bubbler_review')
          .select(`
            *,
            reviewers (
              id,
              first_name,
              last_name
            )
          `)
          .eq('lead_id', currentBubblerId)
          .order('review_date', { ascending: false })

        if (error) {
          console.error('❌ [DEBUG] Supabase error fetching lead reviews:', {
            error: error.message,
            code: error.code,
            details: error.details,
            userRole,
            bubblerId: currentBubblerId,
            timestamp: new Date().toISOString()
          })
          
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
            error.isRLSError = true
            error.hint = 'This may be due to Row Level Security policies. Please contact support if you believe this is an error.'
          }
          
          throw error
        }
        setLeadReviews(data || [])
        console.log('✅ [DEBUG] Lead reviews fetched:', { count: data?.length || 0 })
      } else {
        // Bubblers don't have access to lead reviews
        setLeadReviews([])
        console.log('✅ [DEBUG] No access to lead reviews for bubbler role')
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching lead reviews:', {
        error: error.message,
        code: error.code,
        isRLSError: error.isRLSError,
        userRole,
        timestamp: new Date().toISOString()
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    
    try {
      setSending(true)
      
      const { error } = await supabase
        .from('bubbler_feedback')
        .insert({
          bubbler_id: currentBubblerId,
          lead_id: composeData.lead_id,
          feedback: composeData.feedback,
          is_anonymous: composeData.is_anonymous
        })

      if (error) throw error
      
      // Reset form and refresh feedback
      setComposeData({ lead_id: '', feedback: '', is_anonymous: true })
      setShowCompose(false)
      fetchFeedback()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setError(error)
    } finally {
      setSending(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    try {
      setSubmittingReview(true)
      
      const { error } = await supabase
        .from('lead_bubbler_review')
        .insert({
          lead_id: reviewData.lead_id,
          reviewer_id: currentBubblerId,
          review_text: reviewData.review_text,
          rating: reviewData.rating,
          review_date: reviewData.review_date
        })

      if (error) throw error
      
      // Reset form and refresh reviews
      setReviewData({
        lead_id: '',
        review_text: '',
        rating: 5,
        review_date: new Date().toISOString().split('T')[0]
      })
      setShowReviewForm(false)
      fetchLeadReviews()
    } catch (error) {
      console.error('Error submitting review:', error)
      setError(error)
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading..." />
  if (error) return <ErrorMessage error={error} onRetry={activeSubTab === 'feedback' ? fetchFeedback : fetchLeadReviews} title="Failed to load data" />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Lead Feedback & Reviews</h2>
        <div className="flex space-x-2">
          {userRole === 'bubbler' && activeSubTab === 'feedback' && (
            <button
              onClick={() => setShowCompose(!showCompose)}
              className="btn-primary"
            >
              {showCompose ? 'Cancel' : 'Submit Feedback'}
            </button>
          )}
          {['admin', 'support', 'leader'].includes(userRole) && activeSubTab === 'reviews' && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn-primary"
            >
              {showReviewForm ? 'Cancel' : 'Add Review'}
            </button>
          )}
          <button
            onClick={activeSubTab === 'feedback' ? fetchFeedback : fetchLeadReviews}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('feedback')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'feedback'
                ? 'border-gogobubbles-500 text-gogobubbles-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bubbler Feedback
          </button>
          <button
            onClick={() => setActiveSubTab('reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'reviews'
                ? 'border-gogobubbles-500 text-gogobubbles-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lead Reviews
          </button>
        </nav>
      </div>

      {/* Feedback Sub-tab Content */}
      {activeSubTab === 'feedback' && (
        <>
          {/* Compose Feedback Form (Bubblers only) */}
          {showCompose && userRole === 'bubbler' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Feedback</h3>
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead ID:
                  </label>
                  <input
                    type="text"
                    value={composeData.lead_id}
                    onChange={(e) => setComposeData({ ...composeData, lead_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gogobubbles-500 focus:border-gogobubbles-500"
                    placeholder="Enter lead ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback:
                  </label>
                  <textarea
                    value={composeData.feedback}
                    onChange={(e) => setComposeData({ ...composeData, feedback: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gogobubbles-500 focus:border-gogobubbles-500"
                    placeholder="Share your feedback about the lead..."
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={composeData.is_anonymous}
                    onChange={(e) => setComposeData({ ...composeData, is_anonymous: e.target.checked })}
                    className="h-4 w-4 text-gogobubbles-600 focus:ring-gogobubbles-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                    Submit anonymously
                  </label>
                </div>
                <button 
                  type="submit" 
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gogobubbles-200 border-t-gogobubbles-600"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Feedback List */}
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {userRole === 'bubbler' ? 'Submit feedback about leads you work with.' : 'Feedback will appear here once submitted.'}
                </p>
              </div>
            ) : (
              feedback.map((item) => (
                <div key={item.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {userRole === 'bubbler' ? (
                        <span className="text-sm font-medium text-gray-900">
                          About: {item.leads?.first_name} {item.leads?.last_name}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          From: {item.is_anonymous ? 'Anonymous' : `${item.bubblers?.first_name} ${item.bubblers?.last_name}`}
                        </span>
                      )}
                      {item.is_anonymous && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Anonymous
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{item.feedback}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Reviews Sub-tab Content */}
      {activeSubTab === 'reviews' && (
        <>
          {/* Compose Review Form (Staff only) */}
          {showReviewForm && ['admin', 'support', 'leader'].includes(userRole) && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Lead Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead ID:
                  </label>
                  <input
                    type="text"
                    value={reviewData.lead_id}
                    onChange={(e) => setReviewData({ ...reviewData, lead_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gogobubbles-500 focus:border-gogobubbles-500"
                    placeholder="Enter lead ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Text:
                  </label>
                  <textarea
                    value={reviewData.review_text}
                    onChange={(e) => setReviewData({ ...reviewData, review_text: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gogobubbles-500 focus:border-gogobubbles-500"
                    placeholder="Write your review of the lead..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating:
                  </label>
                  <select
                    value={reviewData.rating}
                    onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gogobubbles-500 focus:border-gogobubbles-500"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Below Average</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Date:
                  </label>
                  <input
                    type="date"
                    value={reviewData.review_date}
                    onChange={(e) => setReviewData({ ...reviewData, review_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gogobubbles-500 focus:border-gogobubbles-500"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gogobubbles-200 border-t-gogobubbles-600"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {leadReviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {['admin', 'support', 'leader'].includes(userRole) ? 'Add reviews for leads you work with.' : 'Reviews will appear here once submitted.'}
                </p>
              </div>
            ) : (
              leadReviews.map((review) => (
                <div key={review.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {['admin', 'support', 'leader'].includes(userRole) ? (
                        <span className="text-sm font-medium text-gray-900">
                          Lead: {review.leads?.first_name} {review.leads?.last_name}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          Reviewed by: {review.reviewers?.first_name} {review.reviewers?.last_name}
                        </span>
                      )}
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm font-medium text-gray-900 ml-1">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.review_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.review_text}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
