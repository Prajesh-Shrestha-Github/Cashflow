import { useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../components/dashboard/UserDashboard';
import { logoutUser } from '../services/auth';
import FinancialHealthBar from '../components/financial-health/FinancialHealthBar'; // Adjusted path
import { useFinancialHealth } from '../context/FinancialHealthContext';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { currentHealth, fetchCurrentHealth } = useFinancialHealth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        navigate('/admin-dashboard');
      } else {
        fetchCurrentHealth(); // Fetch financial health data for the bar
      }
    }
  }, [user, navigate, fetchCurrentHealth]);

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
      {/* Navigation Bar */}
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
                    <NavLink
                      to="/dashboard"
                      end
                      className={({ isActive }) =>
                        isActive ? 'text-indigo-600 font-bold' : 'text-gray-700'
                      }
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/transactions"
                      className={({ isActive }) =>
                        isActive ? 'text-indigo-600 font-bold' : 'text-gray-700'
                      }
                    >
                      Transactions
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/goals"
                      className={({ isActive }) =>
                        isActive ? 'text-indigo-600 font-bold' : 'text-gray-700'
                      }
                    >
                      Goals
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/financial-health"
                      className={({ isActive }) =>
                        isActive ? 'text-indigo-600 font-bold' : 'text-gray-700'
                      }
                    >
                      Financial Health 
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/ai-advisor"
                      className={({ isActive }) =>
                        isActive ? 'text-indigo-600 font-bold' : 'text-gray-700'
                      }
                    >
                      AI Advisor
                    </NavLink>
                  </li>
                </ul>
              </nav>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Welcome, {user?.first_name || user?.username}
              </span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Financial Health Bar */}
          {currentHealth && (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-2">Current Health</h2>
              <FinancialHealthBar
                healthStatus={currentHealth.health_status}
                savingsRate={currentHealth.savings_rate}
              />
            </div>
          )}

          {/* User Dashboard */}
          <div className="bg-white p-4 rounded-lg shadow-md col-span-1 md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold mb-2">User Overview</h2>
            <UserDashboard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;