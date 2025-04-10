import React, { useState } from 'react';
import { FiClock, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { useAIRecommendation } from '../../context/AIRecommendationContext';

const RecommendationHistory = () => {
  const { recommendations, loading, error, fetchRecommendationHistory } = useAIRecommendation();
  const [expandedId, setExpandedId] = useState(null);

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getSarcasmLevelLabel = (level) => {
    const labels = ['Professional', 'Mild', 'Moderate', 'Moderate', 'High', 'Very Sarcastic'];
    return labels[level] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={fetchRecommendationHistory}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm flex items-center"
        >
          <FiRefreshCw className="mr-2" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FiClock />
          <h2 className="font-semibold">Recommendation History</h2>
        </div>
        <button 
          onClick={fetchRecommendationHistory} 
          className="p-1 hover:bg-indigo-500 rounded-full transition-colors"
          title="Refresh"
        >
          <FiRefreshCw />
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {recommendations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FiMessageSquare className="mx-auto text-4xl mb-2" />
            <p>No recommendation history yet</p>
            <p className="text-sm mt-1">Your AI conversations will appear here</p>
          </div>
        ) : (
          recommendations.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 truncate">{item.query}</p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                    <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                    <span>•</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      {getSarcasmLevelLabel(item.sarcasm_level)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleExpand(item.id)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  {expandedId === item.id ? 'Hide' : 'View'}
                </button>
              </div>

              {expandedId === item.id && (
                <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {item.response}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendationHistory;