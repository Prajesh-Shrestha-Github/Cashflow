// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();

  // Manage sidebar open/closed state and auto-collapse on resize
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If user is not logged in, render without sidebar
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {/* Main content */}
      <div className={`flex-1 overflow-auto ml-0 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300 ease-in-out`}>
        <div className="px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
