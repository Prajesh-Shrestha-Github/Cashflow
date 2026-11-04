// src/pages/admin/ArticlesManagementPage.jsx
import React from 'react';
import { ArticlesProvider } from '../../context/ArticlesContext';
import AdminArticleList from '../../components/admin/articles/AdminArticleList';

const ArticlesManagementPage = () => {
  return (
    <ArticlesProvider>
      <div>
        <AdminArticleList />
      </div>
    </ArticlesProvider>
  );
};

export default ArticlesManagementPage;
