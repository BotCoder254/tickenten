import React, { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiDownload, FiShare2, FiTrash2, FiDollarSign, FiInfo } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'react-qr-code';
import ticketService from '../services/ticketService';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  // Resale state variables
  const [showResaleModal, setShowResaleModal] = useState(false);
  const [resalePrice, setResalePrice] = useState('');
  const [resaleDescription, setResaleDescription] = useState('');
  const [resaleError, setResaleError] = useState('');
  const [resaleLoading, setResaleLoading] = useState(false);

  // Get ticket details
  const { data: ticket, isLoading: ticketLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketService.getTicketById(ticketId),
    select: (data) => data.data,
  });

  // Cancel ticket mutation
  const cancelMutation = useMutation({
    mutationFn: () => ticketService.cancelTicket(ticketId),
    onSuccess: () => {
      // Refetch ticket data after cancellation
      queryClient.invalidateQueries(['ticket', ticketId]);
    },
  });

  // Delete ticket mutation
  const deleteMutation = useMutation({
    mutationFn: () => ticketService.deleteTicket(ticketId),
    onSuccess: () => {
      navigate('/dashboard?tab=tickets');
    },
  });
  
  // Resale ticket mutation
  const resaleMutation = useMutation({
    mutationFn: (resaleData) => ticketService.listTicketForResale(ticketId, resaleData),
    onSuccess: () => {
      // Close modal and refetch ticket data
      setShowResaleModal(false);
      queryClient.invalidateQueries(['ticket', ticketId]);
    },
    onError: (error) => {
      setResaleError(error.response?.data?.message || 'Failed to list ticket for resale.');
      setResaleLoading(false);
    },
  });

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

  // Get image URL helper function
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
  };

  // Handle ticket download
  const handleDownload = async () => {
    try {
      const blob = await ticketService.downloadTicket(ticketId);
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.ticketNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading ticket:', err);
      alert('Failed to download ticket. Please try again.');
    }
  };

  // Handle ticket sharing
  const handleShare = () => {
    setShowShareOptions(!showShareOptions);
    setShareEmail('');
    setShareError('');
    setShareSuccess('');
  };

  // Handle email share
  const handleEmailShare = async () => {
    if (!shareEmail || !shareEmail.includes('@')) {
      setShareError('Please enter a valid email address');
      return;
    }

    try {
      await ticketService.shareTicket(ticketId, { email: shareEmail });
      setShareSuccess('Ticket shared successfully!');
      setShareError('');
      setTimeout(() => {
        setShowShareOptions(false);
        setShareSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error sharing ticket:', err);
      setShareError('Failed to share ticket. Please try again.');
    }
  };

  // Handle ticket cancellation
  const handleCancelTicket = async () => {
    if (window.confirm('Are you sure you want to cancel this ticket? This action cannot be undone.')) {
      try {
        await cancelMutation.mutateAsync();
        alert('Ticket cancelled successfully');
      } catch (err) {
        console.error('Error cancelling ticket:', err);
        alert('Failed to cancel ticket. Please try again.');
      }
    }
  };

  // Handle ticket deletion
  const handleDeleteTicket = async () => {
    if (window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        await deleteMutation.mutateAsync();
        // No need for alert here as we'll navigate away on success
      } catch (err) {
        console.error('Error deleting ticket:', err);
        const errorMessage = err.message || 'Failed to delete ticket. Please try again.';
        alert(errorMessage);
        setIsLoading(false);
      }
    }
  };
  
  // Handle resale modal toggle
  const handleResaleModal = () => {
    setShowResaleModal(!showResaleModal);
    setResalePrice('');
    setResaleDescription('');
    setResaleError('');
  };
  
  // Handle resale submission
  const handleResaleSubmit = async () => {
    // Validate price
    const numPrice = parseFloat(resalePrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setResaleError('Please enter a valid price greater than zero.');
      return;
    }
    
    // Check if it's a free ticket (shouldn't be resold for money)
    if (ticket.ticketTypeInfo?.price === 0 && numPrice > 0) {
      setResaleError('Free tickets cannot be resold for money.');
      return;
    }
    
    try {
      setResaleLoading(true);
      setResaleError('');
      
      await resaleMutation.mutateAsync({
        resalePrice: numPrice,
        description: resaleDescription
      });
      
    } catch (err) {
      console.error('Error listing ticket for resale:', err);
      setResaleError(err.response?.data?.message || 'Failed to list ticket for resale.');
      setResaleLoading(false);
    }
  };
  
  // Cancel resale listing
  const handleCancelResale = async () => {
    if (window.confirm('Are you sure you want to cancel this resale listing?')) {
      try {
        setIsLoading(true);
        await ticketService.cancelTicketResale(ticketId);
        queryClient.invalidateQueries(['ticket', ticketId]);
        setIsLoading(false);
      } catch (err) {
        console.error('Error cancelling resale listing:', err);
        alert('Failed to cancel resale listing. Please try again.');
        setIsLoading(false);
      }
    }
  };

  if (ticketLoading) {
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
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Error Loading Ticket</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error.response?.data?.message || 'Failed to load ticket details. Please try again.'}
          </p>
          <Link to="/dashboard" className="mt-4 btn btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The ticket you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/dashboard" className="mt-4 btn btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card overflow-hidden"
        >
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Ticket</h1>
              <div className="flex space-x-2">
                <button 
                  onClick={handleDownload}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Download ticket"
                >
                  <FiDownload />
                </button>
                <div className="relative">
                  <button 
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Share ticket"
                  >
                    <FiShare2 />
                  </button>
                  {showShareOptions && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Share Ticket</h3>
                      {shareSuccess ? (
                        <p className="text-sm text-green-600 dark:text-green-400">{shareSuccess}</p>
                      ) : (
                        <>
                          <div className="mb-3">
                            <label htmlFor="shareEmail" className="sr-only">Email</label>
                            <input
                              id="shareEmail"
                              type="email"
                              placeholder="Email address"
                              value={shareEmail}
                              onChange={(e) => setShareEmail(e.target.value)}
                              className="w-full text-sm input"
                            />
                            {shareError && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{shareError}</p>
                            )}
                          </div>
                          <button 
                            onClick={handleEmailShare}
                            className="w-full text-center px-4 py-2 text-sm btn btn-primary"
                          >
                            Send via Email
                          </button>
                          <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                              Copy Link
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold mt-2">{ticket.event?.title}</h2>
            <p className="opacity-90">{ticket.ticketTypeInfo?.name || 'General Admission'}</p>
            
            {/* Resale indicator if ticket is for resale */}
            {ticket.isForResale && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <FiDollarSign className="mr-1" />
                Listed for Resale at {ticket.resalePrice} {ticket.ticketTypeInfo?.currency || 'USD'}
              </div>
            )}
          </div>

          {/* Event Image */}
          {ticket.event?.featuredImage && (
            <div className="w-full h-48 overflow-hidden">
              <img 
                src={getImageUrl(ticket.event.featuredImage)} 
                alt={ticket.event?.title || 'Event'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
                }}
              />
            </div>
          )}

          {/* Ticket Body */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* QR Code */}
              <div className="md:w-1/3 flex flex-col items-center">
                <div className="p-4 bg-white rounded-lg">
                  <QRCode 
                    value={`${window.location.origin}/verify-ticket/${ticket.ticketNumber}`} 
                    size={150}
                  />
                </div>
                <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  Ticket #: {ticket.ticketNumber}
                </p>
                <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                  ticket.status === 'used' 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300' 
                    : ticket.status === 'cancelled' 
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                }`}>
                  {ticket.status === 'used' ? 'Used' : ticket.status === 'cancelled' ? 'Cancelled' : 'Valid'}
                </div>
              </div>

              {/* Event Details */}
              <div className="md:w-2/3">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Event Date</p>
                    <div className="flex items-center mt-1">
                      <FiCalendar className="text-gray-400 mr-2" />
                      <p className="text-gray-900 dark:text-white">
                        {formatDate(ticket.event?.startDate)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Event Time</p>
                    <div className="flex items-center mt-1">
                      <FiClock className="text-gray-400 mr-2" />
                      <p className="text-gray-900 dark:text-white">
                        {formatTime(ticket.event?.startDate)} - {formatTime(ticket.event?.endDate)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <div className="flex items-center mt-1">
                      <FiMapPin className="text-gray-400 mr-2" />
                      <p className="text-gray-900 dark:text-white">
                        {ticket.event?.isVirtual
                          ? 'Virtual Event'
                          : `${ticket.event?.location?.venue}, ${ticket.event?.location?.city}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Holder</p>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {ticket.attendeeName || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Purchase Date</p>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatDate(ticket.purchaseDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                    <p className="text-gray-900 dark:text-white mt-1 font-medium">
                      {ticket.ticketTypeInfo?.price} {ticket.ticketTypeInfo?.currency}
                    </p>
                  </div>
                  
                  {ticket.event?.description && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <FiInfo className="mr-1" /> Event Description
                      </p>
                      <p className="text-gray-900 dark:text-white mt-1 text-sm">
                        {ticket.event.description.length > 100 
                          ? `${ticket.event.description.substring(0, 100)}...` 
                          : ticket.event.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-wrap gap-3">
              {ticket.event?._id && (
                <Link to={`/events/${ticket.event._id}`} className="btn btn-outline-primary">
                  View Event
                </Link>
              )}
              
              {ticket.status !== 'used' && ticket.status !== 'cancelled' && (
                <>
                  {!ticket.isForResale ? (
                    <button 
                      className="btn btn-outline-primary flex items-center"
                      onClick={handleResaleModal}
                    >
                      <FiDollarSign className="mr-1" />
                      Resell Ticket
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline-warning flex items-center"
                      onClick={handleCancelResale}
                      disabled={isLoading}
                    >
                      <FiDollarSign className="mr-1" />
                      Cancel Resale
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-outline-danger"
                    onClick={handleCancelTicket}
                    disabled={cancelMutation.isLoading}
                  >
                    {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel Ticket'}
                  </button>
                  <button 
                    className="btn btn-outline-danger flex items-center"
                    onClick={handleDeleteTicket}
                    disabled={isLoading}
                  >
                    <FiTrash2 className="mr-1" />
                    {isLoading ? 'Deleting...' : 'Delete Ticket'}
                  </button>
                </>
              )}
              {(ticket.status === 'cancelled') && (
                <button 
                  className="btn btn-outline-danger flex items-center"
                  onClick={handleDeleteTicket}
                  disabled={isLoading}
                >
                  <FiTrash2 className="mr-1" />
                  {isLoading ? 'Deleting...' : 'Delete Ticket'}
                </button>
              )}
            </div>
            
            {/* Additional Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/dashboard/tickets" className="btn btn-outline-secondary">
                Back to My Tickets
              </Link>
              <Link to="/dashboard" className="btn btn-outline-secondary">
                Dashboard
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Resale Modal */}
      {showResaleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Resell Your Ticket</h3>
            
            {/* Price Info */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Original Ticket Price: {ticket.ticketTypeInfo?.price} {ticket.ticketTypeInfo?.currency}
              </p>
            </div>
            
            {resaleError && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                <p>{resaleError}</p>
              </div>
            )}
            
            <form onSubmit={(e) => { e.preventDefault(); handleResaleSubmit(); }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="resalePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Resale Price ({ticket.ticketTypeInfo?.currency})
                  </label>
                  <input
                    id="resalePrice"
                    type="number"
                    value={resalePrice}
                    onChange={(e) => setResalePrice(e.target.value)}
                    className="input w-full"
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                    disabled={ticket.ticketTypeInfo?.price === 0}
                  />
                  {ticket.ticketTypeInfo?.price === 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Free tickets cannot be resold for money.
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="resaleDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="resaleDescription"
                    value={resaleDescription}
                    onChange={(e) => setResaleDescription(e.target.value)}
                    className="input w-full"
                    rows={3}
                    placeholder="Add any details about your ticket"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleResaleModal}
                  className="btn btn-outline-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={resaleLoading || ticket.ticketTypeInfo?.price === 0}
                >
                  {resaleLoading ? 'Listing...' : 'List for Resale'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails; 