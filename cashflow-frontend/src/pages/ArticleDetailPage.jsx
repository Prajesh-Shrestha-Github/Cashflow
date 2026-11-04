// src/pages/ArticleDetailPage.jsx
import React from 'react';
import { ArticlesProvider } from '../context/ArticlesContext';
import ArticleDetail from '../components/articles/ArticleDetail';

const ArticleDetailPage = () => {
  return (
    <ArticlesProvider>
      <div>
        <ArticleDetail />
      </div>
    </ArticlesProvider>
  );
};

export default ArticleDetailPage;