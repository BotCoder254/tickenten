import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Form validation schemas
const profileSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const UserProfile = () => {
  const { currentUser, updateProfile, updatePassword, error, setError } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  // Handle profile update
  const onProfileSubmit = async (data) => {
    try {
      await updateProfile(data);
      setProfileSuccess('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  // Handle password update
  const onPasswordSubmit = async (data) => {
    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess('Password updated successfully');
      setIsChangingPassword(false);
      resetPassword();
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update password:', err);
    }
  };

  // Cancel profile editing
  const cancelProfileEdit = () => {
    setIsEditing(false);
    resetProfile({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
    });
    setError(null);
  };

  // Cancel password change
  const cancelPasswordChange = () => {
    setIsChangingPassword(false);
    resetPassword();
    setError(null);
  };

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage your account information
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="md:col-span-2">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-sm btn-outline-primary flex items-center"
                  >
                    <FiEdit2 className="mr-1" />
                    Edit
                  </button>
                )}
              </div>

              {profileSuccess && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md">
                  {profileSuccess}
                </div>
              )}

              {error && !isEditing && !isChangingPassword && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
                  {error}
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="text-gray-400" />
                        </div>
                        <input
                          id="name"
                          type="text"
                          className={`input pl-10 w-full ${profileErrors.name ? 'border-red-500' : ''}`}
                          placeholder="Your name"
                          {...registerProfile('name')}
                        />
                      </div>
                      {profileErrors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {profileErrors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="text-gray-400" />
                        </div>
                        <input
                          id="email"
                          type="email"
                          className={`input pl-10 w-full ${profileErrors.email ? 'border-red-500' : ''}`}
                          placeholder="your.email@example.com"
                          {...registerProfile('email')}
                        />
                      </div>
                      {profileErrors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {profileErrors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button type="submit" className="btn btn-primary flex items-center">
                        <FiSave className="mr-1" />
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={cancelProfileEdit}
                        className="btn btn-outline flex items-center"
                      >
                        <FiX className="mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">
                      {currentUser?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">
                      {currentUser?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Account Created</p>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">
                      {new Date(currentUser?.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="md:col-span-1">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Security
              </h2>

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md">
                  {passwordSuccess}
                </div>
              )}

              {!isChangingPassword ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Change your password to keep your account secure.
                  </p>
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="btn btn-outline-primary w-full"
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          id="currentPassword"
                          type="password"
                          className={`input pl-10 w-full ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                          placeholder="••••••••"
                          {...registerPassword('currentPassword')}
                        />
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          id="newPassword"
                          type="password"
                          className={`input pl-10 w-full ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                          placeholder="••••••••"
                          {...registerPassword('newPassword')}
                        />
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          type="password"
                          className={`input pl-10 w-full ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                          placeholder="••••••••"
                          {...registerPassword('confirmPassword')}
                        />
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {passwordErrors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button type="submit" className="btn btn-primary flex-1">
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={cancelPasswordChange}
                        className="btn btn-outline flex items-center"
                      >
                        <FiX className="mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 