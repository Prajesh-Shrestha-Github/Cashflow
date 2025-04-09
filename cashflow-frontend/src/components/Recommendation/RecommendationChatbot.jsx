import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaHistory } from 'react-icons/fa';
import aiRecommendationService from '../services/aiRecommendationService';

const RecommendationChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sarcasmLevel, setSarcasmLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch chat history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const data = await aiRecommendationService.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get response from API
      const response = await aiRecommendationService.askQuestion(input, sarcasmLevel);
      
      // Add AI response to chat
      setMessages((prev) => [...prev, { text: response.response, isUser: false }]);
      
      // Reset input and refresh history
      setInput('');
      fetchHistory();
    } catch (error) {
      setMessages((prev) => [...prev, { 
        text: "Sorry, I couldn't process your request. Please try again later.", 
        isUser: false,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
    setMessages([
      { text: item.query, isUser: true },
      { text: item.response, isUser: false }
    ]);
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="text-xl font-semibold">Financial Advisor AI</h2>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          <FaHistory />
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Ask for financial advice or recommendations</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-3/4 p-3 rounded-lg ${
                  msg.isUser 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : msg.isError 
                      ? 'bg-red-100 text-red-800 rounded-bl-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* History sidebar (conditional) */}
      {showHistory && (
        <div className="absolute right-0 top-16 w-64 h-5/6 bg-white shadow-lg rounded-l-lg overflow-y-auto z-10 border-l border-t border-b border-gray-200">
          <div className="p-3 bg-gray-100 border-b sticky top-0">
            <h3 className="font-medium">Chat History</h3>
          </div>
          <div className="p-2">
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm p-2">No history yet</p>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm border-b"
                >
                  <p className="font-medium truncate">{item.query}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sarcasm Level: {sarcasmLevel}
          </label>
          <input
            type="range"
            min="0"
            max="5"
            value={sarcasmLevel}
            onChange={(e) => setSarcasmLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Professional</span>
            <span>Sarcastic</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for financial advice..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={isLoading || !input.trim()}
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecommendationChatbot;