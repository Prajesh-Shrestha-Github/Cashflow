// src/components/articles/ArticleDetail.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArticles } from '../../context/ArticlesContext';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';
import { BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentArticle, fetchArticleBySlug, toggleBookmark, loading, error } = useArticles();
  const { user } = useAuth();
  
  useEffect(() => {
    const loadArticle = async () => {
      const article = await fetchArticleBySlug(slug);
      if (!article) {
        navigate('/articles');
      }
    };
    
    loadArticle();
  }, [slug, fetchArticleBySlug, navigate]);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }
  
  if (!currentArticle) {
    return null;
  }
  
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/articles')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Articles
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {currentArticle.image_url && (
          <img 
            src={currentArticle.image_url} 
            alt={currentArticle.title} 
            className="w-full h-64 object-cover"
          />
        )}
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              {currentArticle.title}
            </h1>
            {user && (
              <button 
                onClick={() => toggleBookmark(currentArticle)}
                className="text-blue-500 hover:text-blue-700 focus:outline-none"
                aria-label={currentArticle.is_bookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                {currentArticle.is_bookmarked ? (
                  <BookmarkSolid className="h-6 w-6" />
                ) : (
                  <BookmarkOutline className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-500 mb-6">
            Published on {formatDate(currentArticle.created_at)}
            {currentArticle.updated_at !== currentArticle.created_at && 
              ` (Updated on ${formatDate(currentArticle.updated_at)})`}
          </div>
          
          <div className="prose max-w-none">
            {currentArticle.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// At the bottom of ArticleForm.jsx
export default ArticleDetail;
