// src/components/articles/ArticleList.jsx
import React, { useState } from 'react';
import { useArticles } from '../../context/ArticlesContext';
import ArticleCard from './ArticleCard';
import Spinner from '../common/Spinner';

const ArticleList = () => {
  const { articles, loading, error, fetchArticles } = useArticles();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(searchTerm);
  };
  
  if (loading && articles.length === 0) {
    return <Spinner />;
  }
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {articles.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No articles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};
// At the bottom of ArticleForm.jsx
export default ArticleList;
