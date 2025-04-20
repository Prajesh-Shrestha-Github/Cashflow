import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDashboard from '../components/dashboard/UserDashboard';
import { useFinancialHealth } from '../context/FinancialHealthContext';
import FinancialHealthBar from '../components/financial-health/FinancialHealthBar';
import { useTransactions } from '../context/TransactionContext';
import RecurringTransactions from '../components/dashboard/RecurringTransactions';

const DashboardPage = () => {
  const { user } = useAuth();
  const { currentHealth, fetchCurrentHealth } = useFinancialHealth();
  const { summary } = useTransactions();
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

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back, <span className="font-medium">{user.username || user.email}</span>
        </div>
      </div>

      {/* Financial Health Summary */}
      {currentHealth && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Financial Health</h2>
            <div className="mt-2 md:mt-0">
              <span 
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentHealth.score >= 80
                    ? 'bg-green-100 text-green-800'
                    : currentHealth.score >= 60
                    ? 'bg-blue-100 text-blue-800'
                    : currentHealth.score >= 40
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                Score: {currentHealth.score}/100
              </span>
            </div>
          </div>
          
          <FinancialHealthBar 
            healthStatus={currentHealth.health_status} 
            savingsRate={currentHealth.savings_rate} 
          />
          
          <p className="mt-4 text-gray-600">
            {currentHealth.message || 'Maintain your financial habits to improve your score.'}
          </p>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserDashboard />
        </div>
        <div className="lg:col-span-1">
          <RecurringTransactions />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;