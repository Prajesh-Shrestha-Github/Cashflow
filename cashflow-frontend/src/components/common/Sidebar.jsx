// src/components/common/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/auth';
import Logo from './Logo';
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

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = user?.is_admin;
  const sidebarRef = useRef(null);

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
  }, [setIsSidebarOpen]);

  // Close sidebar when clicking outside on desktop
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isSidebarOpen && !isMobileMenuOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen, isMobileMenuOpen, setIsSidebarOpen]);

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
          className="fixed inset-0 z-20 bg-forest-deep/60 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile menu toggle button */}
      <div className="fixed top-4 left-4 z-30 lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="rounded-xl bg-forest p-2.5 text-paper shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-20 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'w-60' : 'w-[72px]'
        } bg-forest-deep text-paper`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Logo light compact={!isSidebarOpen} />
          {!isMobileMenuOpen && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="hidden rounded-lg p-2 text-paper/70 hover:bg-white/10 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent lg:block"
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
          <div className="border-b border-white/10 px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-lg font-extrabold text-forest-deep">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-sm font-medium">{user.username || user.email}</div>
                <div className="text-sm text-paper/60">{isAdmin ? 'Administrator' : 'User'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation menu */}
        <nav className="flex flex-col h-full pb-20 overflow-y-auto">
          <div className="flex-1 space-y-1 px-3 py-4">
            {menuItemsToDisplay.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent
                  ${isActive 
                    ? 'bg-accent font-semibold text-forest-deep' 
                    : 'text-paper/75 hover:bg-white/10 hover:text-paper'}
                  ${!isSidebarOpen && 'justify-center'}
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isSidebarOpen && <span className="ml-3">{item.label}</span>}
              </NavLink>
            ))}
          </div>

          {/* Logout button */}
          <div className="absolute bottom-0 w-full border-t border-white/10 p-3">
            <button
              onClick={handleLogout}
              className={`
                flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-paper/75 transition-colors duration-150 hover:bg-white/10 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent
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
