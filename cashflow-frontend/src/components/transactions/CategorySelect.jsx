// src/components/transactions/CategorySelect.jsx
import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';

const CategorySelect = ({ value, onChange, filterType = null }) => {
  const { categories } = useTransactions();
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  useEffect(() => {
    console.log("Updating categories for type:", filterType); // Debugging
    if (filterType) {
      setFilteredCategories(categories.filter(cat => cat.type === filterType));
    } else {
      setFilteredCategories(categories);
    }
  }, [categories, filterType]);
  
  
  const handleChange = (e) => {
    onChange(Number(e.target.value) || '');
  };
  
  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select a category</option>
        
        {filteredCategories.length > 0 && (
          <>
            {!filterType && (
              <>
                <optgroup label="Income">
                  {categories
                    .filter(cat => cat.type === 'income')
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
                </optgroup>
                
                <optgroup label="Expense">
                  {categories
                    .filter(cat => cat.type === 'expense')
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
                </optgroup>
              </>
            )}
            
            {filterType && filteredCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </>
        )}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};

export default CategorySelect;