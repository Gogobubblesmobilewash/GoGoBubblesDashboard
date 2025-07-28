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
  FiTarget as Target
} from 'react-icons/fi';
import MessageNotifications from '../messages/MessageNotifications';
import NotificationCenter from '../activity/NotificationCenter';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const location = useLocation();
  const { user, logout, isAdmin, isBubbler, isSupport } = useAuth();

  // Debug logging
  console.log('Layout render - user:', user, 'isAdmin:', isAdmin, 'activeTab:', activeTab);

  const bubblerNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Daily Jobs', icon: Calendar, path: '/jobs' },
    { name: 'Equipment', icon: Briefcase, path: '/equipment' },
    ...(canDoLaundry ? [{ name: 'QR Scanner', icon: Camera, path: '/qr-scanner' }] : []),
    { name: 'Earnings', icon: DollarSign, path: '/earnings' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];
  
  const adminNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Orders', icon: FileText, path: '/orders' },
    { name: 'All Jobs', icon: Calendar, path: '/admin/jobs' },
    { name: 'Equipment', icon: Briefcase, path: '/admin/equipment' },
    { name: 'Applicants', icon: Users, path: '/applicants' },
    { name: 'Ratings', icon: Star, path: '/ratings' },
    { name: 'Messages', icon: MessageCircle, path: '/messages' },
    { name: 'Activity Feed', icon: Clock, path: '/activity' },
    { name: 'Advanced Analytics', icon: BarChart3, path: '/advanced-analytics' },
    { name: 'Performance Monitor', icon: Activity, path: '/performance' },
    { name: 'Automated Reporting', icon: FileText, path: '/automated-reporting' },
    { name: 'Business Intelligence', icon: TrendingUp, path: '/business-intelligence' },
    { name: 'Automated Workflows', icon: Workflow, path: '/automated-workflows' },
    { name: 'Customer Analytics', icon: Users, path: '/customer-analytics' },
    { name: 'Elite Bubbler Management', icon: Award, path: '/elite-bubbler-management' },
    { name: 'Bubbler Morale', icon: Heart, path: '/bubbler-morale' },
    { name: 'Job Assignment Caps', icon: Target, path: '/job-assignment-caps' },
    { name: 'Admin Notes', icon: FileText, path: '/admin-notes' },
    { name: 'Earnings', icon: DollarSign, path: '/earnings' },
    { name: 'Bubblers', icon: Users, path: '/bubblers' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
  ];

  const supportNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Orders', icon: FileText, path: '/orders' },
    { name: 'Bubblers', icon: Users, path: '/bubblers' },
    { name: 'Applicants', icon: Users, path: '/applicants' },
    { name: 'Equipment', icon: Briefcase, path: '/equipment' },
    { name: 'Messages', icon: MessageCircle, path: '/messages' },
    { name: 'Ratings', icon: Star, path: '/ratings' },
  ];
  
  const navItems = isAdmin ? adminNavItems : isSupport ? supportNavItems : bubblerNavItems;

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
                {isAdmin ? 'Admin' : isSupport ? 'Support' : 'Bubbler'}
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
          <nav className="mt-6 px-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
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
                    <Icon className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-brand-aqua'
                    }`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info and logout - sticky footer */}
          <div className="px-4 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-gradient-primary rounded-full h-10 w-10 flex items-center justify-center font-bold text-white text-lg">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{user?.name}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex-shrink-0 z-30">
          <div className="flex items-center h-full justify-between px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {/* Activity Notifications */}
              <NotificationCenter />
              
              {/* Message Notifications */}
              <MessageNotifications />
              
              <div className="hidden sm:flex items-center space-x-3">
                <span className="text-sm text-gray-500">Welcome,</span>
                <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
                {isAdmin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-red text-white">
                    Admin
                  </span>
                )}
                {isSupport && !isAdmin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white">
                    Support
                  </span>
                )}
                {isBubbler && !isAdmin && !isSupport && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-aqua text-white">
                    Bubbler
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-primary rounded-2xl p-6 text-white shadow-card mb-6">
            <h1 className="text-2xl font-bold mb-2 font-poppins">
              Welcome back, {user?.name}! 
            </h1>
            <p className="text-blue-100 font-medium">
              {isAdmin
                ? "Here's what's happening across all operations today."
                : isSupport
                ? "Here's what you need to know to help customers today."
                : 'You have a great day ahead with your scheduled jobs.'}
            </p>
          </div>
          
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 