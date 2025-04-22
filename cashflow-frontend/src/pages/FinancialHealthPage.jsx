import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFinancialHealth } from '../context/FinancialHealthContext';
import FinancialHealthChart from '../components/financial-health/FinancialHealthChart';
import FinancialHealth from '../components/financial-health/FinancialHealth';
import FinancialHealthBar from '../components/financial-health/FinancialHealthBar';

const FinancialHealthPage = () => {
  const { user } = useAuth();
  const { currentHealth, fetchCurrentHealth, fetchHistoricalHealth } = useFinancialHealth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        navigate('/admin-dashboard');
      } else {
        fetchCurrentHealth();
        fetchHistoricalHealth();
      }
    }
  }, [user, navigate, fetchCurrentHealth, fetchHistoricalHealth]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Financial Health</h1>
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

          {/* Financial Health Chart */}
          <div className="bg-white p-4 rounded-lg shadow-md col-span-1 md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold mb-2">Health Trends</h2>
            <FinancialHealthChart />
          </div>

          {/* Detailed Financial Health */}
          <div className="bg-white p-4 rounded-lg shadow-md col-span-1 md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold mb-2">Detailed Overview</h2>
            <FinancialHealth />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinancialHealthPage;