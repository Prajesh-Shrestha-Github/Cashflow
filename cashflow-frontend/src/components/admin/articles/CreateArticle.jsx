// src/components/admin/articles/CreateArticle.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArticleForm from '../ArticleForm';
import { createArticle } from '../../../services/articleService';
import toast from 'react-hot-toast';

const CreateArticle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const newArticle = await createArticle(formData);
      toast.success('Article created successfully');
      navigate(`/admin/articles`);
      return newArticle;
    } catch (error) {
      toast.error('Failed to create article');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create New Article</h1>
        <p className="text-gray-600">Enter the details for the new article</p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <ArticleForm 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CreateArticle;
