import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        const response = await verifyEmail(token);
        setVerificationStatus('success');
        setMessage(response.message || 'Your email has been successfully verified!');
      } catch (error) {
        setVerificationStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Email verification failed. The link may be invalid or expired.'
        );
      }
    };

    if (token) {
      verifyUserEmail();
    } else {
      setVerificationStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 card p-8"
      >
        {verificationStatus === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Verifying your email...
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address.
            </p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
              <FiCheck className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Email Verified!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {message}
            </p>
            <div className="mt-6">
              <Link to="/login" className="btn btn-primary w-full">
                Log In
              </Link>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Verification Failed
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {message}
            </p>
            <div className="mt-6 space-y-3">
              <Link to="/login" className="btn btn-primary w-full">
                Go to Login
              </Link>
              <Link to="/register" className="btn btn-outline w-full">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail; 