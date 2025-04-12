import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  getArticles,
  getArticleBySlug,
  bookmarkArticle,
  removeBookmark,
  getUserBookmarks
} from '../services/articleService';
import { useAuth } from './AuthContext';

const ArticlesContext = createContext();

export const useArticles = () => useContext(ArticlesContext);

export const ArticlesProvider = ({ children }) => {
  const [articles, setArticles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch all articles - wrapped with useCallback
  const fetchArticles = useCallback(async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticles(searchTerm);
      setArticles(data);
    } catch (err) {
      setError('Failed to fetch articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user bookmarks - wrapped with useCallback
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getUserBookmarks();
      setBookmarks(data);
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch article by slug - wrapped with useCallback
  const fetchArticleBySlug = useCallback(async (slug) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticleBySlug(slug);
      setCurrentArticle(data);
      return data;
    } catch (err) {
      setError('Failed to fetch article');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle bookmark - wrapped with useCallback
  const toggleBookmark = useCallback(async (article) => {
    if (!user) return;
    
    try {
      if (article.is_bookmarked) {
        await removeBookmark(article.slug);
        
        // Update bookmarks state
        setBookmarks(prevBookmarks => 
          prevBookmarks.filter(b => b.article !== article.id)
        );
        
        // Update articles state
        setArticles(prevArticles => 
          prevArticles.map(a =>
            a.id === article.id ? { ...a, is_bookmarked: false } : a
          )
        );
        
        // Update current article if needed
        if (currentArticle && currentArticle.id === article.id) {
          setCurrentArticle(prevArticle => ({ ...prevArticle, is_bookmarked: false }));
        }
      } else {
        const response = await bookmarkArticle(article.slug);
        
        // Update bookmarks state (add the new bookmark)
        setBookmarks(prevBookmarks => [...prevBookmarks, {
          id: response.id || Date.now(), // Use response id or fallback
          article: article.id,
          article_title: article.title,
          created_at: new Date().toISOString()
        }]);
        
        // Update articles state
        setArticles(prevArticles => 
          prevArticles.map(a =>
            a.id === article.id ? { ...a, is_bookmarked: true } : a
          )
        );
        
        // Update current article if needed
        if (currentArticle && currentArticle.id === article.id) {
          setCurrentArticle(prevArticle => ({ ...prevArticle, is_bookmarked: true }));
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  }, [user, currentArticle]);

  // Load initial data
  useEffect(() => {
    fetchArticles();
    if (user) {
      fetchBookmarks();
    }
  }, [fetchArticles, fetchBookmarks, user]);

  return (
    <ArticlesContext.Provider value={{
      articles,
      bookmarks,
      currentArticle,
      loading,
      error,
      fetchArticles,
      fetchBookmarks,
      fetchArticleBySlug,
      toggleBookmark,
      setCurrentArticle
    }}>
      {children}
    </ArticlesContext.Provider>
  );
};

export default ArticlesContext;