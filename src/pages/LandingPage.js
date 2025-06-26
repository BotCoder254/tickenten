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
useEffect(() => {
  const counter = document.getElementById("active-user-counter");
  if (!counter) return;

  let start = 0;
  const target = 10000;
  const duration = 2; // seconds
  const increment = target / (duration * 60); // 60fps

  const interval = setInterval(() => {
    start += increment;
    if (start >= target) {
      start = target;
      clearInterval(interval);
    }
    counter.innerText = `${Math.floor(start).toLocaleString()}+`;
  }, 1000 / 60);

  return () => clearInterval(interval);
}, []);
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
   <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-dark-200 dark:to-dark-300 overflow-hidden">
  {/* Background Blobs */}
  <div className="absolute top-[-10rem] right-[-10rem] w-[32rem] h-[32rem] rounded-full bg-secondary-400 dark:bg-secondary-900 opacity-20 blur-3xl z-0"></div>
  <div className="absolute bottom-[-10rem] left-[-10rem] w-[32rem] h-[32rem] rounded-full bg-primary-400 dark:bg-primary-900 opacity-20 blur-3xl z-0"></div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      {/* Left Text */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-white tracking-tight">
          Discover and Create <br />
          <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Amazing Events
          </span>
        </h1>
        <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 max-w-xl leading-relaxed">
          Find the perfect events or create your own. TickenTen makes it easy to
          discover, manage, and attend events that match your interests.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            to="/dashboard/events/new"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out text-center"
          >
            Create an Event
          </Link>
          <Link
            to="/events"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 font-semibold rounded-lg transition duration-300 ease-in-out text-center"
          >
            Explore Events
          </Link>
        </div>
      </motion.div>

      {/* Right Visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative"
      >
        <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/10">
          <img
            src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Events showcase"
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <div className="text-white">
              <div className="text-sm font-medium opacity-80">🎉 Featured Event</div>
              <div className="text-2xl font-bold mt-1">Summer Music Festival 2023</div>
              <div className="flex items-center mt-2 text-sm text-white/80">
                <FiCalendar className="mr-2" />
              <span>June 15-28 2025</span>
              </div>
            </div>
          </div>
        </div>
              <motion.div
  initial={{ opacity: 0, y: 30, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.6, delay: 0.6 }}
  className="absolute -bottom-8 -right-8 backdrop-blur-md bg-white/80 dark:bg-black/40 border border-white/10 rounded-2xl shadow-2xl p-5 w-56 hover:scale-105 transition-transform"
>
  <div className="text-center space-y-1">
    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Active Users
    </div>
    <span
      className="text-2xl font-bold text-gray-900 dark:text-white mt-1"
      id="active-user-counter"
    >
      0
    </span>
  </div>
</motion.div>
      </motion.div>
    </div>
  </div>
</section>
{/* Search Section */}
<section className="py-16 bg-white dark:bg-dark-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative -mt-24 bg-white dark:bg-dark-100 rounded-2xl shadow-lg dark:shadow-gray-800/50 p-8 md:p-10 border border-gray-100 dark:border-gray-800"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Discover Amazing Events
      </h2>

      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
        {/* Search input */}
        <div className="flex-grow relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="input pl-10 w-full h-12 md:h-14 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-200 text-gray-800 dark:text-white"
            placeholder="Search for events, concerts, conferences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Search button */}
        <div className="flex-shrink-0">
          <button
            type="submit"
            className="btn btn-primary w-full md:w-auto h-12 md:h-14 px-6 text-base font-medium hover:shadow-lg transition-shadow duration-300"
          >
            Search Events
          </button>
        </div>
      </form>

      {/* Popular Categories */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Popular Categories
        </h3>
        <div className="flex flex-wrap gap-3">
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
              className={`${category.color} px-4 py-2 rounded-full cursor-pointer transition-all duration-200 flex items-center hover:shadow-md dark:hover:shadow-gray-900/30`}
              onClick={() => navigate(`/events?category=${encodeURIComponent(category.name)}`)}
            >
              <span className="mr-2 text-lg">{category.icon}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {category.name}
              </span>
            </motion.div>
          ))}
        </div>
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
<section className="py-20 relative overflow-hidden bg-white dark:bg-dark-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">How TickenTen Works</h2>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Simple, seamless, and powerful. Start hosting events with ease.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      {[
        {
          title: 'Create an Account',
          description: 'Sign up to begin managing and hosting your own events.',
          icon: (
            <svg className="w-12 h-12 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25v-.75A6.75 6.75 0 0111.25 12.75h1.5A6.75 6.75 0 0119.5 19.5v.75" />
            </svg>
          ),
          delay: 0,
        },
        {
          title: 'Create Your Event',
          description: 'Add event info, set prices, and publish it for the world to see.',
          icon: (
            <svg className="w-12 h-12 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75V5.25M17.25 3.75V5.25M4.5 9.75h15M4.5 20.25h15M4.5 5.25a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25v15a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 20.25V5.25z" />
            </svg>
          ),
          delay: 0.15,
        },
        {
          title: 'Start Selling',
          description: 'Users discover and buy tickets easily. Track your attendees effortlessly.',
          icon: (
            <svg className="w-12 h-12 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5v-1.5a.75.75 0 01.75-.75H7.5M21 13.5v1.5a.75.75 0 01-.75.75H16.5M14.25 3.75v1.5a.75.75 0 01-.75.75H10.5M7.5 21v-1.5a.75.75 0 01.75-.75h3.75" />
            </svg>
          ),
          delay: 0.3,
        },
      ].map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: step.delay }}
          className="group bg-white/80 dark:bg-dark-200 backdrop-blur-lg border border-gray-200 dark:border-gray-800 p-8 rounded-2xl text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
        >
          <div className="mb-6">
            {step.icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{step.title}</h3>
          <p className="mt-3 text-gray-600 dark:text-gray-400">{step.description}</p>
        </motion.div>
      ))}
    </div>
  </div>

  {/* Fluid animated background glow */}
  <div className="absolute top-10 -left-10 w-72 h-72 bg-gradient-to-br from-primary-400 to-purple-400 dark:from-primary-600 dark:to-purple-800 opacity-10 blur-[100px] rounded-full animate-pulse"></div>
  <div className="absolute bottom-10 -right-10 w-72 h-72 bg-gradient-to-br from-secondary-400 to-pink-500 dark:from-secondary-600 dark:to-pink-800 opacity-10 blur-[100px] rounded-full animate-pulse delay-300"></div>
</section>
  {/* CTA Section */}
<section className="relative py-24 bg-gradient-to-br from-primary-600 to-secondary-700 text-white overflow-hidden">
  <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-[120px] opacity-10 animate-pulse"></div>
  <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[120px] opacity-10 animate-pulse delay-200"></div>

  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-snug">
          Ready to launch your first event?
        </h2>
        <p className="mt-4 text-lg text-white/90 max-w-xl">
          Join thousands of successful event creators who trust <span className="font-semibold underline decoration-white/30">TickenTen</span> to host, promote, and sell tickets with ease.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex justify-center lg:justify-end"
      >
        <Link
          to="/register"
          className="inline-flex items-center gap-3 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/30"
        >
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
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
