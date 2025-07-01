import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiTag, FiShare2, FiHeart, FiTrash2, FiMail, FiUser, FiPhone, FiCheck, FiCopy } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import eventService from '../services/eventService';
import ticketService from '../services/ticketService';
import queueService from '../services/queueService';
import paypalService from '../services/paypalService';
import QueueStatus from '../components/QueueStatus';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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
  
  // Queue system state
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueInfo, setQueueInfo] = useState(null);
  const [isQueueReady, setIsQueueReady] = useState(false);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paystack'); // 'paystack' or 'paypal'

  const paypalButtonRef = useRef(null);
  const [paypalButtonRendered, setPaypalButtonRendered] = useState(false);

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

  // Add this effect to check for existing queue position when component mounts
  useEffect(() => {
    // Check if user is already in a queue for this event
    const checkExistingQueue = async () => {
      if (eventId) {
        try {
          // Check if we have a stored queueId for this event
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
              setShowQueueModal(true);
              
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
  }, [eventId]);

  // Update the handleTicketSelect function to store the selection
  const handleTicketSelect = (ticketType) => {
    setSelectedTicketType(ticketType);
    setQuantity(1);
    
    // Store the selected ticket in localStorage to preserve across queue process
    if (ticketType && eventId) {
      try {
        localStorage.setItem(`selected_ticket_${eventId}`, JSON.stringify({
          _id: ticketType._id,
          name: ticketType.name,
          price: ticketType.price,
          currency: ticketType.currency,
          quantity: ticketType.quantity,
          quantitySold: ticketType.quantitySold
        }));
      } catch (err) {
        console.error('Error saving ticket selection to localStorage:', err);
        // Continue even if storage fails
      }
    }
    
    // Check if this is a high-demand ticket that might need queuing
    const shouldQueueEarly = ticketType.quantitySold > 10;
    
    if (shouldQueueEarly && !showQueueModal && !isQueueReady) {
      // Prepare to join queue in the background
      const userData = !isAuthenticated ? {} : {};
      
      queueService.joinQueue(eventId, userData)
        .then(queueResponse => {
          if (queueResponse.success) {
            setQueueInfo(queueResponse.data);
            // Don't show the modal yet, just prepare the queue position
            
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

  // Add this useEffect for loading PayPal SDK
  useEffect(() => {
    // Only load the PayPal script if a ticket is selected and it's not free
    if (selectedTicketType && selectedTicketType.price > 0 && paymentMethod === 'paypal') {
      const loadPayPalScript = async () => {
        try {
          // Get client ID from our server
          const config = await paypalService.getClientConfig();
          if (config && config.success && config.data && config.data['client-id']) {
            await paypalService.loadScript(config.data['client-id']);
            
            // Render PayPal buttons when the script is loaded
            if (!paypalButtonRendered && window.paypal) {
              renderPayPalButtons();
            }
          } else {
            console.error('Invalid PayPal configuration from server');
            setPurchaseError('PayPal is not available. Please try another payment method.');
          }
        } catch (error) {
          console.error('Error loading PayPal script:', error);
          setPurchaseError('Failed to load PayPal. Please try another payment method.');
        }
      };
      
      loadPayPalScript();
    }
  }, [selectedTicketType, paymentMethod, paypalButtonRendered]);
  
  // Function to render PayPal buttons
  const renderPayPalButtons = () => {
    if (!window.paypal || !paypalButtonRef.current || !selectedTicketType) {
      return;
    }
    
    // Clear any existing buttons
    paypalButtonRef.current.innerHTML = '';
    
    const totalAmount = selectedTicketType.price * quantity;
    
    try {
      // Create a container with a unique ID to help prevent zoid errors
      const containerId = `paypal-btn-container-${Date.now()}`;
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
                currency_code: selectedTicketType.currency || 'USD',
                value: totalAmount.toFixed(2)
              },
              description: `Ticket for ${event.title}`
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
            const ticketTypeId = selectedTicketType._id;
            await handlePaymentSuccess({
              status: 'success',
              reference: orderDetails.id,
              trans: orderDetails.id
            }, ticketTypeId);
            
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
      });
      
      setPaypalButtonRendered(true);
    } catch (err) {
      console.error('Error rendering PayPal buttons:', err);
      setPurchaseError('Failed to initialize PayPal. Please try again later.');
    }
  };
  
  // Update the handlePaymentMethodChange function
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    
    // Reset any purchase errors
    setPurchaseError(null);
    
    // Reset PayPal button rendered state when changing payment methods
    if (method === 'paypal') {
      setPaypalButtonRendered(false);
      
      // Add a slight delay before re-rendering the PayPal buttons
      // This helps prevent the "zoid destroyed all components" error
      setTimeout(() => {
        if (window.paypal && paypalButtonRef.current) {
          renderPayPalButtons();
        }
      }, 100);
    }
  };
  
  // Update the handlePaymentSuccess callback to support both Paystack and PayPal
  const handlePaymentSuccess = useCallback(async (response, ticketTypeId) => {
    try {
      if (response.status === 'success') {
        // Determine the payment method
        const isPayPal = !response.trans && response.reference.startsWith('order_');
        
        // Prepare payment info
        const paymentInfo = {
          method: isPayPal ? "PayPal" : "Paystack",
          currency: selectedTicketType?.currency || "USD",
          reference: response.reference,
          trans: response.trans || response.reference
        };
        
        // Process the actual ticket purchase with payment info
        let purchaseResponse;
        if (isAuthenticated) {
          // Authenticated user purchase
          purchaseResponse = await ticketService.purchaseTickets({
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
          
          purchaseResponse = await ticketService.guestPurchaseTickets({
            eventId,
            ticketTypeId,
            quantity,
            attendeeInfo: guestInfo
          }, paymentInfo);
        }
        
        // Show success message
        setPurchaseSuccess(true);
        
        // Clear stored ticket data since purchase was successful
        try {
          localStorage.removeItem(`selected_ticket_${eventId}`);
        } catch (err) {
          console.error('Error clearing stored ticket data:', err);
        }
        
        // Get the first ticket from the response to pass to success page
        const ticketData = purchaseResponse && purchaseResponse.data && purchaseResponse.data.length > 0 
          ? purchaseResponse.data[0] 
          : null;
        
        // Redirect to success page with ticket info
        setTimeout(() => {
          navigate('/ticket-success', { 
            state: { 
              ticketId: ticketData?._id,
              ticketNumber: ticketData?.ticketNumber,
              eventTitle: event?.title || 'Event'
            } 
          });
        }, 1000);
      } else {
        setPurchaseError('Payment was not successful. Please try again.');
      }
    } catch (err) {
      console.error('Error completing ticket purchase after payment:', err);
      setPurchaseError(err.response?.data?.message || 'Payment was successful, but we could not complete your ticket purchase. Please contact support with your payment reference: ' + response.reference);
    } finally {
      setIsProcessing(false);
    }
  }, [eventId, guestInfo, isAuthenticated, navigate, quantity, selectedTicketType, event]);

  // Add effect to check for saved ticket selection when component mounts
  useEffect(() => {
    if (!selectedTicketType && eventId) {
      try {
        const savedTicket = localStorage.getItem(`selected_ticket_${eventId}`);
        if (savedTicket) {
          const ticketData = JSON.parse(savedTicket);
          setSelectedTicketType(ticketData);
        }
      } catch (err) {
        console.error('Error loading saved ticket selection:', err);
        // Continue without restored selection
      }
    }
  }, [eventId, selectedTicketType]);

  // Update the handlePurchaseTicket function
  const handlePurchaseTicket = () => {
    if (!selectedTicketType) return;
    
    setIsProcessing(true);
    setPurchaseError(null);
    
    try {
      // For free tickets, we might still want to queue if it's a high-demand event
      const isFreeTicket = selectedTicketType.price === 0;
      
      // For PayPal, the buttons will handle the purchase flow
      if (paymentMethod === 'paypal' && !isFreeTicket) {
        setIsProcessing(false);
        setPurchaseError('Please use the PayPal buttons below to complete your purchase');
        return;
      }
      
      // Check if we need to queue (for popular events or during high traffic)
      const shouldQueue = selectedTicketType.quantitySold > 10; // Example condition
      
      if (shouldQueue && !isQueueReady) {
        // Join the queue first if not already in queue
        const userData = !isAuthenticated ? {
          name: guestInfo.name || '',
          email: guestInfo.email || ''
        } : {};
        
        // If we already have queue info but not ready, show the modal
        if (queueInfo && !showQueueModal) {
          setShowQueueModal(true);
          setIsProcessing(false);
          return;
        }
        
        queueService.joinQueue(eventId, userData)
          .then(queueResponse => {
            if (queueResponse.success) {
              setQueueInfo(queueResponse.data);
              setShowQueueModal(true);
              setIsProcessing(false);
              
              // If user is already at the front of the queue, allow purchase
              if (queueResponse.data.position <= 1 || queueResponse.data.isProcessing) {
                setIsQueueReady(true);
                
                // For free tickets, we can proceed immediately when ready
                if (isFreeTicket && queueResponse.data.isProcessing) {
                  setTimeout(() => {
                    processFreeTicketPurchase();
                  }, 1500);
                }
              }
            }
          })
          .catch(err => {
            console.error('Error joining queue:', err);
            // Continue with purchase anyway if queue fails
            if (isFreeTicket) {
              processFreeTicketPurchase();
            } else {
              processPurchase();
            }
          });
        
        return; // Stop here until queue is ready
      }
      
      // If no queue needed or queue is ready, proceed with purchase
      if (isFreeTicket) {
        processFreeTicketPurchase();
      } else {
        processPurchase();
      }
      
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
      if (!selectedTicketType) {
        try {
          const savedTicket = localStorage.getItem(`selected_ticket_${eventId}`);
          if (savedTicket) {
            const ticketData = JSON.parse(savedTicket);
            setSelectedTicketType(ticketData);
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
        
        setPurchaseError('Ticket selection was lost. Please try again.');
        setIsProcessing(false);
        return;
      }
      
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
      
      // For PayPal, the buttons will handle the purchase flow
      if (paymentMethod === 'paypal') {
        // We don't need to do anything here as the PayPal buttons handle the flow
        // Just inform the user to use the PayPal buttons
        setPurchaseError('Please use the PayPal buttons below to complete your purchase');
        setIsProcessing(false);
        return;
      }
      
      // Default to Paystack
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
        key: 'pk_test_c2b42dd5ca88bee2b49fba8bec4ca46e54525f09', // Paystack public key
        email: userEmail,
        amount: totalAmount,
        currency: selectedTicketType.currency || "NGN",
        callback: (response) => {
          handlePaymentSuccess(response, ticketTypeId);
          
          // Complete queue processing if in a queue
          if (queueInfo && queueInfo.userId) {
            queueService.completeProcessing(eventId, queueInfo.userId).catch(err => {
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
    if (queueData.isProcessing && selectedTicketType) {
      // Wait a moment to allow the user to see they're ready
      setTimeout(() => {
        processPurchase();
      }, 1500);
    }
  };

  // Process free ticket purchase
  const processFreeTicketPurchase = async () => {
    try {
      // Try to recover the selected ticket if it's null
      if (!selectedTicketType) {
        try {
          const savedTicket = localStorage.getItem(`selected_ticket_${eventId}`);
          if (savedTicket) {
            const ticketData = JSON.parse(savedTicket);
            setSelectedTicketType(ticketData);
            // Continue with the recovered ticket
            setTimeout(() => {
              processFreeTicketPurchase();
            }, 100);
            return;
          }
        } catch (err) {
          console.error('Error recovering ticket selection:', err);
          // Continue to error handling below
        }
        
        setPurchaseError('Ticket selection was lost. Please try again.');
        setIsProcessing(false);
        return;
      }
      
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
        let response;
        if (isAuthenticated) {
          // Authenticated user purchase
          response = await ticketService.purchaseTickets({
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
          response = await ticketService.guestPurchaseTickets({
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
        
        // Clear stored ticket data since purchase was successful
        try {
          localStorage.removeItem(`selected_ticket_${eventId}`);
        } catch (err) {
          console.error('Error clearing stored ticket data:', err);
        }
        
        // Get the first ticket from the response to pass to success page
        const ticketData = response && response.data && response.data.length > 0 ? response.data[0] : null;
        
        // Complete queue processing if in a queue
        if (queueInfo && queueInfo.userId) {
          queueService.completeProcessing(eventId, queueInfo.userId).catch(err => {
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
              eventTitle: event?.title || 'Event'
            } 
          });
        }, 1000);
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

  // Add this function to handle sharing
  const handleShare = () => {
    setShowShareModal(true);
  };

  // Update the copyToClipboard function
  const copyToClipboard = () => {
    const eventUrl = window.location.href;
    try {
      navigator.clipboard.writeText(eventUrl)
        .then(() => {
          setLinkCopied(true);
          toast.success('Link copied to clipboard!');
          
          // Reset the copied state after 3 seconds
          setTimeout(() => {
            setLinkCopied(false);
          }, 3000);
        })
        .catch(err => {
          console.error('Failed to copy using clipboard API:', err);
          // Fallback method for browsers that don't support clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = eventUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          setLinkCopied(true);
          toast.success('Link copied to clipboard!');
          
          // Reset the copied state after 3 seconds
          setTimeout(() => {
            setLinkCopied(false);
          }, 3000);
        });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link. Please try again.');
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
                <button 
                  onClick={handleShare}
                  className="flex items-center px-4 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition-colors"
                >
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
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                                  <select
                                    className="bg-transparent text-sm pr-6 pl-1 focus:outline-none h-full"
                                    onChange={(e) => {
                                      const countryCode = e.target.value;
                                      const localNumber = guestInfo.phoneNumber.replace(/^\+\d+\s?/, '');
                                      handleGuestInfoChange({
                                        target: {
                                          name: 'phoneNumber',
                                          value: `${countryCode} ${localNumber}`
                                        }
                                      });
                                    }}
                                  >
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+91">🇮🇳 +91</option>
                                  </select>
                                </div>

                                <div className="absolute inset-y-0 left-20 pl-3 flex items-center pointer-events-none">
                                  <FiPhone className="text-gray-400" />
                                </div>

                                <input
                                  type="tel"
                                  className="input pl-32 w-full"
                                  placeholder="Phone number"
                                  value={guestInfo.phoneNumber.split(' ').slice(1).join(' ')}
                                  onChange={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const countryCode = guestInfo.phoneNumber.split(' ')[0] || '+1';
                                    handleGuestInfoChange({
                                      target: {
                                        name: 'phoneNumber',
                                        value: `${countryCode} ${numbers}`
                                      }
                                    });
                                  }}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Add payment method selection inside the ticket card */}
                      {selectedTicketType && selectedTicketType.price > 0 && (
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Payment Method</h3>
                          <div className="flex flex-col space-y-2">
                            <label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="paystack"
                                checked={paymentMethod === 'paystack'}
                                onChange={() => handlePaymentMethodChange('paystack')}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2">Paystack</span>
                            </label>
                            <label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="paypal"
                                checked={paymentMethod === 'paypal'}
                                onChange={() => handlePaymentMethodChange('paypal')}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2">PayPal</span>
                            </label>
                          </div>
                          
                          {paymentMethod === 'paypal' && (
                            <div className="mt-4">
                              <div ref={paypalButtonRef} id="paypal-button-container"></div>
                              {!paypalButtonRendered && (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading PayPal...</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {paymentMethod !== 'paypal' && (
                        <button 
                          className="btn btn-primary w-full"
                          onClick={handlePurchaseTicket}
                          disabled={isProcessing || !guestInfo.phoneNumber || (!isAuthenticated && (!guestInfo.name || !guestInfo.email))}
                        >
                          {isProcessing ? 'Processing...' : selectedTicketType.price === 0 ? 'Get Free Ticket' : 'Get Tickets'}
                        </button>
                      )}
                      
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
      
      {/* Queue Modal */}
      {showQueueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white text-center">
              Ticket Purchase Queue
            </h3>
            
            <QueueStatus 
              eventId={eventId}
              queueId={queueInfo?.queueId}
              onReady={handleQueueReady}
              autoRefresh={true}
              refreshInterval={5000}
            />
            
            <div className="mt-6">
              {selectedTicketType ? (
                <button
                  onClick={selectedTicketType.price === 0 ? processFreeTicketPurchase : processPurchase}
                  className={`w-full btn ${isQueueReady ? 'btn-primary' : 'btn-disabled bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}
                  disabled={isProcessing || !isQueueReady}
                >
                  {isProcessing ? 'Processing...' : isQueueReady ? 'Continue to Purchase' : 'Waiting in Queue...'}
                </button>
              ) : (
                <div className="text-center text-amber-600 dark:text-amber-400 mb-3">
                  <p>Your ticket selection was lost. Please close this window and select a ticket again.</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowQueueModal(false);
                  // Don't reset queue info or ready status - keep for next attempt
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
              >
                {isQueueReady ? 'Close' : 'I\'ll come back later'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white text-center">
              Share This Event
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Share this event with your friends and family
              </p>
              
              <div className="flex justify-center space-x-4">
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                  </svg>
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this event: ${event?.title}`)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z" />
                  </svg>
                </a>
                <a 
                  href={`mailto:?subject=${encodeURIComponent(`Join me at ${event?.title}`)}&body=${encodeURIComponent(`I thought you might be interested in this event: ${event?.title}\n\n${window.location.href}`)}`}
                  className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this event: ${event?.title} ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5c-1.721 0-3.343-.404-4.792-1.12l-5.458 1.428 1.455-5.296A10.465 10.465 0 012.25 12C2.25 6.7 6.7 2.25 12 2.25S21.75 6.7 21.75 12 17.3 21.75 12 21.75z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={copyToClipboard}
                  className={`${linkCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-600 hover:bg-primary-700'} text-white px-4 py-2 rounded-r-md flex items-center`}
                >
                  {linkCopied ? (
                    <>
                      <FiCheck className="mr-1" /> Copied
                    </>
                  ) : (
                    <>
                      <FiCopy className="mr-1" /> Copy
                    </>
                  )}
                </button>
              </div>
              {linkCopied && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">Link copied to clipboard!</p>
              )}
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EventDetails; 
