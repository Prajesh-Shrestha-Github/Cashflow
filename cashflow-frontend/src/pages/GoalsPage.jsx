import React, { useState } from 'react';
import GoalList from '../components/financial-goals/GoalList';
import GoalForm from '../components/financial-goals/GoalForm';
import PageHeader from '../components/common/PageHeader';

const GoalsPage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader eyebrow="Targets" title="Financial Goals" subtitle="Track and manage your financial objectives">
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn-ghost' : 'btn-accent'}
        >
          {showForm ? 'Hide Form' : 'Create New Goal'}
        </button>
      </PageHeader>

      {showForm && (
        <div className="mb-8 animate-fade-in">
          <GoalForm />
        </div>
      )}
      
      <div className="card overflow-hidden">
        <div className="p-1 sm:p-2">
          <GoalList />
        </div>
      </div>
      
      <div className="mt-6 rounded-2xl bg-brand-tint p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center">
          <div className="flex-shrink-0 bg-brand-tint rounded-full p-3 mr-4 mb-4 sm:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-brand-dark">Tips for setting effective financial goals</h3>
            <ul className="mt-2 text-sm text-brand-dark space-y-1">
              <li className="flex items-start">
                <svg className="h-4 w-4 text-brand mr-1.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Be specific with your goal targets and deadlines
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-brand mr-1.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Break large goals into smaller, achievable milestones
              </li>
              <li className="flex items-start">
                <svg className="h-4 w-4 text-brand mr-1.5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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