import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFinancialHealth } from '../context/FinancialHealthContext';
import FinancialHealthChart from '../components/financial-health/FinancialHealthChart';
import FinancialHealth from '../components/financial-health/FinancialHealth';
import FinancialHealthBar from '../components/financial-health/FinancialHealthBar';
import PageHeader from '../components/common/PageHeader';

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
    <div>
      <PageHeader eyebrow="Monthly read" title="Financial Health" subtitle="How your income and spending are balancing out, month by month." />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        {/* Current status */}
        {currentHealth && (
          <section className="card-pad lg:col-span-1">
            <h2 className="eyebrow">Current Health</h2>
            <div className="mt-4">
              <FinancialHealthBar
                hideTitle
                healthStatus={currentHealth.health_status}
                savingsRate={currentHealth.savings_rate}
              />
            </div>
          </section>
        )}

        {/* Trend */}
        <section className={`card-pad ${currentHealth ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h2 className="font-display text-2xl font-bold tracking-tight">Health Trends</h2>
          <FinancialHealthChart />
        </section>

        {/* Detail */}
        <section className="card-pad lg:col-span-3">
          <h2 className="font-display text-2xl font-bold tracking-tight">Detailed Overview</h2>
          <FinancialHealth />
        </section>
      </div>
    </div>
  );
};

export default FinancialHealthPage;
