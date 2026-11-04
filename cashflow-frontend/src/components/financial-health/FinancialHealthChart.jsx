import React from 'react';
import { Line } from 'react-chartjs-2';
import { useFinancialHealth } from '../../context/FinancialHealthContext';
import { COLORS, applyChartDefaults, gridOptions } from '../../utils/chartTheme';

// Import Chart.js components (required for react-chartjs-2)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
applyChartDefaults(ChartJS);

const FinancialHealthChart = () => {
  const { historicalHealth } = useFinancialHealth();

  // Chart data
  const data = {
    labels: historicalHealth.map(health => health.month_display), // X-axis labels (e.g., months)
    datasets: [
      {
        label: 'Savings Rate (%)', // Legend label
        data: historicalHealth.map(health => health.savings_rate), // Y-axis data
        borderColor: COLORS.brand, // Line color
        pointBackgroundColor: COLORS.brand,
        pointRadius: 4,
        borderWidth: 2.5,
        fill: true,
        backgroundColor: COLORS.brandSoft, // Fill under the line
        tension: 0.4, // Smooth the line
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ...gridOptions,
        beginAtZero: true, // Start Y-axis at 0
        title: { display: true, text: 'Savings Rate (%)' },
      },
      x: { ...gridOptions, grid: { display: false } },
    },
    plugins: {
      legend: { position: 'top', align: 'end' },
    },
  };

  return (
    <div className="mt-4 h-72">
      <Line data={data} options={options} />
    </div>
  );
};

export default FinancialHealthChart;