import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiGrid, FiList, FiHeart } from 'react-icons/fi';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';

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

// Improved image handling function
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
};

const SavedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Format date helper function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch saved events
  useEffect(() => {
    const fetchSavedEvents = async () => {
      setLoading(true);
      try {
        // Redirect to login if not authenticated
        if (!isAuthenticated) {
          navigate('/login', { state: { from: '/saved-events' } });
          return;
        }
        
        const response = await eventService.getSavedEvents();
        
        if (response.success) {
          setEvents(response.data || []);
        } else {
          setError(response.message || 'Failed to fetch saved events');
          setEvents([]);
        }
      } catch (err) {
        console.error('Error fetching saved events:', err);
        setError('An error occurred while fetching your saved events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedEvents();
  }, [isAuthenticated, navigate]);

  // Handle view details
  const handleViewDetails = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  // Handle unsave/unlike event
  const handleUnsaveEvent = async (eventId, e) => {
    e.stopPropagation();
    try {
      await eventService.unlikeEvent(eventId);
      // Remove the event from the list
      setEvents(events.filter(event => event._id !== eventId));
    } catch (err) {
      console.error('Error unsaving event:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Saved Events
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {events.length === 0 && !loading && !error ? (
          <div className="text-center py-16">
            <FiHeart className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">
              No saved events yet
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Events you save will appear here.
            </p>
            <Link
              to="/events"
              className="mt-6 inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    onClick={() => handleViewDetails(event._id)}
                    className="card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48">
                      <img
                        src={getImageUrl(event.featuredImage)}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => handleUnsaveEvent(event._id, e)}
                          className="p-2 bg-white/80 dark:bg-black/50 rounded-full text-red-500 hover:bg-white dark:hover:bg-black"
                        >
                          <FiHeart className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <div className="flex items-center text-sm">
                          <FiCalendar className="mr-1" />
                          {formatDate(event.startDate)}
                        </div>
                        <div className="flex items-center text-sm mt-1">
                          <FiMapPin className="mr-1" />
                          {event.isVirtual ? 'Virtual Event' : `${event.location?.city || 'Unknown'}, ${event.location?.country || ''}`}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {event.shortDescription}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.ticketTypes && event.ticketTypes.length > 0
                            ? `From ${event.ticketTypes[0].price} ${event.ticketTypes[0].currency}`
                            : 'Free'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full">
                          {event.category}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    onClick={() => handleViewDetails(event._id)}
                    className="card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-1/4 h-48 sm:h-auto relative">
                        <img
                          src={getImageUrl(event.featuredImage)}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => handleUnsaveEvent(event._id, e)}
                            className="p-2 bg-white/80 dark:bg-black/50 rounded-full text-red-500 hover:bg-white dark:hover:bg-black"
                          >
                            <FiHeart className="w-5 h-5 fill-current" />
                          </button>
                        </div>
                      </div>
                      <div className="sm:w-3/4 sm:pl-6 p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {event.title}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full">
                            {event.category}
                          </span>
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
                        <div className="mt-4 flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {event.ticketTypes && event.ticketTypes.length > 0
                              ? `From ${event.ticketTypes[0].price} ${event.ticketTypes[0].currency}`
                              : 'Free'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(event._id);
                            }}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SavedEvents; 