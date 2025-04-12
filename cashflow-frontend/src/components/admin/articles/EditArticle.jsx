// src/components/admin/articles/EditArticle.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArticleForm from '../ArticleForm';
import { getArticleBySlug, updateArticle } from '../../../services/articleService';
import toast from 'react-hot-toast';
import Spinner from '../../common/Spinner';

const EditArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await getArticleBySlug(slug);
        setArticle(data);
      } catch (error) {
        toast.error('Failed to fetch article');
        navigate('/admin/articles');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchArticle();
  }, [slug, navigate]);
  
  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const updatedArticle = await updateArticle(slug, formData);
      toast.success('Article updated successfully');
      navigate('/admin/articles');
      return updatedArticle;
    } catch (error) {
      toast.error('Failed to update article');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Edit Article</h1>
        <p className="text-gray-600">Update the article details</p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <ArticleForm 
          article={article}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
};
// At the bottom of ArticleForm.jsx
export default EditArticle;
