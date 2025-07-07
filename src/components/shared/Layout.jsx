import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import useStore from '../../store/useStore';
import { 
  FiMenu as Menu,
  FiX as X,
  FiHome as Home,
  FiCalendar as Calendar,
  FiSettings as Settings,
  FiLogOut as LogOut,
  FiUser as User,
  FiBriefcase as Briefcase,
  FiCpu as QrCode,
  FiStar as Star,
  FiFileText as FileText,
  FiDollarSign as DollarSign,
  FiUsers as Users,
  FiBarChart2 as BarChart3
} from 'react-icons/fi';

const Layout = () => {
  const { user, isAdmin, logout, activeTab, setActiveTab } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const bubblerNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', color: 'text-cyan-600' },
    { name: 'Daily Jobs', icon: Calendar, path: '/jobs', color: 'text-cyan-600' },
    { name: 'Equipment', icon: Briefcase, path: '/equipment', color: 'text-cyan-600' },
    { name: 'Earnings', icon: DollarSign, path: '/earnings', color: 'text-cyan-600' },
    { name: 'Profile', icon: User, path: '/profile', color: 'text-cyan-600' },
  ];
  
  const adminNavItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', color: 'text-cyan-600' },
{ name: 'Orders', icon: FileText, path: '/orders', color: 'text-cyan-600' },
{ name: 'All Jobs', icon: Calendar, path: '/jobs', color: 'text-cyan-600' },
{ name: 'Equipment', icon: Briefcase, path: '/equipment', color: 'text-cyan-600' },
{ name: 'QR Scans', icon: QrCode, path: '/qr-scans', color: 'text-cyan-600' },
{ name: 'Ratings', icon: Star, path: '/ratings', color: 'text-cyan-600' },
{ name: 'Admin Notes', icon: FileText, path: '/admin-notes', color: 'text-cyan-600' },
{ name: 'Earnings', icon: DollarSign, path: '/earnings', color: 'text-cyan-600' },
{ name: 'Bubblers', icon: Users, path: '/bubblers', color: 'text-cyan-600' },
{ name: 'Analytics', icon: BarChart3, path: '/analytics', color: 'text-cyan-600' },
  ];
  const navItems = isAdmin ? adminNavItems : bubblerNavItems;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ maxHeight: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center h-16">
            <img src="/Bubblerlogotransparent.PNG" alt="GoGoBubbles" className="h-8" />
            <span className="ml-2 text-lg font-semibold text-gray-900">Bubbler</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3 flex-1">
          <div className="space-y-1">
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
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-cyan-600 hover:bg-gray-100 hover:text-teal-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-white' : item.color
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info and logout - sticky footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-cyan-100 rounded-full h-8 w-8 flex items-center justify-center font-bold text-cyan-700">
              {user?.name?.[0] || 'A'}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 mt-2"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 w-full z-30" style={{ height: '64px' }}>
          <div className="flex items-center h-16 justify-between px-6">
            <div className="flex items-center h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-500">Welcome,</span>
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                {isAdmin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-16">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white dashboard-welcome-banner" style={{marginTop: 0}}>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.name}! 
            </h1>
            <p className="text-blue-200">
              {isAdmin
                ? "Here's what's happening across all operations today."
                : 'You have a great day ahead with your scheduled jobs.'}
            </p>
          </div>
          {/* Dashboard Title */}
          <h1 className="text-xl font-semibold text-gray-900 mt-6 mb-4">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 