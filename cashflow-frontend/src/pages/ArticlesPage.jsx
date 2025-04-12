// src/pages/ArticlesPage.jsx
import React from 'react';
import { ArticlesProvider } from '../context/ArticlesContext';
import ArticleList from '../components/articles/ArticlesList';

const ArticlesPage = () => {
  return (
    <ArticlesProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Articles</h1>
        <ArticleList />
      </div>
    </ArticlesProvider>
  );
};

export default ArticlesPage;