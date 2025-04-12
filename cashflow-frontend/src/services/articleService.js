import api from './api';

// Get all articles (with optional search)
export const getArticles = async (searchTerm = '') => {
  try {
    const url = searchTerm 
      ? `/articles/articles/?search=${encodeURIComponent(searchTerm)}` 
      : '/articles/articles/';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

// Get article by slug
export const getArticleBySlug = async (slug) => {
  try {
    const response = await api.get(`/articles/articles/${slug}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching article with slug ${slug}:`, error);
    throw error;
  }
};

// Create new article (admin only)
export const createArticle = async (articleData) => {
  try {
    const response = await api.post('/articles/articles/', articleData);
    return response.data;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

// Update article (admin only)
export const updateArticle = async (slug, articleData) => {
  try {
    const response = await api.put(`/articles/articles/${slug}/`, articleData);
    return response.data;
  } catch (error) {
    console.error(`Error updating article with slug ${slug}:`, error);
    throw error;
  }
};

// Delete article (admin only)
export const deleteArticle = async (slug) => {
  try {
    await api.delete(`/articles/articles/${slug}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting article with slug ${slug}:`, error);
    throw error;
  }
};

// Toggle article published status (admin only)
export const togglePublishedStatus = async (slug, isPublished) => {
  try {
    const response = await api.patch(`/articles/articles/${slug}/`, {
      is_published: isPublished
    });
    return response.data;
  } catch (error) {
    console.error(`Error toggling published status for article ${slug}:`, error);
    throw error;
  }
};

// Bookmark an article
export const bookmarkArticle = async (slug) => {
  try {
    const response = await api.post(`/articles/articles/${slug}/bookmark/`);
    return response.data;
  } catch (error) {
    console.error(`Error bookmarking article ${slug}:`, error);
    throw error;
  }
};

// Remove bookmark from an article
export const removeBookmark = async (slug) => {
  try {
    await api.post(`/articles/articles/${slug}/remove_bookmark/`);
    return true;
  } catch (error) {
    console.error(`Error removing bookmark from article ${slug}:`, error);
    throw error;
  }
};

// Get user's bookmarks
export const getUserBookmarks = async () => {
  try {
    const response = await api.get('/articles/bookmarks/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    throw error;
  }
};