// src/pages/BookmarksPage.jsx
import React from 'react';
import { ArticlesProvider } from '../context/ArticlesContext';
import BookmarksList from '../components/articles/BookmarksList';

const BookmarksPage = () => {
  return (
    <ArticlesProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookmarks</h1>
        <BookmarksList />
      </div>
    </ArticlesProvider>
  );
};

export default BookmarksPage;