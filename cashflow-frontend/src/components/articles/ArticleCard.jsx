// src/components/articles/ArticleCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../../context/ArticlesContext';
import { useAuth } from '../../context/AuthContext';
import { BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

const ArticleCard = ({ article }) => {
  const { toggleBookmark } = useArticles();
  const { user } = useAuth();
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleBookmarkToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(article);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {article.image_url && (
        <img 
          src={article.image_url} 
          alt={article.title} 
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {article.title}
          </h3>
          {user && (
            <button 
              onClick={handleBookmarkToggle}
              className="text-blue-500 hover:text-blue-700 focus:outline-none"
              aria-label={article.is_bookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {article.is_bookmarked ? (
                <BookmarkSolid className="h-6 w-6" />
              ) : (
                <BookmarkOutline className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
        <p className="text-gray-600 mb-4">
          {article.summary || article.content.substring(0, 150)}
          {(article.summary || article.content.length > 150) && '...'}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {formatDate(article.created_at)}
          </span>
          <Link 
            to={`/articles/${article.slug}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Read more →
          </Link>
        </div>
      </div>
    </div>
  );
};
// At the bottom of ArticleForm.jsx
export default ArticleCard;
