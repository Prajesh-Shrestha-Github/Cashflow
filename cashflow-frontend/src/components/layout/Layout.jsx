// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'sidebarOpen';
const WIDE = 1024; // Tailwind lg

// The user's own choice on a wide screen. Storage can be blocked (private mode), so never let it throw.
const preferredOpen = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
};
// Narrow screens always start closed; wide screens follow the remembered choice.
const wantOpen = () => window.innerWidth >= WIDE && preferredOpen();

const Layout = ({ children }) => {
  const { user } = useAuth();

  // Every page wraps itself in its own <Layout>, so the choice must be remembered, not just held in state.
  const [isSidebarOpen, setIsSidebarOpen] = useState(wantOpen);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(wantOpen());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Remember the choice, but only while wide: auto-closing on a narrow screen is not a choice.
  useEffect(() => {
    if (window.innerWidth < WIDE) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(isSidebarOpen));
    } catch {
      /* storage blocked: the sidebar still works, it just will not be remembered */
    }
  }, [isSidebarOpen]);

  // If user is not logged in, render without sidebar
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {/* Main content */}
      <div className={`flex-1 overflow-auto ml-0 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-[72px]'} transition-all duration-300 ease-in-out`}>
        <div data-testid="page-content" className="w-full px-4 pb-8 pt-16 sm:px-5 lg:px-6 lg:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
