// src/components/articles/BookmarksList.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../../context/ArticlesContext';
import Spinner from '../common/Spinner';

const BookmarksList = () => {
  const { bookmarks, loading, fetchBookmarks } = useArticles();
  
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading && bookmarks.length === 0) {
    return <Spinner />;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Bookmarked Articles</h2>
      
      {bookmarks.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">You haven't bookmarked any articles yet.</p>
          <Link 
            to="/articles" 
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Browse Articles
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="py-4">
              <Link 
                to={`/articles/${bookmark.article}`} 
                className="flex justify-between items-center hover:bg-gray-50 p-2 rounded"
              >
                <span className="font-medium text-gray-800">{bookmark.article_title}</span>
                <span className="text-sm text-gray-500">
                  Bookmarked on {formatDate(bookmark.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
// At the bottom of ArticleForm.jsx
export default BookmarksList;
