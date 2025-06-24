import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';
import authService from '../services/authService';

const UserProfile = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, deleteAccount } = useAuth();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    location: '',
    website: '',
    socialLinks: {
      twitter: '',
      facebook: '',
      instagram: '',
      linkedin: '',
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Generate avatar placeholder based on user's name
  const getInitialsAvatar = (name) => {
    if (!name) return null;
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    // Generate a consistent color based on the name
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Simple hash function to get a consistent color
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + acc;
    }, 0);
    
    const colorIndex = hash % colors.length;
    return { initials, colorClass: colors[colorIndex] };
  };

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await authService.getCurrentUser();
        setFormData({
          name: userData.data.name || '',
          email: userData.data.email || '',
          phoneNumber: userData.data.phoneNumber || '',
          bio: userData.data.bio || '',
          location: userData.data.location || '',
          website: userData.data.website || '',
          socialLinks: {
            twitter: userData.data.socialLinks?.twitter || '',
            facebook: userData.data.socialLinks?.facebook || '',
            instagram: userData.data.socialLinks?.instagram || '',
            linkedin: userData.data.socialLinks?.linkedin || '',
          },
        });
        setCurrentUser(userData.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user data. Please try again.');
        setLoading(false);
      }
    };

    if (!currentUser) {
      fetchUserData();
    } else {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        website: currentUser.website || '',
        socialLinks: {
          twitter: currentUser.socialLinks?.twitter || '',
          facebook: currentUser.socialLinks?.facebook || '',
          instagram: currentUser.socialLinks?.instagram || '',
          linkedin: currentUser.socialLinks?.linkedin || '',
        },
      });
      setLoading(false);
    }
  }, [currentUser, setCurrentUser]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (socialLinks)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updatedUser = await authService.updateProfile(formData);
      setCurrentUser(updatedUser.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteAccount();
        navigate('/login');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete account');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Get avatar placeholder
  const avatarPlaceholder = getInitialsAvatar(currentUser?.name);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Notification Messages */}
        {error && (
          <div className={`mb-6 border px-4 py-3 rounded ${darkMode ? 'bg-red-900 text-red-200 border-red-700' : 'bg-red-100 text-red-700 border-red-400'}`}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={`mb-6 border px-4 py-3 rounded ${darkMode ? 'bg-green-900 text-green-200 border-green-700' : 'bg-green-100 text-green-700 border-green-400'}`}>
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className={`rounded-lg shadow-lg p-6 mb-8 ${darkMode ? 'bg-dark-200 text-gray-200' : 'bg-white text-gray-800'}`}>
          <div className="flex flex-col md:flex-row">
            {/* Avatar Section */}
            <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
              <div className={`w-40 h-40 rounded-full overflow-hidden mb-4 flex items-center justify-center ${darkMode ? 'border-2 border-dark-100' : 'border-2 border-gray-200'}`}>
                {avatarPlaceholder ? (
                  <div className={`w-full h-full flex items-center justify-center text-3xl font-bold text-white ${avatarPlaceholder.colorClass}`}>
                    {avatarPlaceholder.initials}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="font-medium">Profile Picture</p>
                <p className="text-sm mt-1">We use your initials to create your avatar</p>
              </div>
            </div>

            {/* Profile Info Section */}
            <div className="md:w-2/3 md:pl-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {currentUser?.name}
                </h1>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} text-white font-bold py-2 px-4 rounded`}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentUser?.email}</p>
                  </div>
                  
                  {currentUser?.phoneNumber && (
                    <div>
                      <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</h2>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentUser?.phoneNumber}</p>
                    </div>
                  )}
                  
                  {currentUser?.bio && (
                    <div>
                      <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bio</h2>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentUser?.bio}</p>
                    </div>
                  )}
                  
                  {currentUser?.location && (
                    <div>
                      <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</h2>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentUser?.location}</p>
                    </div>
                  )}
                  
                  {currentUser?.website && (
                    <div>
                      <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Website</h2>
                      <a href={currentUser.website} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
                        {currentUser.website}
                      </a>
                    </div>
                  )}
                  
                  {/* Social Links */}
                  {(currentUser?.socialLinks?.twitter || currentUser?.socialLinks?.facebook || currentUser?.socialLinks?.instagram || currentUser?.socialLinks?.linkedin) && (
                    <div>
                      <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Social Media</h2>
                      <div className="flex space-x-4 mt-2">
                        {currentUser?.socialLinks?.twitter && (
                          <a href={currentUser.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <i className="fab fa-twitter text-xl"></i>
                          </a>
                        )}
                        {currentUser?.socialLinks?.facebook && (
                          <a href={currentUser.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-900">
                            <i className="fab fa-facebook text-xl"></i>
                          </a>
                        )}
                        {currentUser?.socialLinks?.instagram && (
                          <a href={currentUser.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                            <i className="fab fa-instagram text-xl"></i>
                          </a>
                        )}
                        {currentUser?.socialLinks?.linkedin && (
                          <a href={currentUser.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">
                            <i className="fab fa-linkedin text-xl"></i>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="name">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                        darkMode 
                          ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="email">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                        darkMode 
                          ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="phoneNumber">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                        darkMode 
                          ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="bio">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="3"
                      className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                        darkMode 
                          ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="location">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                        darkMode 
                          ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="website">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                        darkMode 
                          ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <h3 className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Social Media Links</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="twitter">
                          Twitter
                        </label>
                        <input
                          type="url"
                          id="twitter"
                          name="socialLinks.twitter"
                          value={formData.socialLinks.twitter}
                          onChange={handleInputChange}
                          className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                            darkMode 
                              ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="facebook">
                          Facebook
                        </label>
                        <input
                          type="url"
                          id="facebook"
                          name="socialLinks.facebook"
                          value={formData.socialLinks.facebook}
                          onChange={handleInputChange}
                          className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                            darkMode 
                              ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                          placeholder="https://facebook.com/username"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="instagram">
                          Instagram
                        </label>
                        <input
                          type="url"
                          id="instagram"
                          name="socialLinks.instagram"
                          value={formData.socialLinks.instagram}
                          onChange={handleInputChange}
                          className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                            darkMode 
                              ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="linkedin">
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          id="linkedin"
                          name="socialLinks.linkedin"
                          value={formData.socialLinks.linkedin}
                          onChange={handleInputChange}
                          className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                            darkMode 
                              ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className={`rounded-lg shadow-lg p-6 mb-8 ${darkMode ? 'bg-dark-200 text-gray-200' : 'bg-white text-gray-800'}`}>
          <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Change Password</h2>
          
          <form onSubmit={handlePasswordUpdate} className="max-w-lg mx-auto space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="currentPassword">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                  darkMode 
                    ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
                required
              />
            </div>
            
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="newPassword">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                  darkMode 
                    ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
                minLength="6"
                required
              />
            </div>
            
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                  darkMode 
                    ? 'bg-dark-100 border-dark-50 text-gray-200 focus:border-primary-500' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
                minLength="6"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Deletion Section */}
        <div className={`rounded-lg shadow-lg p-6 ${darkMode ? 'bg-dark-200 text-gray-200' : 'bg-white text-gray-800'}`}>
          <h2 className="text-xl font-bold text-red-600 mb-6">Danger Zone</h2>
          
          <div className={`border rounded p-6 ${darkMode ? 'border-red-700' : 'border-red-300'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Delete Account</h3>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 