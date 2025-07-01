import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFilter, FiSearch, FiCalendar, FiMapPin, FiTag, FiX, FiChevronDown, FiChevronUp, FiDollarSign, FiCreditCard, FiClock, FiPhone } from 'react-icons/fi';
import { FaPaypal } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import ticketService from '../services/ticketService';
import eventService from '../services/eventService';
import paypalService from '../services/paypalService';
import { toast } from 'react-toastify';

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
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paypalButtonRendered, setPaypalButtonRendered] = useState(false);
  const paypalButtonRef = useRef(null);

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

  // Define isInitialLoading as an alias for isLoading to maintain compatibility
  const isInitialLoading = isLoading;

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
      if (!selectedTicket) {
        setPurchaseError('Ticket information was lost. Please try again.');
        setIsProcessing(false);
        return;
      }

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

        // Clear stored ticket data since purchase was successful
        try {
          if (selectedTicket && selectedTicket.event && selectedTicket.event._id) {
            localStorage.removeItem(`selected_resale_ticket_${selectedTicket.event._id}`);
          }
        } catch (err) {
          console.error('Error clearing stored ticket data:', err);
        }

        // Get the ticket from the response
        const ticketData = purchaseResponse && purchaseResponse.data;

        // Redirect to success page with ticket info
        setTimeout(() => {
          navigate('/ticket-success', { 
            state: { 
              ticketId: ticketData?._id,
              ticketNumber: ticketData?.ticketNumber,
              eventTitle: selectedTicket?.event?.title || 'Event',
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

  // Update the handlePurchaseTicket function
  const handlePurchaseTicket = () => {
    if (!selectedTicket || !isAuthenticated) return;

    setIsProcessing(true);
    setPurchaseError(null);

    try {
      // For PayPal, the buttons will handle the purchase flow
      if (paymentMethod === 'paypal') {
        setIsProcessing(false);
        setPurchaseError('Please use the PayPal buttons below to complete your purchase');
        return;
      }
      
      // Process the actual purchase for card payment
      processPurchase();
    } catch (err) {
      console.error('Error initiating purchase:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to process request. Please try again.');
      setIsProcessing(false);
    }
  };

  // Process the actual purchase
  const processPurchase = () => {
    try {
      // Try to recover the selected ticket if it's null
      if (!selectedTicket) {
        // Find the event ID
        const eventId = searchParams.get('eventId');

        if (eventId) {
          try {
            const savedTicket = localStorage.getItem(`selected_resale_ticket_${eventId}`);
            if (savedTicket) {
              const ticketData = JSON.parse(savedTicket);
              setSelectedTicket(ticketData);
              // Continue with the recovered ticket
              setTimeout(() => {
                processPurchase();
              }, 100);
              return;
            }
          } catch (err) {
            console.error('Error recovering ticket selection:', err);
            // Continue to error handling below
          }
        }

        setPurchaseError('Ticket selection was lost. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Check for phone number
      if (!guestInfo.phoneNumber) {
        setPurchaseError('Please provide your phone number to receive ticket information via SMS');
        setIsProcessing(false);
        return;
      }

      // Ensure we have a valid resale price
      const resalePrice = selectedTicket.resalePrice || 0;
      if (resalePrice <= 0) {
        setPurchaseError('Invalid ticket price. Please try again or contact support.');
        setIsProcessing(false);
        return;
      }

      // Calculate amount in the smallest currency unit (kobo for NGN, cents for USD)
      const totalAmount = resalePrice * 100; // Convert to cents/kobo

      // Determine the email to use for Paystack
      const userEmail = isAuthenticated ? currentUser.email : guestInfo.email;
      const ticketId = selectedTicket._id;

      if (!window.PaystackPop) {
        setPurchaseError('Payment system is not available. Please try again later.');
        setIsProcessing(false);
        return;
      }

      // Get currency with fallback
      const currency = selectedTicket.ticketTypeInfo?.currency || "NGN";

      // Initialize Paystack payment
      const handler = window.PaystackPop.setup({
        key: 'pk_test_c2b42dd5ca88bee2b49fba8bec4ca46e54525f09', // Paystack public key
        email: userEmail,
        amount: totalAmount,
        currency: currency,
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
      console.error('Error processing payment:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle ticket selection for purchase
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setPurchaseError(null);
    setPurchaseSuccess(false);
    
    // Pre-fill phone number if user is authenticated
    if (isAuthenticated && currentUser && currentUser.phoneNumber) {
      setGuestInfo(prev => ({ ...prev, phoneNumber: currentUser.phoneNumber }));
    }
  };

  // Function to render PayPal buttons with error prevention
  const renderPayPalButtons = (paypalButtonRef, selectedTicket, setIsProcessing, setPurchaseError, setPurchaseSuccess, navigate, setPaypalButtonRendered) => {
    if (!window.paypal || !paypalButtonRef.current || !selectedTicket) {
      return;
    }
    
    // Clear any existing buttons
    paypalButtonRef.current.innerHTML = '';
    
    // Get the resale price
    const resalePrice = selectedTicket.resalePrice || 0;
    
    try {
      // Create a container with a unique ID to help prevent zoid errors
      const containerId = `paypal-resale-btn-${Date.now()}`;
      paypalButtonRef.current.innerHTML = `<div id="${containerId}"></div>`;
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error('Failed to create container for PayPal buttons');
        return;
      }
      
      window.paypal.Buttons({
        // Create order
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: selectedTicket.ticketTypeInfo?.currency || 'USD',
                value: resalePrice.toFixed(2)
              },
              description: `Resale ticket for ${selectedTicket.event?.title || 'Event'}`
            }]
          });
        },
        
        // On approval
        onApprove: async (data, actions) => {
          try {
            setIsProcessing(true);
            
            // Capture the order
            const orderDetails = await actions.order.capture();
            
            // Process the ticket purchase
            const ticketId = selectedTicket._id;
            const paymentData = {
              paymentMethod: `PayPal`,
              paymentReference: orderDetails.id,
              paymentTransaction: orderDetails.id,
              paymentCurrency: selectedTicket.ticketTypeInfo?.currency || 'USD'
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
                  eventTitle: selectedTicket?.event?.title || 'Event',
                  isResale: true
                } 
              });
            }, 1000);
          } catch (err) {
            console.error('PayPal approval error:', err);
            setPurchaseError('Error processing PayPal payment. Please try again.');
            setIsProcessing(false);
          }
        },
        
        // On error
        onError: (err) => {
          console.error('PayPal error:', err);
          setPurchaseError('PayPal encountered an error. Please try again or use a different payment method.');
          setIsProcessing(false);
        },
        
        // On cancel
        onCancel: () => {
          setPurchaseError('Payment was cancelled. Please try again to complete your purchase.');
          setIsProcessing(false);
        }
      }).render(container).catch(err => {
        console.error('PayPal render error:', err);
        setPurchaseError('Failed to initialize PayPal. Please try a different payment method.');
        setPaymentMethod('card');
      });
      
      setPaypalButtonRendered(true);
    } catch (err) {
      console.error('Error rendering PayPal buttons:', err);
      setPurchaseError('Failed to initialize PayPal. Please try again later.');
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setPurchaseError(null);
    
    // Reset PayPal button rendered state when changing payment methods
    if (method === 'paypal') {
      setPaypalButtonRendered(false);
      
      // Add a slight delay before re-rendering the PayPal buttons
      // This helps prevent the "zoid destroyed all components" error
      setTimeout(() => {
        if (window.paypal && paypalButtonRef.current) {
          renderPayPalButtons(
            paypalButtonRef, 
            selectedTicket, 
            setIsProcessing, 
            setPurchaseError, 
            setPurchaseSuccess, 
            navigate, 
            setPaypalButtonRendered
          );
        }
      }, 100);
    }
  };

  // Add this useEffect for loading PayPal script
  useEffect(() => {
    // Only load PayPal when a ticket is selected and PayPal is selected as payment method
    if (selectedTicket && paymentMethod === 'paypal' && !paypalButtonRendered) {
      const loadPayPalScript = async () => {
        try {
          // Get client ID from our server
          const config = await paypalService.getClientConfig();
          if (config && config.success && config.data && config.data['client-id']) {
            // Load the script only if it's not already loaded
            if (!document.querySelector('script[src*="paypal.com/sdk/js"]')) {
              await paypalService.loadScript(config.data['client-id']);
            }
            
            // Add a slight delay before rendering the buttons
            // This helps prevent the "zoid destroyed all components" error
            setTimeout(() => {
              // Render PayPal buttons when the script is loaded
              if (window.paypal && paypalButtonRef.current) {
                renderPayPalButtons(
                  paypalButtonRef,
                  selectedTicket,
                  setIsProcessing,
                  setPurchaseError,
                  setPurchaseSuccess,
                  navigate,
                  setPaypalButtonRendered
                );
              }
            }, 100);
          } else {
            console.error('Invalid PayPal configuration from server');
            setPurchaseError('PayPal is not available. Please try another payment method.');
            setPaymentMethod('card');
          }
        } catch (error) {
          console.error('Error loading PayPal script:', error);
          setPurchaseError('Failed to load PayPal. Please try another payment method.');
          setPaymentMethod('card');
        }
      };
      
      loadPayPalScript();
    }
  }, [selectedTicket, paymentMethod, paypalButtonRendered, navigate]);

  if (isInitialLoading) {
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
                  type="text"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Price
                </label>
                <input
                  id="maxPrice"
                  type="text"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={applyFilters}
                className="btn btn-primary"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="btn btn-outline-secondary ml-2"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}

        {/* Resale Tickets Display */}
        <div className="mb-8">
          {/* Show message when no tickets are found */}
          {!isInitialLoading && resaleTickets?.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FiTag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No resale tickets available</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {filterEvent || minPrice || maxPrice 
                  ? 'No tickets match your filter criteria. Try adjusting your filters.' 
                  : 'There are currently no tickets listed for resale.'}
              </p>
              {(filterEvent || minPrice || maxPrice) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 btn btn-outline-primary"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Display tickets in a grid */}
          {!isInitialLoading && resaleTickets?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resaleTickets.map((ticket) => (
                <div key={ticket._id} className="card overflow-hidden">
                  {/* Ticket Image */}
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                    {ticket.event?.featuredImage ? (
                      <img 
                        src={getImageUrl(ticket.event.featuredImage)} 
                        alt={ticket.event?.title || 'Event'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiTag className="h-12 w-12" />
                      </div>
                    )}
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    
                    {/* Date and location at bottom */}
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <div className="flex items-center text-sm">
                        <FiCalendar className="mr-1" />
                        <span>{formatDate(ticket.event?.startDate)}</span>
                      </div>
                      <div className="flex items-center text-sm mt-1">
                        <FiMapPin className="mr-1" />
                        <span>
                          {ticket.event?.isVirtual 
                            ? 'Virtual Event' 
                            : ticket.event?.location?.city || 'Location unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ticket Details */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2">
                      {ticket.event?.title || 'Event Title'}
                    </h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {ticket.ticketTypeInfo?.name || 'Standard Ticket'}
                      </span>
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        ${ticket.resalePrice?.toFixed(2) || '0.00'} {ticket.ticketTypeInfo?.currency || 'USD'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      <div className="flex items-center">
                        <FiClock className="mr-1" />
                        <span>Listed on {formatDate(ticket.resaleListingDate || new Date())}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <FiDollarSign className="mr-1" />
                        <span>Original price: ${ticket.ticketTypeInfo?.price?.toFixed(2) || '0.00'} {ticket.ticketTypeInfo?.currency || 'USD'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectTicket(ticket)}
                      className="btn btn-primary w-full"
                      disabled={isProcessing}
                    >
                      Purchase Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Purchase Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Purchase Resale Ticket
                </h2>
                
                {purchaseSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Purchase Successful!</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Your ticket has been purchased successfully. Redirecting to your ticket...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Event:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedTicket.event?.title}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Ticket Type:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedTicket.ticketTypeInfo?.name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Original Price:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${selectedTicket.ticketTypeInfo?.price?.toFixed(2) || '0.00'} {selectedTicket.ticketTypeInfo?.currency || 'USD'}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Resale Price:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ${selectedTicket.resalePrice?.toFixed(2) || '0.00'} {selectedTicket.ticketTypeInfo?.currency || 'USD'}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-800 dark:text-gray-200 font-medium">Total:</span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            ${selectedTicket.resalePrice?.toFixed(2) || '0.00'} {selectedTicket.ticketTypeInfo?.currency || 'USD'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {purchaseError && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg text-red-700 dark:text-red-400 text-sm">
                        {purchaseError}
                      </div>
                    )}
                    
                    {!isAuthenticated ? (
                      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                        <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-3">
                          You need to be logged in to purchase tickets.
                        </p>
                        <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="btn btn-primary w-full">
                          Log In to Continue
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone Number (for SMS notifications)
                          </label>
                          <div className="flex items-center">
                            <FiPhone className="text-gray-400 mr-2" />
                            <input
                              id="phoneNumber"
                              type="tel"
                              name="phoneNumber"
                              value={guestInfo.phoneNumber}
                              onChange={handleGuestInfoChange}
                              className="input w-full"
                              placeholder="+1234567890"
                            />
                          </div>
                        </div>
                        
                        {/* Payment method selection */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Method
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="card"
                                checked={paymentMethod === 'card'}
                                onChange={() => handlePaymentMethodChange('card')}
                                className="h-4 w-4 text-primary-600"
                              />
                              <FiCreditCard className="ml-2 mr-2" />
                              <span>Card Payment (Paystack)</span>
                            </label>
                            
                            <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="paypal"
                                checked={paymentMethod === 'paypal'}
                                onChange={() => handlePaymentMethodChange('paypal')}
                                className="h-4 w-4 text-primary-600"
                              />
                              <FaPaypal className="ml-2 mr-2 text-blue-500" />
                              <span>PayPal</span>
                            </label>
                          </div>
                        </div>
                        
                        {/* PayPal button container */}
                        {paymentMethod === 'paypal' && (
                          <div className="mb-4">
                            <div ref={paypalButtonRef} id="paypal-button-container"></div>
                            {!paypalButtonRendered && (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading PayPal...</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            onClick={handleClosePurchase}
                            className="btn btn-outline-secondary"
                            disabled={isProcessing}
                          >
                            Cancel
                          </button>
                          
                          {paymentMethod === 'card' && (
                            <button
                              onClick={handlePurchaseTicket}
                              className="btn btn-primary"
                              disabled={isProcessing || !guestInfo.phoneNumber}
                            >
                              {isProcessing ? 'Processing...' : 'Purchase'}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResaleTickets;
