// src/components/transactions/CsvImport.jsx
import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';

const CsvImport = () => {
  const { importCSV, loading } = useTransactions();
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
      setImportErrors([]);
    } else if (selectedFile) {
      setFile(null);
      setError('Please select a CSV file');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CSV file');
      return;
    }
    
    setIsUploading(true);
    setImportErrors([]);
    try {
      const result = await importCSV(file);
      if (result && result.success) {
        setFile(null);
        // Reset the file input
        e.target.reset();
      } else if (result && result.errors) {
        setImportErrors(result.errors);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to import CSV. Please check your file format.');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Import Transactions</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-1">
            Upload CSV File
          </label>
          <input
            type="file"
            id="csv-file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-medium
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <p className="mt-1 text-sm text-gray-500">
            CSV file should have columns: date, amount, category_name, description
          </p>
        </div>
        
        {importErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800 mb-1">Import Errors:</h3>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
              {importErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-700">
              Please check your CSV format and try again. Make sure column names and data formats are correct.
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || isUploading || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUploading ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">CSV Format Instructions</h3>
        <p className="text-sm text-gray-600 mb-2">
          Your CSV file should have the following columns:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600">
          <li><strong>date</strong> - in YYYY-MM-DD format (e.g., 2025-04-01)</li>
          <li><strong>amount</strong> - decimal number (positive for income, negative for expenses)</li>
          <li><strong>category_name</strong> - must match an existing category name</li>
          <li><strong>description</strong> - (optional) transaction description</li>
          <li><strong>is_recurring</strong> - (optional) "true" or "false"</li>
        </ul>
      </div>
    </div>
  );
};

export default CsvImport;