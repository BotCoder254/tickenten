import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiCalendar, FiMapPin, FiFilter, FiGrid, FiList, FiStar } from 'react-icons/fi';
import eventService from '../services/eventService';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
    },
  }),
};

// Categories
const categories = [
  { name: 'All', icon: '🌟', color: 'bg-gray-100 dark:bg-gray-800' },
  { name: 'Music', icon: '🎵', color: 'bg-purple-100 dark:bg-purple-900/30' },
  { name: 'Sports', icon: '⚽', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { name: 'Arts', icon: '🎨', color: 'bg-pink-100 dark:bg-pink-900/30' },
  { name: 'Food', icon: '🍕', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { name: 'Business', icon: '💼', color: 'bg-green-100 dark:bg-green-900/30' },
  { name: 'Technology', icon: '💻', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { name: 'Other', icon: '✨', color: 'bg-red-100 dark:bg-red-900/30' },
];

// Improved image handling function
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    sortBy: 'date',
    isVirtual: false,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
  });

  // Format date helper function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let response;
        
        // Build filter parameters
        const filterParams = {
          page: pagination.page,
          limit: pagination.limit
        };
        
        if (selectedCategory !== 'All') {
          filterParams.category = selectedCategory;
        }
        
        if (filters.isVirtual) {
          filterParams.isVirtual = true;
        }
        
        if (filters.sortBy === 'date') {
          filterParams.sortBy = 'startDate:asc';
        } else if (filters.sortBy === 'popularity') {
          filterParams.sortBy = 'attendees:desc';
        }

        // If there's a search query, use the search endpoint instead
        if (searchQuery) {
          response = await eventService.searchEvents(searchQuery);
        } else {
          response = await eventService.getEvents(filterParams);
        }
        
        if (response && response.success) {
          setEvents(response.data);
          setPagination(prev => ({
            ...prev,
            total: response.total || response.count || 0,
          }));
        } else {
          throw new Error('Failed to fetch events');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchQuery, selectedCategory, filters, pagination.page, pagination.limit]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset pagination when searching
    setPagination({ ...pagination, page: 1 });
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setPagination({ ...pagination, page: 1 });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-200">
      {/* Hero Section */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Explore Events
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-xl mx-auto">
              Discover amazing events happening around you or online. Find your next experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-dark-100 rounded-xl shadow-lg p-6 -mt-16 mb-8"
          >
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Search for events, concerts, conferences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex-shrink-0">
                <button type="submit" className="btn btn-primary w-full md:w-auto">
                  Search Events
                </button>
              </div>
            </form>
            
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${category.color} px-4 py-2 rounded-full cursor-pointer transition-all duration-200 ${
                    selectedCategory === category.name ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
                  }`}
                  onClick={() => handleCategorySelect(category.name)}
                >
                  <span className="mr-2">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{category.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Filter options */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="flex items-center">
                <FiFilter className="mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
              </div>
              <select
                className="form-select text-sm"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="date">Date</option>
                <option value="popularity">Popularity</option>
              </select>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="virtualEvents"
                  checked={filters.isVirtual}
                  onChange={(e) => handleFilterChange('isVirtual', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600"
                />
                <label htmlFor="virtualEvents" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Virtual Events Only
                </label>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-gray-200 dark:bg-dark-300 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300'
                }`}
              >
                <FiGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-gray-200 dark:bg-dark-300 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-300'
                }`}
              >
                <FiList className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button 
                className="mt-4 btn btn-outline-primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">No events found</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {events.map((event, index) => (
                    <motion.div
                      key={event._id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={fadeIn}
                      whileHover={{ y: -5 }}
                      className="card overflow-hidden"
                    >
                      <div className="relative h-48">
                        <img
                          src={getImageUrl(event.featuredImage)}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute top-3 right-3 bg-white dark:bg-dark-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {event.category}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {event.title}
                          </h3>
                          {event.isFeatured && (
                            <div className="flex items-center text-yellow-500">
                              <FiStar className="fill-current" />
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {event.shortDescription}
                        </p>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <FiCalendar className="mr-1" />
                            {formatDate(event.startDate)}
                          </div>
                          <div className="flex items-center mt-1">
                            <FiMapPin className="mr-1" />
                            {event.isVirtual ? 'Virtual Event' : `${event.location?.city || 'Unknown'}, ${event.location?.country || ''}`}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {event.ticketTypes && event.ticketTypes.length > 0
                              ? `${event.ticketTypes[0].price} ${event.ticketTypes[0].currency || 'USD'}`
                              : 'Free'}
                          </span>
                          {event._id && /^[0-9a-fA-F]{24}$/.test(event._id) ? (
                            <Link
                              to={`/events/${event._id}`}
                              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                            >
                              View Details
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-gray-400">Details Unavailable</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <motion.div
                      key={event._id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={fadeIn}
                      className="card p-4 flex flex-col sm:flex-row"
                    >
                      <div className="sm:w-1/4 mb-4 sm:mb-0">
                        <div className="relative h-48 sm:h-full">
                          <img
                            src={getImageUrl(event.featuredImage)}
                            alt={event.title}
                            className="w-full h-full object-cover rounded-lg"
                                                      onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
                          }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg"></div>
                          <div className="absolute top-3 right-3 bg-white dark:bg-dark-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {event.category}
                          </div>
                        </div>
                      </div>
                      <div className="sm:w-3/4 sm:pl-6">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {event.title}
                          </h3>
                          {event.isFeatured && (
                            <div className="flex items-center text-yellow-500">
                              <FiStar className="fill-current" />
                              <span className="ml-1 text-sm">Featured</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          {event.shortDescription}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2 text-gray-500" />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          <div className="flex items-center">
                            <FiMapPin className="mr-2 text-gray-500" />
                            <span>
                              {event.isVirtual ? 'Virtual Event' : `${event.location?.city || 'Unknown'}, ${event.location?.country || ''}`}
                            </span>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            {event.ticketTypes && event.ticketTypes.length > 0
                              ? `${event.ticketTypes[0].price} ${event.ticketTypes[0].currency || 'USD'}`
                              : 'Free'}
                          </span>
                          {event._id && /^[0-9a-fA-F]{24}$/.test(event._id) ? (
                            <Link
                              to={`/events/${event._id}`}
                              className="btn btn-primary"
                            >
                              View Details
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-gray-400">Details Unavailable</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="mt-12 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded-md ${
                        pagination.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-100 dark:text-gray-300 dark:hover:bg-dark-200'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {[...Array(Math.ceil(pagination.total / pagination.limit)).keys()].map((number) => (
                      <button
                        key={number + 1}
                        onClick={() => handlePageChange(number + 1)}
                        className={`px-3 py-1 rounded-md ${
                          pagination.page === number + 1
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-100 dark:text-gray-300 dark:hover:bg-dark-200'
                        }`}
                      >
                        {number + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === Math.ceil(pagination.total / pagination.limit)}
                      className={`px-3 py-1 rounded-md ${
                        pagination.page === Math.ceil(pagination.total / pagination.limit)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-dark-100 dark:text-gray-300 dark:hover:bg-dark-200'
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events; 