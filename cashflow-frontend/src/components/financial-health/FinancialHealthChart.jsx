import React from 'react';
import { Line } from 'react-chartjs-2';
import { useFinancialHealth } from '../../context/FinancialHealthContext';

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

const FinancialHealthChart = () => {
  const { historicalHealth } = useFinancialHealth();

  // Chart data
  const data = {
    labels: historicalHealth.map(health => health.month_display), // X-axis labels (e.g., months)
    datasets: [
      {
        label: 'Savings Rate (%)', // Legend label
        data: historicalHealth.map(health => health.savings_rate), // Y-axis data
        borderColor: 'rgba(75, 192, 192, 1)', // Line color
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill under the line
        tension: 0.4, // Smooth the line
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true, // Start Y-axis at 0
        title: {
          display: true,
          text: 'Savings Rate (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Financial Health Over Time',
      },
    },
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Line data={data} options={options} />
    </div>
  );
};

export default FinancialHealthChart;