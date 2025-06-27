import React, { useState, useEffect, useCallback } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { motion } from 'framer-motion';

import { FiCalendar, FiMapPin, FiClock, FiFilter, FiDollarSign, FiUser, FiMail, FiPhone, FiTag } from 'react-icons/fi';

import { useQuery } from '@tanstack/react-query';

import ticketService from '../services/ticketService';

import eventService from '../services/eventService';

import queueService from '../services/queueService';

import QueueStatus from '../components/QueueStatus';

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

  

  // Queue system state

  const [showQueueModal, setShowQueueModal] = useState(false);

  const [queueInfo, setQueueInfo] = useState(null);

  const [isQueueReady, setIsQueueReady] = useState(false);

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

  

  // Add this effect to check for existing queue position when a ticket is selected

  useEffect(() => {

    // Check if user is already in a queue for the selected ticket's event

    const checkExistingQueue = async () => {

      if (selectedTicket && selectedTicket.event && selectedTicket.event._id) {

        try {

          // Check if we have a stored queueId for this event

          const eventId = selectedTicket.event._id;

          const storedQueueId = localStorage.getItem(`queue_${eventId}`);

          

          if (storedQueueId) {

            const queueResponse = await queueService.checkPosition(eventId, storedQueueId);

            

            if (queueResponse.success && 

                (queueResponse.data.position > 0 || queueResponse.data.isProcessing)) {

              // User is already in queue, restore queue state

              setQueueInfo({

                ...queueResponse.data,

                queueId: storedQueueId

              });

              

              // If user is at the front of the queue, mark as ready

              if (queueResponse.data.position <= 1 || queueResponse.data.isProcessing) {

                setIsQueueReady(true);

              }

            }

          }

        } catch (err) {

          console.error('Error checking existing queue:', err);

          // Silently fail - we'll create a new queue if needed

        }

      }

    };

    

    checkExistingQueue();

  }, [selectedTicket]);

  // Add effect to check for saved ticket selection when the queue info changes

  useEffect(() => {

    const checkSavedTicket = () => {

      if (!selectedTicket && queueInfo && queueInfo.queueId) {

        const eventId = queueInfo.eventId || (searchParams.get('eventId'));

        

        if (eventId) {

          try {

            const savedTicket = localStorage.getItem(`selected_resale_ticket_${eventId}`);

            if (savedTicket) {

              const ticketData = JSON.parse(savedTicket);

              setSelectedTicket(ticketData);

            }

          } catch (err) {

            console.error('Error loading saved ticket selection:', err);

            // Continue without restored selection

          }

        }

      }

    };

    

    checkSavedTicket();

  }, [queueInfo, selectedTicket, searchParams]);

  // Update the handleSelectTicket function to store the selection

  const handleSelectTicket = (ticket) => {

    setSelectedTicket(ticket);

    setPurchaseError(null);

    

    // Store the selected ticket in localStorage to preserve across queue process

    if (ticket && ticket.event && ticket.event._id) {

      try {

        localStorage.setItem(`selected_resale_ticket_${ticket.event._id}`, JSON.stringify({

          _id: ticket._id,

          resalePrice: ticket.resalePrice,

          event: {

            _id: ticket.event._id,

            title: ticket.event.title

          },

          ticketTypeInfo: ticket.ticketTypeInfo

        }));

      } catch (err) {

        console.error('Error saving ticket selection to localStorage:', err);

        // Continue even if storage fails

      }

    }

    

    // Prefill phone number if authenticated

    if (isAuthenticated && currentUser.phoneNumber) {

      setGuestInfo(prev => ({ ...prev, phoneNumber: currentUser.phoneNumber }));

      

      // If authenticated, start the queue process in the background

      if (ticket && ticket.event && ticket.event._id) {

        const eventId = ticket.event._id;

        

        // Join queue in the background

        queueService.joinQueue(eventId)

          .then(queueResponse => {

            if (queueResponse.success) {

              setQueueInfo(queueResponse.data);

              // Don't show the modal yet

              

              // If user is already at the front of the queue, mark as ready

              if (queueResponse.data.position <= 1 || queueResponse.data.isProcessing) {

                setIsQueueReady(true);

              }

            }

          })

          .catch(err => {

            console.error('Error joining queue early:', err);

            // Silently fail - we'll try again when user clicks purchase

          });

      }

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

        

        // Complete queue processing if in a queue

        if (queueInfo && queueInfo.userId && selectedTicket.event && selectedTicket.event._id) {

          queueService.completeProcessing(selectedTicket.event._id, queueInfo.userId).catch(err => {

            console.error('Error completing queue processing:', err);

          });

        }

        

        // Close the queue modal after successful purchase

        setShowQueueModal(false);

        

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

  }, [navigate, selectedTicket, queueInfo]);

  

  // Update the handlePurchaseTicket function

  const handlePurchaseTicket = () => {

    if (!selectedTicket || !isAuthenticated) return;

    

    setIsProcessing(true);

    setPurchaseError(null);

    

    try {

      // Always use queue for resale tickets

      const shouldQueue = true;

      

      if (shouldQueue && !isQueueReady) {

        // If we already have queue info but not showing modal, show it

        if (queueInfo && !showQueueModal) {

          setShowQueueModal(true);

          setIsProcessing(false);

          return;

        }

        

        // Join the queue first

        queueService.joinQueue(selectedTicket.event._id)

          .then(queueResponse => {

            if (queueResponse.success) {

              setQueueInfo(queueResponse.data);

              setShowQueueModal(true);

              setIsProcessing(false);

              

              // If user is already at the front of the queue, allow purchase

              if (queueResponse.data.position <= 1 || queueResponse.data.isProcessing) {

                setIsQueueReady(true);

              }

            }

          })

          .catch(err => {

            console.error('Error joining queue:', err);

            // Continue with purchase anyway if queue fails

            processPurchase();

          });

        

        return; // Stop here until queue is ready

      }

      

      // If queue is ready, proceed with purchase

      processPurchase();

      

    } catch (err) {

      console.error('Error initiating purchase:', err);

      setPurchaseError(err.response?.data?.message || 'Failed to process request. Please try again.');

      setIsProcessing(false);

    }

  };

  

  // Process the actual purchase (after queue if needed)

  const processPurchase = () => {

    try {

      // Try to recover the selected ticket if it's null

      if (!selectedTicket) {

        // Find the event ID

        const eventId = queueInfo?.eventId || searchParams.get('eventId');

        

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

          

          // Complete queue processing if in a queue

          if (queueInfo && queueInfo.userId) {

            queueService.completeProcessing(selectedTicket.event._id, queueInfo.userId).catch(err => {

              console.error('Error completing queue processing:', err);

            });

          }

        },

        onClose: () => {

          // Handle payment cancellation

          setPurchaseError('Payment was cancelled. Please try again to complete your purchase.');

          setIsProcessing(false);

          

          // If user was in queue, they'll need to try again

          if (showQueueModal) {

            setIsQueueReady(false);

          }

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

  

  // Handle queue ready callback

  const handleQueueReady = (queueData) => {

    setIsQueueReady(true);

    // Automatically proceed with purchase when it's the user's turn

    if (queueData.isProcessing && selectedTicket) {

      // Wait a moment to allow the user to see they're ready

      setTimeout(() => {

        processPurchase();

      }, 1500);

    }

  };

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
                        
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            onClick={handleClosePurchase}
                            className="btn btn-outline-secondary"
                            disabled={isProcessing}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handlePurchaseTicket}
                            className="btn btn-primary"
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : 'Purchase'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Queue Modal */}
        {showQueueModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Ticket Purchase Queue
                </h2>
                
                <QueueStatus 
                  queueInfo={queueInfo} 
                  onQueueReady={handleQueueReady}
                  isProcessing={isProcessing}
                />
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowQueueModal(false)}
                    className="btn btn-outline-secondary"
                  >
                    Close
                  </button>
                  {isQueueReady && (
                    <button
                      onClick={processPurchase}
                      className="btn btn-primary"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Continue Purchase'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResaleTickets;
