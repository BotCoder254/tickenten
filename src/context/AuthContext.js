import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setCurrentUser(userData.data);
        } catch (err) {
          console.error('Failed to load user:', err);
          // If token is invalid, logout
          if (err.response && err.response.status === 401) {
            authService.logout();
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    setError(null);
    try {
      const response = await authService.login(credentials);
      setCurrentUser(response.user);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const response = await authService.updateProfile(profileData);
      setCurrentUser(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      throw err;
    }
  };

  // Update password function
  const updatePassword = async (passwordData) => {
    setError(null);
    try {
      const response = await authService.updatePassword(passwordData);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
      throw err;
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await authService.forgotPassword({ email });
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
      throw err;
    }
  };

  // Reset password function
  const resetPassword = async (token, passwordData) => {
    setError(null);
    try {
      const response = await authService.resetPassword(token, passwordData);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      throw err;
    }
  };

  // Verify email function
  const verifyEmail = async (token) => {
    setError(null);
    try {
      const response = await authService.verifyEmail(token);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify email. Please try again.');
      throw err;
    }
  };

  // Resend verification email function
  const resendVerification = async () => {
    setError(null);
    try {
      const response = await authService.resendVerification();
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email. Please try again.');
      throw err;
    }
  };

  // Delete account function
  const deleteAccount = async () => {
    setError(null);
    try {
      const response = await authService.deleteAccount();
      authService.logout();
      setCurrentUser(null);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account. Please try again.');
      throw err;
    }
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    deleteAccount,
    setCurrentUser,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 