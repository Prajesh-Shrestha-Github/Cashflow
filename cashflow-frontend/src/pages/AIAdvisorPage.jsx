import React from 'react';
import { motion } from 'framer-motion';
import RecommendationChatbot from '../components/Recommendation/RecommendationChatbot';
import RecommendationHistory from '../components/Recommendation/RecommendationHistory';

import PageHeader from '../components/common/PageHeader';
import { useAIRecommendation } from '../context/AIRecommendationContext';


const AIAdvisorPage = () => {
  const { remainingRequests } = useAIRecommendation();

  return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PageHeader title="AI Financial Advisor" subtitle="Suggestions are guidance, not financial advice." />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* Main chatbot area */}
            <div>
              <div className="card h-[640px] overflow-hidden">
                <RecommendationChatbot />
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="space-y-6">
                {/* Features/Help Card */}
                <div className="card-pad">
                  <h3 className="mb-3 font-display text-xl font-bold tracking-tight">What can the AI Advisor do?</h3>
                  <ul className="space-y-2 text-ink-soft">
                    <li className="flex items-start">
                      <span className="bg-forest text-paper text-sm font-semibold rounded-full w-5 h-5 flex shrink-0 items-center justify-center mr-2.5 mt-0.5">1</span>
                      <span>Analyze your spending patterns and suggest areas to cut back</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-forest text-paper text-sm font-semibold rounded-full w-5 h-5 flex shrink-0 items-center justify-center mr-2.5 mt-0.5">2</span>
                      <span>Provide personalized advice to reach your financial goals</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-forest text-paper text-sm font-semibold rounded-full w-5 h-5 flex shrink-0 items-center justify-center mr-2.5 mt-0.5">3</span>
                      <span>Offer strategies to improve your financial health</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-forest text-paper text-sm font-semibold rounded-full w-5 h-5 flex shrink-0 items-center justify-center mr-2.5 mt-0.5">4</span>
                      <span>Respond with variable levels of sarcasm (if you prefer)</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-accent-tint rounded-xl text-sm text-forest">
                    <p className="font-medium">Daily Limit:</p>
                    <p>You can make up to 3 AI recommendation requests per day</p>
                    <p className="mt-1 font-medium">{remainingRequests} requests remaining today</p>
                  </div>
                </div>

                {/* History Card */}
                <RecommendationHistory />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default AIAdvisorPage;