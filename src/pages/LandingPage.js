import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiCalendar, FiMapPin, FiArrowRight, FiStar } from 'react-icons/fi';

// Mock data for featured events
const featuredEvents = [
  {
    id: 1,
    title: 'Tech Conference 2023',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    date: 'Oct 15, 2023',
    location: 'San Francisco, CA',
    price: '$99',
    category: 'Technology',
    rating: 4.8,
  },
  {
    id: 2,
    title: 'Music Festival Weekend',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    date: 'Nov 5-7, 2023',
    location: 'Austin, TX',
    price: '$149',
    category: 'Music',
    rating: 4.9,
  },
  {
    id: 3,
    title: 'Food & Wine Expo',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    date: 'Sep 22, 2023',
    location: 'New York, NY',
    price: '$75',
    category: 'Food',
    rating: 4.7,
  },
  {
    id: 4,
    title: 'Art Gallery Opening',
    image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    date: 'Oct 3, 2023',
    location: 'Chicago, IL',
    price: '$25',
    category: 'Art',
    rating: 4.5,
  },
];

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

const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

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
            <div className="flex flex-col md:flex-row gap-4">
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
                <button className="btn btn-primary w-full md:w-auto">
                  Search Events
                </button>
              </div>
            </div>
            
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEvents.map((event, index) => (
              <motion.div
                key={event.id}
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
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white dark:bg-dark-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {event.category}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {event.title}
                    </h3>
                    <div className="flex items-center text-yellow-500">
                      <FiStar className="fill-current" />
                      <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">{event.rating}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <FiCalendar className="mr-1" />
                      {event.date}
                    </div>
                    <div className="flex items-center mt-1">
                      <FiMapPin className="mr-1" />
                      {event.location}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-white">{event.price}</span>
                    {event.id && /^[0-9a-fA-F]{24}$/.test(event.id) ? (
                      <Link
                        to={`/events/${event.id}`}
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