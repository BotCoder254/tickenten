import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiFilter, FiDollarSign, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import ticketService from '../services/ticketService';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to format time
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
};

const ResaleTickets = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, currentUser } = useAuth();

  // State for filters
  const [filterEvent, setFilterEvent] = useState(searchParams.get('eventId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [showFilters, setShowFilters] = useState(false);
  
  // State for resale purchase
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phoneNumber: '' });

  // Fetch resale tickets
  const { data: resaleTickets, isLoading, error, refetch } = useQuery({
    queryKey: ['resaleTickets', filterEvent, minPrice, maxPrice],
    queryFn: () => ticketService.getResaleTickets({
      eventId: filterEvent || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    }),
    select: (data) => data.data || [],
  });

  // Fetch events for filter dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents(),
    select: (data) => data.data || [],
  });

  // Handle filter application
  const applyFilters = () => {
    // Update URL parameters
    const params = new URLSearchParams();
    if (filterEvent) params.set('eventId', filterEvent);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    setSearchParams(params);
    
    // Refetch with new filters
    refetch();
    
    // Close filter panel
    setShowFilters(false);
  };
  
  // Handle clear filters
  const clearFilters = () => {
    setFilterEvent('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
    refetch();
    setShowFilters(false);
  };
  
  // Handle ticket selection for purchase
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setPurchaseError(null);
    
    // Prefill phone number if authenticated
    if (isAuthenticated && currentUser.phoneNumber) {
      setGuestInfo(prev => ({ ...prev, phoneNumber: currentUser.phoneNumber }));
    }
  };
  
  // Handle guest info change
  const handleGuestInfoChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo(prev => ({ ...prev, [name]: value }));
  };
  
  // Close purchase modal
  const handleClosePurchase = () => {
    setSelectedTicket(null);
    setPurchaseError(null);
    setGuestInfo({ name: '', email: '', phoneNumber: '' });
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
  
  // Define the payment success callback
  const handlePaymentSuccess = useCallback(async (response, ticketId) => {
    try {
      if (response.status === 'success') {
        // Prepare payment info from Paystack
        const paymentInfo = {
          method: "Paystack",
          currency: selectedTicket?.ticketTypeInfo?.currency || "USD",
          reference: response.reference,
          trans: response.trans
        };
        
        // Process the actual ticket purchase with payment info
        const paymentData = {
          paymentMethod: `Paystack - ${paymentInfo.currency}`,
          paymentReference: paymentInfo.reference,
          paymentTransaction: paymentInfo.trans,
          paymentCurrency: paymentInfo.currency
        };
        
        const purchaseResponse = await ticketService.purchaseResaleTicket(ticketId, paymentData);
        
        // Show success message
        setPurchaseSuccess(true);
        
        // Get the ticket from the response
        const ticketData = purchaseResponse && purchaseResponse.data;
        
        // Redirect to success page with ticket info
        setTimeout(() => {
          navigate('/ticket-success', { 
            state: { 
              ticketId: ticketData?._id,
              ticketNumber: ticketData?.ticketNumber,
              eventTitle: selectedTicket?.event?.title,
              isResale: true
            } 
          });
        }, 1000);
      } else {
        setPurchaseError('Payment was not successful. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error completing ticket purchase after payment:', err);
      setPurchaseError(err.response?.data?.message || 'Payment was successful, but we could not complete your ticket purchase. Please contact support with your payment reference: ' + response.reference);
      setIsProcessing(false);
    }
  }, [navigate, selectedTicket]);
  
  // Handle ticket purchase
  const handlePurchaseTicket = () => {
    if (!selectedTicket || !isAuthenticated) return;
    
    setIsProcessing(true);
    setPurchaseError(null);
    
    try {
      // Check for phone number
      if (!guestInfo.phoneNumber) {
        setPurchaseError('Please provide your phone number to receive ticket information via SMS');
        setIsProcessing(false);
        return;
      }
      
      // Calculate amount in the smallest currency unit (kobo for NGN, cents for USD)
      const totalAmount = selectedTicket.resalePrice * 100; // Convert to cents/kobo
      
      // Determine the email to use for Paystack
      const userEmail = isAuthenticated ? currentUser.email : guestInfo.email;
      const ticketId = selectedTicket._id;
      
      if (!window.PaystackPop) {
        setPurchaseError('Payment system is not available. Please try again later.');
        setIsProcessing(false);
        return;
      }
      
      // Initialize Paystack payment
      const handler = window.PaystackPop.setup({
        key: 'pk_live_f75e7fc5c652583410d16789fc9955853373fc8c', // Paystack public key
        email: userEmail,
        amount: totalAmount,
        currency: selectedTicket.ticketTypeInfo?.currency || "USD",
        callback: (response) => {
          handlePaymentSuccess(response, ticketId);
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
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Error Loading Resale Tickets</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Failed to load resale tickets. Please try again.
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resale Tickets</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Find tickets being resold by other users
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline-primary flex items-center"
            >
              <FiFilter className="mr-2" /> 
              Filters {(filterEvent || minPrice || maxPrice) && '(Active)'}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 card p-6"
          >
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Filter Resale Tickets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="eventFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event
                </label>
                <select
                  id="eventFilter"
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Events</option>
                  {events?.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Price
                </label>
                <input
                  id="minPrice"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  className="input w-full"
                  placeholder="Minimum price"
                />
              </div>
              
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Price
                </label>
                <input
                  id="maxPrice"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  className="input w-full"
                  placeholder="Maximum price"
                />
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button onClick={applyFilters} className="btn btn-primary">
                Apply Filters
              </button>
              <button onClick={clearFilters} className="btn btn-outline-secondary">
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}

        {/* No Results */}
        {resaleTickets?.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No resale tickets found</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or check back later for more tickets.
            </p>
            <Link to="/events" className="mt-6 btn btn-primary inline-block">
              Browse Events
            </Link>
          </div>
        )}

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {resaleTickets?.map((ticket) => (
            <motion.div
              key={ticket._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Ticket Image */}
              <div className="h-48 overflow-hidden">
                <img
                  src={getImageUrl(ticket.event?.featuredImage)}
                  alt={ticket.event?.title || 'Event'}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
                  }}
                />
              </div>
              
              {/* Ticket Content */}
              <div className="p-5">
                <div className="mb-2">
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 text-xs font-medium rounded-full">
                    Resale
                  </span>
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 text-xs font-medium rounded-full">
                    {ticket.ticketTypeInfo?.name || 'General Admission'}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {ticket.event?.title || 'Event'}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiCalendar className="mr-2 text-gray-400" />
                    {formatDate(ticket.event?.startDate) || 'Date not available'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiClock className="mr-2 text-gray-400" />
                    {formatTime(ticket.event?.startDate) || 'Time not available'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiMapPin className="mr-2 text-gray-400" />
                    {ticket.event?.isVirtual
                      ? 'Virtual Event'
                      : ticket.event?.location?.venue || 'Location not available'}
                  </div>
                  <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                    <FiDollarSign className="mr-2 text-gray-400" />
                    {ticket.resalePrice} {ticket.ticketTypeInfo?.currency || 'USD'}
                    {ticket.ticketTypeInfo?.price !== ticket.resalePrice && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        (Original: {ticket.ticketTypeInfo?.price})
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => handleSelectTicket(ticket)}
                    className="btn btn-primary w-full"
                  >
                    Purchase Ticket
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Purchase Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Purchase Resale Ticket</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedTicket.event?.title} - {selectedTicket.ticketTypeInfo?.name}
            </p>
            
            {purchaseSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg">
                <p className="font-medium">Ticket purchased successfully!</p>
                <p className="text-sm mt-1">Redirecting to your ticket details...</p>
              </div>
            )}
            
            {purchaseError && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                <p>{purchaseError}</p>
              </div>
            )}
            
            <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Ticket Type</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedTicket.ticketTypeInfo?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedTicket.ticketTypeInfo?.price} {selectedTicket.ticketTypeInfo?.currency}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Resale Price</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedTicket.resalePrice} {selectedTicket.ticketTypeInfo?.currency}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedTicket.resalePrice} {selectedTicket.ticketTypeInfo?.currency}
                </span>
              </div>
            </div>
            
            {!isAuthenticated ? (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-center">
                <p className="text-yellow-800 dark:text-yellow-300 mb-2">
                  You need to be logged in to purchase a resale ticket.
                </p>
                <Link
                  to={`/login?redirect=/resale-tickets`}
                  className="btn btn-primary mt-2"
                >
                  Log In to Continue
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleClosePurchase}
                    className="btn btn-outline-secondary flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePurchaseTicket}
                    className="btn btn-primary flex-1"
                    disabled={isProcessing || !guestInfo.phoneNumber}
                  >
                    {isProcessing ? 'Processing...' : `Pay ${selectedTicket.resalePrice} ${selectedTicket.ticketTypeInfo?.currency}`}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResaleTickets; 