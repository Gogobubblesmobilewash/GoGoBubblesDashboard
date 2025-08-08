import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import useStore from '../../store/useStore';
import { useAuth } from '../../store/AuthContext';
import { 
  FiMenu as Menu,
  FiX as X,
  FiHome as Home,
  FiCalendar as Calendar,
  FiSettings as Settings,
  FiLogOut as LogOut,
  FiUser as User,
  FiBriefcase as Briefcase,
  FiStar as Star,
  FiFileText as FileText,
  FiDollarSign as DollarSign,
  FiUsers as Users,
  FiBarChart2 as BarChart3,
  FiCamera as Camera,
  FiMessageCircle as MessageCircle,
  FiClock as Clock,
  FiActivity as Activity,
  FiTrendingUp as TrendingUp,
  FiGitBranch as Workflow,
  FiAward as Award,
  FiHeart as Heart,
  FiTarget as Target,
  FiCreditCard as CreditCard,
  FiDownload as Download,
  FiUserPlus as UserPlus,
  FiAlertCircle as AlertCircle,
  FiEye as Eye,
  FiCheckCircle as CheckCircle,
  FiBarChart2 as BarChart2,
  FiShield as Shield
} from 'react-icons/fi';
import MessageNotifications from '../messages/MessageNotifications';
import NotificationCenter from '../activity/NotificationCenter';
import FeedbackNotifications from '../admin/FeedbackNotifications';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const location = useLocation();
  const { user, logout, isAdmin, isBubbler, isSupport, isFinance, isRecruiter, isMarketManager, isLeadBubbler, canDoLaundry } = useAuth();

  // Debug logging
  console.log('Layout render - user:', user, 'isAdmin:', isAdmin, 'activeTab:', activeTab);
  console.log('Layout render - location.pathname:', location.pathname);

  const bubblerNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Daily Jobs', icon: Calendar, path: 'jobs' },
    { name: 'Equipment', icon: Briefcase, path: 'equipment' },
    ...(canDoLaundry ? [{ name: 'QR Scanner', icon: Camera, path: 'qr-scanner' }] : []),
    { name: 'Earnings', icon: DollarSign, path: 'earnings' },
    { name: 'Profile', icon: User, path: 'profile' },
  ];
  
  const adminNavItems = [
  { name: 'Dashboard', icon: Home, path: '/dashboard' },
  { name: 'User Management', icon: Users, path: 'user-management' },
  { name: 'Lead Bubbler Shifts', icon: Calendar, path: 'lead-bubbler-shifts' },
  { name: 'Takeover Verification', icon: CheckCircle, path: 'takeover-verification' },
  { name: 'Lead Bubbler Oversight', icon: Eye, path: 'lead-bubbler-oversight' },
  { name: 'Lead Bubbler Performance', icon: BarChart2, path: 'lead-bubbler-performance' },
  { name: 'Lead Bubbler Retention', icon: Shield, path: 'lead-bubbler-retention' },
  { name: 'Orders', icon: FileText, path: 'orders' },
  { name: 'All Jobs', icon: Calendar, path: 'admin/jobs' },
    { name: 'Equipment', icon: Briefcase, path: 'admin/equipment' },
    { name: 'Applicants', icon: Users, path: 'applicants' },
    { name: 'Ratings', icon: Star, path: 'ratings' },
    { name: 'Messages', icon: MessageCircle, path: 'messages' },
    { name: 'Activity Feed', icon: Clock, path: 'activity' },
    { name: 'Advanced Analytics', icon: BarChart3, path: 'advanced-analytics' },
    { name: 'Performance Monitor', icon: Activity, path: 'performance' },
    { name: 'Automated Reporting', icon: FileText, path: 'automated-reporting' },
    { name: 'Business Intelligence', icon: TrendingUp, path: 'business-intelligence' },
    { name: 'Automated Workflows', icon: Workflow, path: 'automated-workflows' },
    { name: 'Customer Analytics', icon: Users, path: 'customer-analytics' },
            { name: 'EliteBubbler Management', icon: Award, path: 'elite-bubbler-management' },
    { name: 'Bubbler Morale', icon: Heart, path: 'bubbler-morale' },
    { name: 'Job Assignment Caps', icon: Target, path: 'job-assignment-caps' },
    { name: 'Admin Notes', icon: FileText, path: 'admin-notes' },
    { name: 'Earnings', icon: DollarSign, path: 'earnings' },
    { name: 'Bubblers', icon: Users, path: 'bubblers' },
    { name: 'Analytics', icon: BarChart3, path: 'analytics' },
  ];

  const supportNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Orders', icon: FileText, path: 'orders' },
    { name: 'Job Assignment', icon: Calendar, path: 'support/jobs' },
    { name: 'Bubblers', icon: Users, path: 'bubblers' },
    { name: 'Applicants', icon: Users, path: 'applicants' },
    { name: 'Equipment', icon: Briefcase, path: 'equipment' },
    { name: 'Messages', icon: MessageCircle, path: 'messages' },
    { name: 'Ratings', icon: Star, path: 'ratings' },
  ];

  const financeNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Revenue Reports', icon: DollarSign, path: 'revenue' },
    { name: 'Payout History', icon: TrendingUp, path: 'payouts' },
    { name: 'Stripe Reports', icon: CreditCard, path: 'stripe' },
    { name: 'Tax Reports', icon: FileText, path: 'tax-reports' },
    { name: 'Export Data', icon: Download, path: 'export' },
  ];

  const recruiterNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Applicants', icon: Users, path: 'applicants' },
    { name: 'Interview Schedule', icon: Calendar, path: 'interviews' },
    { name: 'Onboarding Queue', icon: UserPlus, path: 'onboarding' },
    { name: 'Flagged Applications', icon: AlertCircle, path: 'flagged' },
    { name: 'Export Reports', icon: Download, path: 'export' },
  ];

  const marketManagerNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Local Jobs', icon: Briefcase, path: 'market/jobs' },
    { name: 'Local Bubblers', icon: Users, path: 'bubblers' },
    { name: 'Local Applicants', icon: UserPlus, path: 'applicants' },
    { name: 'Local Equipment', icon: Briefcase, path: 'equipment' },
    { name: 'Local Messages', icon: MessageCircle, path: 'messages' },
    { name: 'Local Reports', icon: BarChart3, path: 'reports' },
  ];

  const leadBubblerNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Team Jobs', icon: Briefcase, path: 'lead/jobs' },
    { name: 'Team Members', icon: Users, path: 'team' },
    { name: 'Equipment Status', icon: Briefcase, path: 'equipment' },
    { name: 'Team Messages', icon: MessageCircle, path: 'messages' },
    { name: 'Issue Reports', icon: AlertCircle, path: 'issues' },
  ];
  
  const navItems = isAdmin ? adminNavItems : 
                   isSupport ? supportNavItems :
                   isFinance ? financeNavItems :
                   isRecruiter ? recruiterNavItems :
                   isMarketManager ? marketManagerNavItems :
                   isLeadBubbler ? leadBubblerNavItems :
                   bubblerNavItems;
  
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-card transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <img src="/bubblers_logo.png" alt="GoGoBubbles" className="h-10" />
              <span className="ml-3 text-lg font-bold text-gray-800 font-poppins">
                {isAdmin ? 'Admin' : 
                 isSupport ? 'Support' : 
                 isFinance ? 'Finance' :
                 isRecruiter ? 'Recruiter' :
                 isMarketManager ? 'Market Manager' :
                 isLeadBubbler ? 'Lead Bubbler' :
                 'Bubbler'}
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => {
                    setActiveTab(item.name.toLowerCase());
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-primary text-white shadow-lg transform -translate-y-0.5'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand-aqua'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-brand-aqua rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? 'Administrator' : 
                     isSupport ? 'Support' : 
                     isFinance ? 'Finance' :
                     isRecruiter ? 'Recruiter' :
                     isMarketManager ? 'Market Manager' :
                     isLeadBubbler ? 'Lead Bubbler' :
                     'Bubbler'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {(isAdmin || isSupport) && <FeedbackNotifications />}
              <MessageNotifications />
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
};

export default Layout; 