// src/pages/admin/ArticlesManagementPage.jsx
import React from 'react';
import { ArticlesProvider } from '../../context/ArticlesContext';
import AdminArticleList from '../../components/admin/articles/AdminArticleList';

const ArticlesManagementPage = () => {
  return (
    <ArticlesProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminArticleList />
      </div>
    </ArticlesProvider>
  );
};

export default ArticlesManagementPage;
