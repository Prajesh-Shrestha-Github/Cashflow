import React, { useState } from 'react';
import { FiClock, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { useAIRecommendation } from '../../context/AIRecommendationContext';

const RecommendationHistory = () => {
  const { recommendations, loading, error, fetchRecommendationHistory } = useAIRecommendation();
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const [itemsPerPage, setItemsPerPage] = useState(5); // Default items per page

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getSarcasmLevelLabel = (level) => {
    const labels = ['Professional', 'Mild', 'Moderate', 'Moderate', 'High', 'Very Sarcastic'];
    return labels[level] || 'Unknown';
  };

  // Pagination logic
  const totalItems = recommendations?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecommendations = recommendations?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages))); // Ensure page stays within bounds
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <FiRefreshCw className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-signal">
        <p>Error: {error}</p>
        <button
          onClick={fetchRecommendationHistory}
          className="mt-2 text-brand hover:text-brand-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!Array.isArray(recommendations)) {
    return (
      <div className="p-4 text-signal">
        <p>Error: Invalid recommendation data</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recommendation History</h2>
        {totalItems > 0 && (
          <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-sm text-ink-soft">
              Items per page:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center text-ink-mute">
          <p className="text-lg">No recommendation history yet</p>
          <p>Your AI conversations will appear here</p>
        </div>
      ) : (
        <>
          {currentRecommendations.map((item) => (
            <div key={item.id} className="border-b py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.query}</p>
                  <p className="text-sm text-ink-mute">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })} •{' '}
                    {getSarcasmLevelLabel(item.sarcasm_level)}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleExpand(item.id)}
                  className="text-brand hover:text-brand-dark text-sm font-medium"
                >
                  {expandedId === item.id ? 'Hide' : 'View'}
                </button>
              </div>
              {expandedId === item.id && (
                <div className="mt-2 text-ink-soft">
                  {item.response ? (
                    <ReactMarkdown>{item.response}</ReactMarkdown>
                  ) : (
                    <p>No response available</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pagination Controls */}
          {totalItems > itemsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded ${
                  currentPage === 1
                    ? 'bg-line cursor-not-allowed'
                    : 'bg-forest text-white hover:bg-forest-deep'
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-ink-soft">
                Page {currentPage} of {totalPages} ({startIndex + 1} - {Math.min(endIndex, totalItems)} of {totalItems})
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded ${
                  currentPage === totalPages
                    ? 'bg-line cursor-not-allowed'
                    : 'bg-forest text-white hover:bg-forest-deep'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationHistory;