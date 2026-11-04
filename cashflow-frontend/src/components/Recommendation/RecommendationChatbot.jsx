import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiMessageSquare, FiSettings } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useAIRecommendation } from '../../context/AIRecommendationContext';
import { ErrorBoundary } from 'react-error-boundary';

const MarkdownRenderer = ({ content }) => {
  return (
    <ErrorBoundary fallback={<p className="text-signal">Error displaying message</p>}>
       <div className="text-sm" >
        <ReactMarkdown 
            
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
        >
            {content}
        </ReactMarkdown>
      </div> 
    </ErrorBoundary>
  );
};

const RecommendationChatbot = () => {
  const { getRecommendation, remainingRequests, loading: contextLoading } = useAIRecommendation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sarcasmLevel, setSarcasmLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      // Get AI recommendation
      const response = await getRecommendation(input, sarcasmLevel);
      
      if (response) {
        // Add AI response to chat
        const aiMessage = {
          id: Date.now() + 1,
          text: response.response,
          sender: 'ai'
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      setError(err.message || 'Failed to get recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsToggle = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-forest text-white">
        <div className="flex items-center space-x-2">
          <FaRobot className="text-xl" />
          <h2 className="text-lg font-semibold">AI Financial Advisor</h2>
        </div>
        <div className="flex items-center">
          <span className="mr-3 text-sm bg-brand px-2 py-1 rounded-full">
            {remainingRequests} requests left today
          </span>
          <button 
            onClick={handleSettingsToggle}
            className="p-1 rounded-full hover:bg-brand transition-colors"
          >
            <FiSettings />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-brand-tint p-4 border-b border-brand/30">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-ink-soft mb-1">
              Sarcasm Level: {sarcasmLevel}/5
            </label>
            <input 
              type="range" 
              min="0" 
              max="5" 
              value={sarcasmLevel} 
              onChange={(e) => setSarcasmLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-brand-tint rounded-xl appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-ink-mute mt-1">
              <span>Professional</span>
              <span>Mild</span>
              <span>Moderate</span>
              <span>High</span>
              <span>Very Sarcastic</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-paper">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-mute">
            <FiMessageSquare className="text-5xl mb-3" />
            <p className="text-center">Ask for financial advice or recommendations</p>
            <p className="text-sm mt-2">Examples:</p>
            <ul className="text-sm mt-1 space-y-1 text-center">
              <li>"How can I improve my savings rate?"</li>
              <li>"What should I do about my high food expenses?"</li>
              <li>"Help me reach my vacation savings goal faster"</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-3/4 px-4 py-3 rounded-xl ${
                    message.sender === 'user' 
                      ? 'bg-brand text-white rounded-tr-none' 
                      : 'bg-card border border-line shadow-card rounded-tl-none'
                  }
                `}>
                  {message.sender === 'ai' ? (
                    <MarkdownRenderer content={message.text} />
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-card border border-line shadow-card rounded-xl rounded-tl-none p-4 max-w-3/4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-signal/10 border border-signal/30 text-signal rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-line bg-card">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for financial advice..."
            className="flex-1 px-4 py-2 border border-line rounded-full focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-transparent"
            disabled={loading || remainingRequests === 0}
          />
          <button
            type="submit"
            className={`p-2 rounded-full ${
              loading || !input.trim() || remainingRequests === 0
                ? 'bg-line text-ink-mute cursor-not-allowed'
                : 'bg-forest text-white hover:bg-forest-deep'
            }`}
            disabled={loading || !input.trim() || remainingRequests === 0}
          >
            <FiSend className="text-lg" />
          </button>
        </div>
        {remainingRequests === 0 && (
          <p className="mt-2 text-sm text-signal">
            You've reached your daily limit of 3 AI recommendations. Please try again tomorrow!
          </p>
        )}
      </form>
    </div>
  );
};

export default RecommendationChatbot;