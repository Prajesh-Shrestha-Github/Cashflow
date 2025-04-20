import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from '../../components/admin/AdminDashboard';
import { FaEdit, FaChartLine, FaUsers } from 'react-icons/fa';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  
  const adminModules = [
    {
      name: 'Articles Management',
      description: 'Create, edit, and manage articles and content',
      icon: <FaEdit className="w-8 h-8 text-indigo-600" />,
      link: '/admin/articles'
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Logged in as <span className="font-medium">{user?.username || user?.email}</span>
        </div>
      </div>
      
      {/* Admin Dashboard Component */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Overview</h2>
        <AdminDashboard />
      </div>
      
      {/* Quick Access Modules */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminModules.map((module, index) => (
            <Link
              key={index}
              to={module.link}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              <div className="mb-3">{module.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{module.name}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;