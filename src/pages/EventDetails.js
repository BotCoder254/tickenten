import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiTag, FiShare2, FiHeart, FiTrash2, FiMail, FiUser, FiPhone } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import eventService from '../services/eventService';
import ticketService from '../services/ticketService';
import { useAuth } from '../context/AuthContext';

// Add the getImageUrl helper function
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
};

const EventDetails = () => {
  const { eventId } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phoneNumber: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

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
          if (response && response.success) {
            setIsLiked(response.isLiked);
          }
        } catch (err) {
          console.error('Error checking if event is liked:', err);
          // Don't show error to user, just set to not liked
          setIsLiked(false);
        }
      }
    };

    checkEventLiked();
  }, [isAuthenticated, eventId]);

  // Toggle like status
  const toggleLike = async () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/events/${eventId}` } });
      return;
    }

    try {
      if (isLiked) {
        await eventService.unlikeEvent(eventId);
        setIsLiked(false);
      } else {
        await eventService.likeEvent(eventId);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Error toggling like status:', err);
      // No UI indication needed for like/unlike errors
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

  // Handle guest info change
  const handleGuestInfoChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo(prev => ({ ...prev, [name]: value }));
  };

  // Add this useEffect for loading Paystack script
  useEffect(() => {
    // Load the Paystack script when the component mounts
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    
    // Cleanup function to remove the script when component unmounts
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Define the payment success callback outside the handlePurchaseTicket function
  const handlePaymentSuccess = useCallback(async (response, ticketTypeId) => {
    try {
      if (response.status === 'success') {
        // Prepare payment info from Paystack
        const paymentInfo = {
          method: "Paystack",
          currency: selectedTicketType?.currency || "USD",
          reference: response.reference,
          trans: response.trans
        };
        
        // Process the actual ticket purchase with payment info
        if (isAuthenticated) {
          // Authenticated user purchase
          await ticketService.purchaseTickets({
            eventId,
            ticketTypeId,
            quantity,
            attendeeInfo: {
              phoneNumber: guestInfo.phoneNumber
            },
            phoneNumber: guestInfo.phoneNumber // Add phone number directly for server-side handling
          }, paymentInfo);
        } else {
          // Guest purchase
          if (!guestInfo.name || !guestInfo.email || !guestInfo.phoneNumber) {
            setPurchaseError('Please provide your name, email, and phone number to purchase tickets');
            setIsProcessing(false);
            return;
          }
          
          await ticketService.guestPurchaseTickets({
            eventId,
            ticketTypeId,
            quantity,
            attendeeInfo: guestInfo
          }, paymentInfo);
        }
        
        // Show success message
        setPurchaseSuccess(true);
        
        // Reset form
        setTimeout(() => {
          if (isAuthenticated) {
            navigate('/tickets'); // Redirect authenticated users to tickets page
          } else {
            // For guests, just reset the form
            setSelectedTicketType(null);
            setQuantity(1);
            setGuestInfo({ name: '', email: '', phoneNumber: '' });
            setPurchaseSuccess(false);
          }
        }, 3000);
      } else {
        setPurchaseError('Payment was not successful. Please try again.');
      }
    } catch (err) {
      console.error('Error completing ticket purchase after payment:', err);
      setPurchaseError(err.response?.data?.message || 'Payment was successful, but we could not complete your ticket purchase. Please contact support with your payment reference: ' + response.reference);
    } finally {
      setIsProcessing(false);
    }
  }, [eventId, guestInfo, isAuthenticated, navigate, quantity, selectedTicketType]);

  // Handle ticket purchase
  const handlePurchaseTicket = () => {
    if (!selectedTicketType) return;
    
    setIsProcessing(true);
    setPurchaseError(null);
    
    try {
      // Check if the ticket is free (price = 0)
      const isFreeTicket = selectedTicketType.price === 0;
      
      // Check for phone number for all tickets (free or paid)
      if (!guestInfo.phoneNumber) {
        setPurchaseError('Please provide your phone number to receive ticket information via SMS');
        setIsProcessing(false);
        return;
      }
      
      // For non-authenticated users, check all required fields
      if (!isAuthenticated && (!guestInfo.name || !guestInfo.email)) {
        setPurchaseError('Please provide your name and email to get tickets');
        setIsProcessing(false);
        return;
      }
      
      // For free tickets, directly process the purchase without payment
      if (isFreeTicket) {
        console.log('Processing free ticket purchase');
        processFreeTicketPurchase();
        return;
      }
      
      // For paid tickets, continue with payment processing
      
      // Calculate total amount in the smallest currency unit (kobo for NGN, cents for USD)
      const totalAmount = selectedTicketType.price * quantity * 100; // Convert to cents/kobo
      
      // Determine the email to use for Paystack
      const userEmail = isAuthenticated ? currentUser.email : guestInfo.email;
      const ticketTypeId = selectedTicketType._id;
      
      if (!window.PaystackPop) {
        setPurchaseError('Payment system is not available. Please try again later.');
        setIsProcessing(false);
        return;
      }
      
      // Initialize Paystack payment with proper function definitions
      const handler = window.PaystackPop.setup({
        key: 'pk_live_f75e7fc5c652583410d16789fc9955853373fc8c', // Paystack public key
        email: userEmail,
        amount: totalAmount,
        currency: selectedTicketType.currency || "USD",
        callback: (response) => {
          handlePaymentSuccess(response, ticketTypeId);
        },
        onClose: () => {
          // Handle payment cancellation
          setPurchaseError('Payment was cancelled. Please try again to complete your purchase.');
          setIsProcessing(false);
        }
      });
      
      // Open the Paystack payment modal
      handler.openIframe();
    } catch (err) {
      console.error('Error initiating payment:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Process free ticket purchase
  const processFreeTicketPurchase = async () => {
    try {
      const ticketTypeId = selectedTicketType._id;
      
      // These checks are now redundant since we check in handlePurchaseTicket,
      // but keeping them for extra safety
      
      // Check for phone number
      if (!guestInfo.phoneNumber) {
        setPurchaseError('Please provide your phone number to receive ticket information via SMS');
        setIsProcessing(false);
        return;
      }
      
      // Check if all guest information is provided for non-authenticated users
      if (!isAuthenticated && (!guestInfo.name || !guestInfo.email)) {
        setPurchaseError('Please provide your name and email to get tickets');
        setIsProcessing(false);
        return;
      }
      
      console.log('Processing free ticket purchase for', isAuthenticated ? 'authenticated user' : 'guest');
      
      // Process the free ticket purchase
      try {
        if (isAuthenticated) {
          // Authenticated user purchase
          const response = await ticketService.purchaseTickets({
            eventId,
            ticketTypeId,
            quantity,
            attendeeInfo: {
              phoneNumber: guestInfo.phoneNumber
            },
            phoneNumber: guestInfo.phoneNumber, // Add phone number directly for server-side handling
            isFreeTicket: true // Explicitly mark as free ticket
          });
          
          console.log('Free ticket purchase response:', response);
        } else {
          // Guest purchase
          const response = await ticketService.guestPurchaseTickets({
            eventId,
            ticketTypeId,
            quantity,
            attendeeInfo: guestInfo,
            isFreeTicket: true // Explicitly mark as free ticket
          });
          
          console.log('Free guest ticket purchase response:', response);
        }
        
        // Show success message
        setPurchaseSuccess(true);
        
        // Reset form
        setTimeout(() => {
          if (isAuthenticated) {
            navigate('/tickets'); // Redirect authenticated users to tickets page
          } else {
            // For guests, just reset the form
            setSelectedTicketType(null);
            setQuantity(1);
            setGuestInfo({ name: '', email: '', phoneNumber: '' });
            setPurchaseSuccess(false);
          }
        }, 3000);
      } catch (purchaseError) {
        console.error('Error in ticket purchase:', purchaseError);
        if (purchaseError.response) {
          console.error('Error response:', purchaseError.response.data);
        }
        throw purchaseError; // Re-throw to be caught by the outer catch
      }
    } catch (err) {
      console.error('Error completing free ticket purchase:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to process your free ticket. Please try again.');
      setIsProcessing(false);
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

  // Check if current user is the event creator
  const isCreator = event && currentUser && event.creator && 
                    event.creator._id === currentUser.id;

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!isCreator) return;
    
    try {
      setDeleting(true);
      await eventService.deleteEvent(eventId);
      navigate('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      setDeleting(false);
    }
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
            {error.response?.status === 400 
              ? 'Invalid event ID format. Please check the URL and try again.'
              : error.response?.data?.message || 'Failed to load event details. Please try again.'}
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
                  src={getImageUrl(event.featuredImage)}
                  alt={event.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
                  }}
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
                {isCreator && (
                  <div className="ml-auto">
                    <button
                      onClick={handleDeleteEvent}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
                    >
                      <FiTrash2 className="mr-2" />
                      {deleting ? 'Deleting...' : 'Delete Event'}
                    </button>
                  </div>
                )}
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
              
              {/* Event Details */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Date & Time</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDate(event.startDate)}
                      <br />
                      {formatTime(event.startDate)} - {formatTime(event.endDate)}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Category</h4>
                    <p className="text-gray-600 dark:text-gray-400">{event.category}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Venue</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {event.isVirtual 
                        ? 'Virtual Event' 
                        : event.location?.venue || 'Venue not specified'}
                    </p>
                    {!event.isVirtual && event.location && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {event.location.city}{event.location.country ? `, ${event.location.country}` : ''}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Status</h4>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">
                      {event.hasEnded ? 'Ended' : 
                       event.isSoldOut ? 'Sold Out' : 
                       'Open'}
                    </p>
                  </div>
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Tags</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {event.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-800 dark:text-gray-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Social links if available */}
                  {event.socialLinks && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Social Links</h4>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {event.socialLinks.website && (
                          <a href={event.socialLinks.website} target="_blank" rel="noopener noreferrer" 
                             className="text-primary-600 dark:text-primary-400 hover:underline">Website</a>
                        )}
                        {event.socialLinks.facebook && (
                          <a href={event.socialLinks.facebook} target="_blank" rel="noopener noreferrer" 
                             className="text-primary-600 dark:text-primary-400 hover:underline">Facebook</a>
                        )}
                        {event.socialLinks.twitter && (
                          <a href={event.socialLinks.twitter} target="_blank" rel="noopener noreferrer" 
                             className="text-primary-600 dark:text-primary-400 hover:underline">Twitter</a>
                        )}
                        {event.socialLinks.instagram && (
                          <a href={event.socialLinks.instagram} target="_blank" rel="noopener noreferrer" 
                             className="text-primary-600 dark:text-primary-400 hover:underline">Instagram</a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* FAQ section if available */}
              {event.faq && event.faq.length > 0 && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    {event.faq.map((item, index) => (
                      <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{item.question}</h4>
                        <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Organizer */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Organizer</h2>
              <div className="flex items-center">
                {event.creator?.avatar ? (
                  <img 
                    src={
                      event.creator.avatar.startsWith('http') 
                        ? event.creator.avatar
                        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${event.creator.avatar}`
                    }
                    alt={event.creator.name} 
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/40?text=U';
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <span className="text-lg font-bold">
                      {event.creator?.name ? event.creator.name.charAt(0) : 'O'}
                    </span>
                  </div>
                )}
                <div className="ml-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.creator?.name || 'Event Organizer'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {event.creator?.email || 'Contact information unavailable'}
                  </p>
                  {isCreator && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">You are the organizer</p>
                  )}
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
              
              {purchaseSuccess && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg">
                  <p className="font-medium">Tickets purchased successfully!</p>
                  {isAuthenticated ? (
                    <p className="text-sm mt-1">You can view your tickets in your account.</p>
                  ) : (
                    <p className="text-sm mt-1">A confirmation email has been sent to your email address.</p>
                  )}
                </div>
              )}
              
              {purchaseError && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                  <p>{purchaseError}</p>
                </div>
              )}
              
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
                          {selectedTicketType.price === 0 ? 'Free' : `${selectedTicketType.price} ${selectedTicketType.currency}`}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                        <span className="font-medium text-gray-900 dark:text-white">{quantity}</span>
                      </div>
                      <div className="flex justify-between mb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-900 dark:text-white">Total</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {selectedTicketType.price === 0 ? 'Free' : `${(selectedTicketType.price * quantity).toFixed(2)} ${selectedTicketType.currency}`}
                        </span>
                      </div>
                      
                      {selectedTicketType.price === 0 && (
                        <div className="mb-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg">
                          <p className="text-sm">This is a free ticket! Just provide your contact information to receive it.</p>
                        </div>
                      )}
                      
                      {isAuthenticated && (
                        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Your Information</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Phone Number
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiPhone className="text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="phoneNumber"
                                  value={guestInfo.phoneNumber}
                                  onChange={handleGuestInfoChange}
                                  className="input pl-10 w-full"
                                  placeholder="Your phone number for SMS notifications"
                                  required
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">We'll send your ticket details via SMS</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!isAuthenticated && (
                        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Your Information</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Name
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiUser className="text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="name"
                                  value={guestInfo.name}
                                  onChange={handleGuestInfoChange}
                                  className="input pl-10 w-full"
                                  placeholder="Your full name"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Email
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiMail className="text-gray-400" />
                                </div>
                                <input
                                  type="email"
                                  name="email"
                                  value={guestInfo.email}
                                  onChange={handleGuestInfoChange}
                                  className="input pl-10 w-full"
                                  placeholder="Your email address"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Phone
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiPhone className="text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="phoneNumber"
                                  value={guestInfo.phoneNumber}
                                  onChange={handleGuestInfoChange}
                                  className="input pl-10 w-full"
                                  placeholder="Your phone number"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        className="btn btn-primary w-full"
                        onClick={handlePurchaseTicket}
                        disabled={isProcessing || !guestInfo.phoneNumber || (!isAuthenticated && (!guestInfo.name || !guestInfo.email))}
                      >
                        {isProcessing ? 'Processing...' : selectedTicketType.price === 0 ? 'Get Free Ticket' : 'Get Tickets'}
                      </button>
                      
                      {!isAuthenticated && (
                        <div className="mt-3 text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
                              Log in
                            </Link>
                          </p>
                        </div>
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