// src/components/common/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth';
import { 
  FaHome, 
  FaChartLine, 
  FaExchangeAlt, 
  FaFlag, 
  FaRobot, 
  FaBookmark, 
  FaNewspaper,
  FaSignOutAlt,
  FaUserShield,
  FaBars,
  FaTimes,
  FaEdit
} from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = user?.is_admin;

  // Automatically collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Menu items with icons for regular users
  const regularUserMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome className="w-5 h-5" /> },
    { path: '/transactions', label: 'Transactions', icon: <FaExchangeAlt className="w-5 h-5" /> },
    { path: '/goals', label: 'Goals', icon: <FaFlag className="w-5 h-5" /> },
    { path: '/financial-health', label: 'Financial Health', icon: <FaChartLine className="w-5 h-5" /> },
    { path: '/ai-advisor', label: 'AI Advisor', icon: <FaRobot className="w-5 h-5" /> },
    { path: '/articles', label: 'Articles', icon: <FaNewspaper className="w-5 h-5" /> },
    { path: '/bookmarks', label: 'Bookmarks', icon: <FaBookmark className="w-5 h-5" /> },
  ];

  // Menu items for admin users
  const adminMenuItems = [
    { path: '/admin-dashboard', label: 'Admin Dashboard', icon: <FaUserShield className="w-5 h-5" /> },
    { path: '/admin/articles', label: 'Article Management', icon: <FaEdit className="w-5 h-5" /> },
    
  ];

  // Choose which menu items to display based on user role
  const menuItemsToDisplay = isAdmin ? adminMenuItems : regularUserMenuItems;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile menu toggle button */}
      <div className="fixed top-4 left-4 z-30 lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white focus:outline-none"
        >
          {isMobileMenuOpen ? (
            <FaTimes className="w-6 h-6" />
          ) : (
            <FaBars className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar container */}
      <div
        className={`fixed inset-y-0 left-0 z-20 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-indigo-800 to-purple-900 text-white`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-700">
          {isSidebarOpen && (
            <div className="text-xl font-bold tracking-wider">Cashflow</div>
          )}
          {!isMobileMenuOpen && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-indigo-700 focus:outline-none hidden lg:block"
            >
              {isSidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* User info */}
        {isSidebarOpen && user && (
          <div className="px-4 py-3 border-b border-indigo-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-sm font-medium">{user.username || user.email}</div>
                <div className="text-xs text-indigo-200">{isAdmin ? 'Administrator' : 'User'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation menu */}
        <nav className="flex flex-col h-full pb-20 overflow-y-auto">
          <div className="flex-1 px-2 py-4 space-y-1">
            {menuItemsToDisplay.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center p-2 rounded-md transition-colors duration-200
                  ${isActive 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'}
                  ${!isSidebarOpen && 'justify-center'}
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isSidebarOpen && <span className="ml-3">{item.label}</span>}
              </NavLink>
            ))}
          </div>

          {/* Logout button */}
          <div className="absolute bottom-0 w-full border-t border-indigo-700 p-2">
            <button
              onClick={handleLogout}
              className={`
                flex items-center w-full p-2 rounded-md text-indigo-100 hover:bg-indigo-700 hover:text-white transition-colors duration-200
                ${!isSidebarOpen && 'justify-center'}
              `}
            >
              <FaSignOutAlt className="w-5 h-5" />
              {isSidebarOpen && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
