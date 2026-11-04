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
    <div className="bg-card p-6 rounded-xl shadow-card">
      <h2 className="text-2xl font-bold mb-4">Import Transactions</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="csv-file" className="label">
            Upload CSV File
          </label>
          <input
            type="file"
            id="csv-file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-ink-mute
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-medium
                       file:bg-brand-tint file:text-brand-dark
                       hover:file:bg-brand-tint"
          />
          {error && <p className="mt-1 text-sm text-signal">{error}</p>}
          <p className="mt-1 text-sm text-ink-mute">
            CSV file should have columns: date, amount, category_name, description
          </p>
        </div>
        
        {importErrors.length > 0 && (
          <div className="mb-4 p-3 bg-signal/10 border border-signal/30 rounded-lg">
            <h3 className="text-sm font-medium text-signal mb-1">Import Errors:</h3>
            <ul className="list-disc list-inside text-sm text-signal space-y-1">
              {importErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-signal">
              Please check your CSV format and try again. Make sure column names and data formats are correct.
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || isUploading || loading}
            className="btn-primary"
          >
            {isUploading ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">CSV Format Instructions</h3>
        <p className="text-sm text-ink-mute mb-2">
          Your CSV file should have the following columns:
        </p>
        <ul className="list-disc list-inside text-sm text-ink-mute">
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