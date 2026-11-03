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
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.035em] text-ink sm:text-5xl">Manage Articles</h1>
        <Link 
          to="/admin/articles/new" 
          className="btn-primary"
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
            className="flex-1 px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            type="submit"
            className="btn-primary"
          >
            Search
          </button>
        </form>
      </div>
      
      {error && (
        <div className="p-4 bg-signal/10 text-signal rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {articles.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-xl shadow-card">
          <p className="text-ink-mute">No articles found.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-paper">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-ink-mute">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-ink-mute">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-ink-mute">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-sm font-medium text-ink-mute">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-line">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-paper">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-ink">
                      {article.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      article.is_published 
                        ? 'bg-brand-tint text-brand-dark' 
                        : 'bg-accent-tint text-forest'
                    }`}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-mute">
                    {formatDate(article.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/admin/articles/edit/${article.slug}`} className="text-brand hover:text-brand-dark">
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleTogglePublished(article.slug, article.is_published, article.title)}
                        className={`${
                          article.is_published 
                            ? 'text-forest hover:text-forest' 
                            : 'text-brand hover:text-brand-dark'
                        }`}
                      >
                        {article.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                        onClick={() => handleDeleteArticle(article.slug, article.title)}
                        className="text-signal hover:text-signal"
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
