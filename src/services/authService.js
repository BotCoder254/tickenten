import api from './api';

/**
 * Authentication service for handling user authentication
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - API response
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login a user
   * @param {Object} credentials - User login credentials
   * @returns {Promise} - API response with token and user data
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout the current user
   */
  logout: () => {
    localStorage.removeItem('token');
  },

  /**
   * Get the current user profile
   * @returns {Promise} - API response with user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} - API response with updated user data
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/update-profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user password
   * @param {Object} passwordData - Password update data
   * @returns {Promise} - API response
   */
  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/update-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Request password reset
   * @param {Object} emailData - Email for password reset
   * @returns {Promise} - API response
   */
  forgotPassword: async (emailData) => {
    try {
      const response = await api.post('/auth/forgot-password', emailData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {Object} passwordData - New password data
   * @returns {Promise} - API response
   */
  resetPassword: async (token, passwordData) => {
    try {
      const response = await api.put(`/auth/reset-password/${token}`, passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise} - API response
   */
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Resend verification email
   * @returns {Promise} - API response
   */
  resendVerification: async () => {
    try {
      const response = await api.post('/auth/resend-verification');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload user avatar
   * @param {File} avatarFile - The avatar image file
   * @returns {Promise} - API response with avatar URL
   */
  uploadAvatar: async (avatarFile) => {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      // Use axios directly with multipart/form-data
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/avatar', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload avatar');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete user account
   * @returns {Promise} - API response
   */
  deleteAccount: async () => {
    try {
      const response = await api.delete('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user is authenticated
   */
  isAuthenticated: () => {
    return localStorage.getItem('token') ? true : false;
  }
};

export default authService; 