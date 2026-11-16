// src/pages/BookmarksPage.jsx
import React from 'react';
import PageHeader from '../components/common/PageHeader';
import { ArticlesProvider } from '../context/ArticlesContext';
import BookmarksList from '../components/articles/BookmarksList';

const BookmarksPage = () => {
  return (
    <ArticlesProvider>
      <div>
        <PageHeader title="My Bookmarks" />
        <BookmarksList />
      </div>
    </ArticlesProvider>
  );
};

export default BookmarksPage;