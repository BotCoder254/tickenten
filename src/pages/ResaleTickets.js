import React, { useState, useEffect, useCallback } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { motion } from 'framer-motion';

import { FiCalendar, FiMapPin, FiClock, FiFilter, FiDollarSign, FiUser, FiMail, FiPhone } from 'react-icons/fi';

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

                  {events?.map((event) => 