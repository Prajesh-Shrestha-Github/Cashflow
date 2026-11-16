// src/components/transactions/TransactionFilter.jsx
import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import CategorySelect from './CategorySelect';

const TransactionFilter = () => {
  const { filters, updateFilters } = useTransactions();
  const [localFilters, setLocalFilters] = useState({
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
    category: filters.category || '',
    type: filters.type || '',
    search: filters.search || '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCategoryChange = (categoryId) => {
    setLocalFilters(prev => ({ ...prev, category: categoryId }));
  };
  
  const handleTypeChange = (e) => {
    const { value } = e.target;
    setLocalFilters(prev => ({ 
      ...prev, 
      type: value,
      // Reset category when type changes
      category: value ? '' : prev.category 
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateFilters(localFilters);
  };
  
  const handleReset = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      category: '',
      type: '',
      search: ''
    };
    setLocalFilters(resetFilters);
    updateFilters(resetFilters);
  };
  
  return (
    <div className="border-b px-6 py-4">
      <button
        type="button"
        className="flex items-center text-brand hover:text-brand-dark focus:outline-none"
        onClick={() => document.getElementById('filter-form').classList.toggle('hidden')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        Filter Transactions
      </button>
      
      <form id="filter-form" className="hidden mt-4" onSubmit={handleSubmit}>
      <div>
        <label className="label">
            Search
        </label>
        <input
            type="text"
            name="search"
            value={localFilters.search}
            onChange={handleChange}
            placeholder="Search description..."
            className="field"
        />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={localFilters.startDate}
              onChange={handleChange}
              className="field"
            />
          </div>
          
          <div>
            <label className="label">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={localFilters.endDate}
              onChange={handleChange}
              className="field"
            />
          </div>
          
          <div>
            <label className="label">
              Type
            </label>
            <select
              name="type"
              value={localFilters.type}
              onChange={handleTypeChange}
              className="field"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          
          <div>
            <label className="label">
              Category
            </label>
            <CategorySelect 
              value={localFilters.category}
              onChange={handleCategoryChange}
              filterType={localFilters.type}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="btn-ghost"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionFilter;