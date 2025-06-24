import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiDownload, FiShare2, FiTrash2 } from 'react-icons/fi';
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
          </div>

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
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-wrap gap-3">
              <Link to={`/events/${ticket.event?._id}`} className="btn btn-outline-primary">
                View Event
              </Link>
              {ticket.status !== 'used' && ticket.status !== 'cancelled' && (
                <>
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
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TicketDetails; 