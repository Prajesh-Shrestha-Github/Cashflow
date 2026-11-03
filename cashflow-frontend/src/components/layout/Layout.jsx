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
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {/* Main content */}
      <div className={`flex-1 overflow-auto ml-0 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-[72px]'} transition-all duration-300 ease-in-out`}>
        <div className="mx-auto w-full max-w-wrap px-4 pb-8 pt-16 sm:px-5 lg:px-6 lg:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
