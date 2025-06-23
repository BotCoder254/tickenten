import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiTag, FiShare2, FiHeart } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import eventService from '../services/eventService';
import ticketService from '../services/ticketService';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { eventId } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { isAuthenticated, currentUser } = useAuth();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(eventId),
    select: (data) => data.data,
  });

  // Check if event is liked
  useEffect(() => {
    const checkEventLiked = async () => {
      if (isAuthenticated && eventId) {
        try {
          const response = await eventService.checkLiked(eventId);
          setIsLiked(response.isLiked);
        } catch (err) {
          console.error('Error checking if event is liked:', err);
        }
      }
    };

    checkEventLiked();
  }, [isAuthenticated, eventId]);

  // Toggle like status
  const toggleLike = async () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      return;
    }

    try {
      if (isLiked) {
        await eventService.unlikeEvent(eventId);
      } else {
        await eventService.likeEvent(eventId);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Error toggling like status:', err);
    }
  };

  // Handle ticket selection
  const handleTicketSelect = (ticketType) => {
    setSelectedTicketType(ticketType);
    setQuantity(1);
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && selectedTicketType && value <= selectedTicketType.quantity - selectedTicketType.quantitySold) {
      setQuantity(value);
    }
  };

  // Handle ticket purchase
  const handlePurchaseTicket = async () => {
    if (!isAuthenticated || !selectedTicketType) return;

    try {
      await ticketService.purchaseTickets({
        eventId,
        ticketTypeId: selectedTicketType._id,
        quantity
      });
      // Redirect to tickets page or show success message
    } catch (err) {
      console.error('Error purchasing ticket:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Error Loading Event</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error.response?.data?.message || 'Failed to load event details. Please try again.'}
          </p>
          <Link to="/events" className="mt-4 btn btn-primary inline-block">
            Browse Other Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/events" className="mt-4 btn btn-primary inline-block">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16">
      {/* Event Hero Section */}
      <div className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Event Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="md:w-1/3"
            >
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img
                  src={event.featuredImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                  alt={event.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            </motion.div>

            {/* Event Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:w-2/3"
            >
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {event.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
              <p className="text-lg text-white/90 mb-6">{event.shortDescription}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <FiCalendar className="mr-2" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="mr-2" />
                  <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                </div>
                <div className="flex items-center">
                  <FiMapPin className="mr-2" />
                  <span>
                    {event.isVirtual
                      ? 'Virtual Event'
                      : `${event.location.venue}, ${event.location.city}`}
                  </span>
                </div>
                <div className="flex items-center">
                  <FiTag className="mr-2" />
                  <span>
                    {event.ticketTypes && event.ticketTypes.length > 0
                      ? `From ${event.ticketTypes[0].price} ${event.ticketTypes[0].currency}`
                      : 'Free'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={toggleLike}
                  className={`flex items-center px-4 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition-colors ${
                    isLiked ? 'text-red-300' : 'text-white'
                  }`}
                >
                  <FiHeart className={`mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Saved' : 'Save'}
                </button>
                <button className="flex items-center px-4 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition-colors">
                  <FiShare2 className="mr-2" />
                  Share
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="card p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">About This Event</h2>
              <div className="prose max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300">
                <p className="whitespace-pre-line">{event.description}</p>
              </div>
            </div>

            {/* Location */}
            {!event.isVirtual && event.location && (
              <div className="card p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Location</h2>
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{event.location.venue}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {event.location.address}, {event.location.city}, {event.location.state} {event.location.zipCode}
                  </p>
                </div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  {/* Map would go here */}
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Map view unavailable in demo
                  </div>
                </div>
              </div>
            )}

            {/* Organizer */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Organizer</h2>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <span className="text-lg font-bold">
                    {event.creator?.name ? event.creator.name.charAt(0) : 'O'}
                  </span>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.creator?.name || 'Event Organizer'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {event.creator?.email || 'Contact information unavailable'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Ticket Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-1"
          >
            <div className="card p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Tickets</h2>
              
              {event.ticketTypes && event.ticketTypes.length > 0 ? (
                <div>
                  <div className="space-y-4 mb-6">
                    {event.ticketTypes.map((ticket, index) => {
                      const isSelected = selectedTicketType && selectedTicketType.name === ticket.name;
                      const remainingTickets = ticket.quantity - ticket.quantitySold;
                      const isSoldOut = remainingTickets <= 0;
                      
                      return (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSoldOut
                              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60'
                              : isSelected
                              ? 'border-primary-500 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                          }`}
                          onClick={() => !isSoldOut && handleTicketSelect(ticket)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white">{ticket.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white">
                                {ticket.price} {ticket.currency}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isSoldOut ? 'Sold Out' : `${remainingTickets} remaining`}
                              </p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Quantity
                              </label>
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (quantity > 1) setQuantity(quantity - 1);
                                  }}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={remainingTickets}
                                  value={quantity}
                                  onChange={handleQuantityChange}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mx-2 w-16 text-center input py-1 px-2"
                                />
                                <button
                                  type="button"
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (quantity < remainingTickets) setQuantity(quantity + 1);
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {selectedTicketType && (
                    <div className="mt-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Price</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedTicketType.price} {selectedTicketType.currency}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                        <span className="font-medium text-gray-900 dark:text-white">{quantity}</span>
                      </div>
                      <div className="flex justify-between mb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-900 dark:text-white">Total</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {(selectedTicketType.price * quantity).toFixed(2)} {selectedTicketType.currency}
                        </span>
                      </div>
                      
                      {isAuthenticated ? (
                        <button 
                          className="btn btn-primary w-full"
                          onClick={handlePurchaseTicket}
                        >
                          Get Tickets
                        </button>
                      ) : (
                        <Link to="/login" className="btn btn-primary w-full text-center">
                          Login to Purchase
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">No tickets available for this event.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails; 