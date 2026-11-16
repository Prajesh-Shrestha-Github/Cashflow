// src/pages/ArticlesPage.jsx
import React from 'react';
import PageHeader from '../components/common/PageHeader';
import { ArticlesProvider } from '../context/ArticlesContext';
import ArticleList from '../components/articles/ArticlesList';

const ArticlesPage = () => {
  return (
    <ArticlesProvider>
      <div>
        <PageHeader title="Articles" />
        <ArticleList />
      </div>
    </ArticlesProvider>
  );
};

export default ArticlesPage;