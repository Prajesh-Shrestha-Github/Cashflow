import { useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../components/dashboard/UserDashboard';
import { logoutUser } from '../services/auth';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is admin, redirect to admin dashboard
    if (user && user.is_admin) {
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Cashflow</h1>
              </div>
              <nav className="ml-10">
                <ul className="flex space-x-4">
                  <li>
                    <NavLink to="/dashboard" end className={({ isActive }) => isActive ? "text-indigo-600 font-bold" : "text-gray-700"}>Dashboard</NavLink>
                  </li>
                  <li>
                    <NavLink to="/transactions" className={({ isActive }) => isActive ? "text-indigo-600 font-bold" : "text-gray-700"}>Transactions</NavLink>
                  </li>
                  {/* Other navigation links */}
                </ul>
              </nav>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user?.first_name || user?.username}</span>
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserDashboard />
      </main>
    </div>
  );
};

export default DashboardPage;
