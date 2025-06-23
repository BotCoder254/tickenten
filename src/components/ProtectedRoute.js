import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component to secure routes that require authentication
 * @param {Object} props - Component props
 * @param {string} props.redirectPath - Path to redirect to if not authenticated
 * @returns {JSX.Element} Protected route component
 */
const ProtectedRoute = ({ redirectPath = '/login' }) => {
  const { isAuthenticated, loading } = useAuth();

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 