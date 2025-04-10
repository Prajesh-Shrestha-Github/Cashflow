import React from 'react';
import { motion } from 'framer-motion';
import RecommendationChatbot from '../components/Recommendation/RecommendationChatbot';
import RecommendationHistory from '../components/Recommendation/RecommendationHistory';

import { FaRobot } from 'react-icons/fa';
import { useAIRecommendation } from '../context/AIRecommendationContext';


const AIAdvisorPage = () => {
  const { remainingRequests } = useAIRecommendation();

  return (
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <FaRobot className="text-xl text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AI Financial Advisor</h1>
              <p className="text-gray-600">Get personalized financial advice and recommendations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main chatbot area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg h-[600px]">
                <RecommendationChatbot />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Features/Help Card */}
                <div className="bg-white rounded-lg shadow-lg p-5">
                  <h3 className="font-semibold text-lg mb-3">What can the AI Advisor do?</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="bg-indigo-100 text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">1</span>
                      <span>Analyze your spending patterns and suggest areas to cut back</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">2</span>
                      <span>Provide personalized advice to reach your financial goals</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">3</span>
                      <span>Offer strategies to improve your financial health</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-indigo-100 text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">4</span>
                      <span>Respond with variable levels of sarcasm (if you prefer)</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
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