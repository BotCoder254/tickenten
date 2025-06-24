import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiCalendar, FiMapPin, FiArrowRight, FiStar } from 'react-icons/fi';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';

// Categories
const categories = [
  { name: 'Music', icon: '🎵', color: 'bg-purple-100 dark:bg-purple-900/30' },
  { name: 'Sports', icon: '⚽', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { name: 'Arts', icon: '🎨', color: 'bg-pink-100 dark:bg-pink-900/30' },
  { name: 'Food', icon: '🍕', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { name: 'Business', icon: '💼', color: 'bg-green-100 dark:bg-green-900/30' },
  { name: 'Technology', icon: '💻', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

// Helper function to get image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
};

// Format date helper function
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Add helper function to get display status for the event
const getEventStatus = (event) => {
  if (!event) return '';
  
  const now = new Date();
  const hasEnded = event.endDate && new Date(event.endDate) < now;
  
  if (hasEnded) {
    return 'Ended';
  }
  
  const isSoldOut = event.ticketTypes && event.ticketTypes.length > 0 && 
    event.ticketTypes.every(ticket => ticket.quantitySold >= ticket.quantity);
  
  if (isSoldOut) {
    return 'Sold Out';
  }
  
  // Only show 'Open' for all events on public pages
  return 'Open';
};

// Add helper function to get status color class
const getStatusColorClass = (event) => {
  const now = new Date();
  const hasEnded = event.endDate && new Date(event.endDate) < now;
  
  if (hasEnded) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }
  
  const isSoldOut = event.ticketTypes && event.ticketTypes.length > 0 && 
    event.ticketTypes.every(ticket => ticket.quantitySold >= ticket.quantity);
  
  if (isSoldOut) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }
  
  // Always show green for open events
  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
};

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch featured events
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      setLoading(true);
      try {
        // First, try to get featured events
        const response = await eventService.getFeaturedEvents(4);
        
        if (response && response.success && response.data && response.data.length > 0) {
          setFeaturedEvents(response.data);
        } else {
          // If no featured events, fall back to getting regular events
          const allEventsResponse = await eventService.getEvents({ limit: 4 });
          if (allEventsResponse && allEventsResponse.success) {
            setFeaturedEvents(allEventsResponse.data);
          } else {
            throw new Error('Failed to fetch events');
          }
        }
      } catch (err) {
        console.error('Error fetching featured events:', err);
        // Try to get regular events as a final fallback
        try {
          const fallbackResponse = await eventService.getEvents({ 
            limit: 4,
            // Ensure we're only requesting published events
            status: 'published',
            visibility: 'public'
          });
          
          if (fallbackResponse && fallbackResponse.success) {
            setFeaturedEvents(fallbackResponse.data);
          } else {
            setError('Failed to load events');
          }
        } catch (fallbackErr) {
          console.error('Error fetching fallback events:', fallbackErr);
          setError('Failed to load events');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  // Handle view details with authentication check
  const handleViewDetails = (eventId) => {
    // Direct navigation without authentication check
    navigate(`/events/${eventId}`);
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return; // Don't search if query is empty
    }
    navigate(`/events?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-dark-200 dark:to-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Discover and Create
                <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"> Amazing Events</span>
              </h1>
              <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 max-w-lg">
                Find the perfect events or create your own. TickenTen makes it easy to discover, manage, and attend events that match your interests.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Create an Event
                </Link>
                <Link
                  to="/events"
                  className="btn btn-outline"
                >
                  Explore Events
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Events showcase"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <div className="text-sm font-medium">Featured Event</div>
                    <div className="text-xl font-bold mt-1">Summer Music Festival 2023</div>
                    <div className="flex items-center mt-2 text-sm">
                      <FiCalendar className="mr-1" /> June 15-18, 2023
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -bottom-6 -right-6 bg-white dark:bg-dark-100 rounded-xl shadow-lg p-4 w-40"
              >
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">10,000+</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-secondary-300 dark:bg-secondary-900 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-primary-300 dark:bg-primary-900 rounded-full opacity-10 blur-3xl"></div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative -mt-24 bg-white dark:bg-dark-100 rounded-xl shadow-xl p-6"
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
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${category.color} px-4 py-2 rounded-full cursor-pointer transition-all duration-200`}
                  onClick={() => navigate(`/events?category=${encodeURIComponent(category.name)}`)}
                >
                  <span className="mr-2">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{category.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-gray-50 dark:bg-dark-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              Featured Events
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/events"
                className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
              >
                View all events
                <FiArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : featuredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-dark-100 rounded-lg shadow-md p-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">No events found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Link to="/events" className="btn btn-primary">
                Browse All Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
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
                        e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-white dark:bg-dark-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {event.category}
                    </div>
                    <div className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColorClass(event)}`}>
                      {getEventStatus(event)}
                    </div>
                    <div className="absolute bottom-0 left-0 p-4 text-white">
                      <div className="flex items-center text-sm">
                        <FiCalendar className="mr-1" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center text-sm mt-1">
                        <FiMapPin className="mr-1" />
                        <span>{event.isVirtual ? 'Virtual Event' : `${event.location?.city || 'Unknown location'}`}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{event.title}</h3>
                      {event.isFeatured && (
                        <FiStar className="text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {event.shortDescription}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {event.ticketTypes && event.ticketTypes.length > 0
                          ? `From ${event.ticketTypes[0].price} ${event.ticketTypes[0].currency}`
                          : 'Free'}
                      </span>
                      <Link
                        to={`/events/${event._id}`}
                        className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How TickenTen Works</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Simple and powerful. Create and discover events in just a few steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Create an Account',
                description: 'Sign up as an event creator to start managing your events.',
                icon: '👤',
                delay: 0,
              },
              {
                title: 'Create Your Event',
                description: 'Set up your event details, pricing, and publish it to our platform.',
                icon: '🎟️',
                delay: 0.1,
              },
              {
                title: 'Start Selling',
                description: 'Watch as attendees discover and purchase tickets to your events.',
                icon: '💰',
                delay: 0.2,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: step.delay }}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-50 dark:bg-dark-200"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold">Ready to create your first event?</h2>
              <p className="mt-4 text-lg text-white/90 max-w-lg">
                Join thousands of event creators who trust TickenTen to manage their events and ticket sales.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex justify-center lg:justify-end"
            >
              <Link
                to="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-100 focus:ring-white"
              >
                Get Started for Free
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 