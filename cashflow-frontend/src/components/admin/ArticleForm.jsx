// src/components/admin/articles/ArticleForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../common/Spinner';

const ArticleForm = ({ article, onSubmit, loading }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    image_url: '',
    is_published: true
  });
  
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        content: article.content || '',
        summary: article.summary || '',
        image_url: article.image_url || '',
        is_published: article.is_published !== undefined ? article.is_published : true
      });
    }
  }, [article]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is handled in the parent component
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink-soft">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="field mt-1"
          required
        />
      </div>
      
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-ink-soft">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          rows="3"
          value={formData.summary}
          onChange={handleChange}
          className="field mt-1"
          placeholder="Brief summary of the article"
        />
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-ink-soft">
          Content *
        </label>
        <textarea
          id="content"
          name="content"
          rows="10"
          value={formData.content}
          onChange={handleChange}
          className="field mt-1"
          required
        />
      </div>
      
      <div>
        <label htmlFor="image_url" className="block text-sm font-medium text-ink-soft">
          Image URL
        </label>
        <input
          type="url"
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          className="field mt-1"
          placeholder="https://example.com/image.jpg"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_published"
          name="is_published"
          checked={formData.is_published}
          onChange={handleChange}
          className="h-4 w-4 text-brand focus:ring-brand/40 border-line rounded"
        />
        <label htmlFor="is_published" className="ml-2 block text-sm text-ink-soft">
          Publish immediately
        </label>
      </div>
      
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => navigate('/admin/articles')}
          className="bg-line py-2 px-4 border border-line rounded-lg shadow-card text-sm font-medium text-ink-soft hover:bg-line focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Saving...
            </>
          ) : (
            'Save Article'
          )}
        </button>
      </div>
    </form>
  );
};
// At the bottom of ArticleForm.jsx
export default ArticleForm;
