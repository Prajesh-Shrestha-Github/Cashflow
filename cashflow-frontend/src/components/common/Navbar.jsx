import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaHome, 
  FaChartLine, 
  FaExchangeAlt, 
  FaFlag, 
  FaRobot, 
  FaBookmark, 
  FaNewspaper 
} from 'react-icons/fa';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determines if a path is active.
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Define navigation items with paths, names, and icons.
  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <FaHome /> },
    { path: '/transactions', name: 'Transactions', icon: <FaExchangeAlt /> },
    { path: '/goals', name: 'Goals', icon: <FaFlag /> },
    { path: '/financial-health', name: 'Financial Health', icon: <FaChartLine /> },
    { path: '/ai-advisor', name: 'AI Advisor', icon: <FaRobot /> },
    { path: '/articles', name: 'Articles', icon: <FaNewspaper /> },
    { path: '/bookmarks', name: 'Bookmarks', icon: <FaBookmark /> },
  ];

  return (
    <nav className="bg-forest text-white shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold">
              Cashflow
            </Link>
          </div>

          {user && (
            <>
              {/* Desktop Menu */}
              <div className="hidden md:flex space-x-4 items-center">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive(item.path)
                        ? 'bg-forest-deep'
                        : 'hover:bg-brand'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}

                {isAdmin && (
                  <Link
                    to="/admin-dashboard"
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive('/admin-dashboard')
                        ? 'bg-forest-deep'
                        : 'hover:bg-brand'
                    }`}
                  >
                    Admin
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand transition"
                >
                  Logout
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-brand focus:outline-none"
                >
                  <svg 
                    className="h-6 w-6" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none"
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && user && (
        <div className="md:hidden bg-forest pb-3 px-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(item.path)
                    ? 'bg-forest-deep'
                    : 'hover:bg-brand'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            {isAdmin && (
              <>
                <Link
                  to="/admin-dashboard"
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin-dashboard')
                      ? 'bg-forest-deep'
                      : 'hover:bg-brand'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>

                <Link
                  to="/admin/articles"
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition hover:bg-brand"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Manage Articles
                </Link>
              </>
            )}

            <button
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
