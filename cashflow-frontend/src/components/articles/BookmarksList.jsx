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
      <h2 className="text-2xl font-semibold text-ink mb-4">Your Bookmarked Articles</h2>
      
      {bookmarks.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-ink-mute">You haven't bookmarked any articles yet.</p>
          <Link 
            to="/articles" 
            className="btn-primary mt-4"
          >
            Browse Articles
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="py-4">
              <Link 
                to={`/articles/${bookmark.article}`} 
                className="flex justify-between items-center hover:bg-paper p-2 rounded"
              >
                <span className="font-medium text-ink">{bookmark.article_title}</span>
                <span className="text-sm text-ink-mute">
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
