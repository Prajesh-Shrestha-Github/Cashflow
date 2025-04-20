// src/components/layout/Layout.jsx
import React from 'react';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();

  // If user is not logged in, just render children without sidebar
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 ml-0 lg:ml-20 transition-all duration-300 ease-in-out">
        <div className="px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
