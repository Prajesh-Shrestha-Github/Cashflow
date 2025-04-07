import React, { useState } from 'react';
import GoalList from '../components/financial-goals/GoalList';
import GoalForm from '../components/financial-goals/GoalForm';

const GoalsPage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
          <p className="mt-1 text-gray-600">Track and manage your financial objectives</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Hide Form
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Goal
            </>
          )}
        </button>
      </div>
      
      {showForm && (
        <div className="mb-8 animate-fade-in">
          <GoalForm />
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-1 sm:p-2">
            <GoalList />
          </div>
        </div>
      </div>
      
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center">
          <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4 mb-4 sm:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-900">Tips for setting effective financial goals</h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li className="flex items-start">
                <svg className="h-4 w-4 text-blue-600 mr-1.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Be specific with your goal targets and deadlines
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-blue-600 mr-1.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Break large goals into smaller, achievable milestones
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-blue-600 mr-1.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Regularly update your progress to stay motivated
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;