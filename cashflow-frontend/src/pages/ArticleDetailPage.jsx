// src/pages/ArticleDetailPage.jsx
import React from 'react';
import { ArticlesProvider } from '../context/ArticlesContext';
import ArticleDetail from '../components/articles/ArticleDetail';

const ArticleDetailPage = () => {
  return (
    <ArticlesProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArticleDetail />
      </div>
    </ArticlesProvider>
  );
};

export default ArticleDetailPage;