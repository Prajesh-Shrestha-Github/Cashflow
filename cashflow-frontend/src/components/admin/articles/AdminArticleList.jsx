// src/components/admin/articles/AdminArticleList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../../../context/ArticlesContext';
import Spinner from '../../common/Spinner';
import toast from 'react-hot-toast';
import { deleteArticle, togglePublishedStatus } from '../../../services/articleService';

const AdminArticleList = () => {
  const { articles, loading, error, fetchArticles } = useArticles();
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(searchTerm);
  };
  
  const handleDeleteArticle = async (slug, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setIsDeleting(true);
      try {
        await deleteArticle(slug);
        toast.success('Article deleted successfully');
        fetchArticles();
      } catch (error) {
        toast.error('Failed to delete article');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const handleTogglePublished = async (slug, isPublished, title) => {
    try {
      await togglePublishedStatus(slug, !isPublished);
      toast.success(`Article "${title}" ${!isPublished ? 'published' : 'unpublished'}`);
      fetchArticles();
    } catch (error) {
      toast.error('Failed to update article status');
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading && articles.length === 0) {
    return <Spinner />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Manage Articles</h2>
        <Link 
          to="/admin/articles/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add New Article
        </Link>
      </div>
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {articles.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No articles found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {article.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      article.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(article.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/admin/articles/edit/${article.slug}`} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleTogglePublished(article.slug, article.is_published, article.title)}
                        className={`${
                          article.is_published 
                            ? 'text-yellow-600 hover:text-yellow-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {article.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                        onClick={() => handleDeleteArticle(article.slug, article.title)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
// At the bottom of ArticleForm.jsx
export default AdminArticleList;
