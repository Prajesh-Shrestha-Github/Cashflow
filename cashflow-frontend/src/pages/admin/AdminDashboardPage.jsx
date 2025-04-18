import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from '../../components/admin/AdminDashboard';

const AdminDashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const adminModules = [
    {
      name: 'Articles Management',
      description: 'Create, edit, and manage articles and content',
      icon: '📄',
      link: '/admin/articles'
    },
    // Add other admin modules as needed
  ];
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      
      {/* Admin Dashboard Component */}
      <div className="mb-8">
        <AdminDashboard />
      </div>
      
      {/* Quick Access Modules */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module, index) => (
            <Link
              key={index}
              to={module.link}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-4xl mb-4">{module.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{module.name}</h3>
              <p className="text-gray-600">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;