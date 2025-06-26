import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiMoon, FiSun, FiUser, FiPlus, FiSettings } from 'react-icons/fi';
import { useTheme } from '../../App';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md dark:bg-dark-100'
          : 'bg-transparent dark:bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-2xl font-display font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"
            >
              TickenTen
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                } transition-colors duration-200`}
              >
                Home
              </Link>
              <Link
                to="/events"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname.includes('/events')
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                } transition-colors duration-200`}
              >
                Events
              </Link>
              <Link
                to="/tickets/resale"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname.includes('/tickets/resale')
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                } transition-colors duration-200`}
              >
                Resale Tickets
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname.includes('/dashboard')
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                    } transition-colors duration-200`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/events/new"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname.includes('/dashboard/events/new')
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                    } transition-colors duration-200`}
                  >
                    <FiPlus className="inline mr-1" />
                    Create Event
                  </Link>
                  
                  {/* User Profile Dropdown */}
                  <div className="relative profile-menu">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 overflow-hidden">
                        {currentUser?.avatar ? (
                          <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiUser className="w-4 h-4" />
                        )}
                      </div>
                      <span>{currentUser?.name?.split(' ')[0] || 'Account'}</span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showProfileMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-200 ring-1 ring-black ring-opacity-5 py-1"
                        >
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-100"
                          >
                            <FiSettings className="inline mr-2" />
                            Profile Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-dark-100"
                          >
                            Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200"
                >
                  <FiUser className="mr-2" />
                  Login
                </Link>
              )}

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-200 focus:outline-none"
                aria-label="Toggle dark mode"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: darkMode ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {darkMode ? (
                    <FiSun className="h-5 w-5" />
                  ) : (
                    <FiMoon className="h-5 w-5" />
                  )}
                </motion.div>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 mr-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-200 focus:outline-none"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <FiSun className="h-5 w-5" />
              ) : (
                <FiMoon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-200 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-dark-100 shadow-lg"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                } transition-colors duration-200`}
              >
                Home
              </Link>
              <Link
                to="/events"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-200"
              >
                Events
              </Link>
              <Link
                to="/tickets/resale"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-200"
              >
                Resale Tickets
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-200"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/events/new"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname.includes('/dashboard/events/new')
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                    } transition-colors duration-200`}
                  >
                    <FiPlus className="inline mr-1" />
                    Create Event
                  </Link>
                  <Link
                    to="/profile"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === '/profile'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
                    } transition-colors duration-200`}
                  >
                    <FiSettings className="inline mr-1" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-500 transition-colors duration-200"
                >
                  <FiUser className="mr-2" />
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar; 