import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaDownload, FaShare, FaTicketAlt, FaArrowLeft } from 'react-icons/fa';
import { MdDone } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';
import Spinner from '../components/Spinner';
import ticketService from '../services/ticketService';
import TicketResale from '../components/TicketResale';

const TicketSuccess = () => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        setLoading(true);
        let ticketId;
        const params = new URLSearchParams(location.search);
        
        // Try to get ticket ID from location state first
        if (location.state && location.state.ticketId) {
          ticketId = location.state.ticketId;
        } else {
          // Otherwise try to get from query params
          ticketId = params.get('ticketId');
        }

        if (!ticketId) {
          setError('No ticket information found. Please check your purchase details.');
          setLoading(false);
          return;
        }

        // Fetch ticket data
        let ticketData;
        if (isAuthenticated) {
          // For authenticated users
          const response = await ticketService.getTicketById(ticketId);
          ticketData = response.data;
        } else {
          // For guest users
          const ticketNumber = params.get('ticketNumber');
          if (!ticketNumber) {
            setError('No ticket information found. Please check your purchase details.');
            setLoading(false);
            return;
          }
          const response = await ticketService.verifyTicket(ticketNumber);
          ticketData = response.data;
        }

        setTicket(ticketData);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Failed to load ticket information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [location, isAuthenticated]);

  const handleDownloadTicket = async () => {
    if (!ticket) return;
    
    try {
      toast.info('Preparing your ticket for download...');
      await ticketService.downloadTicket(ticket._id);
      toast.success('Ticket downloaded successfully!');
    } catch (err) {
      console.error('Error downloading ticket:', err);
      toast.error('Failed to download ticket. Please try again.');
    }
  };

  const handleShareTicket = async () => {
    if (!ticket) return;
    
    try {
      const email = prompt('Enter the email address to share this ticket with:');
      if (!email) return;
      
      toast.info('Sharing your ticket...');
      await ticketService.shareTicket(ticket._id, { email });
      toast.success('Ticket shared successfully!');
    } catch (err) {
      console.error('Error sharing ticket:', err);
      toast.error('Failed to share ticket. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-dark-200">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-screen bg-gray-50 dark:bg-dark-200">
        <div className="max-w-2xl mx-auto bg-white dark:bg-dark-100 rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <FaTicketAlt className="text-red-500 dark:text-red-400 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ticket Error</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{error}</p>
          </div>
          <div className="flex justify-center">
            <Link
              to="/"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-300"
            >
              <FaArrowLeft className="inline mr-2" /> Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-screen bg-gray-50 dark:bg-dark-200">
        <div className="max-w-2xl mx-auto bg-white dark:bg-dark-100 rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <FaTicketAlt className="text-yellow-500 dark:text-yellow-400 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ticket Information Missing</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">We couldn't find the ticket information. Please check your email for ticket details.</p>
          </div>
          <div className="flex justify-center">
            <Link
              to="/"
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-300"
            >
              <FaArrowLeft className="inline mr-2" /> Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12 min-h-screen bg-gray-50 dark:bg-dark-200"
    >
      <div className="max-w-2xl mx-auto bg-white dark:bg-dark-100 rounded-lg shadow-md overflow-hidden">
        <div className="bg-primary-600 dark:bg-primary-700 p-6 text-center">
          <div className="bg-white dark:bg-dark-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <MdDone className="text-primary-600 dark:text-primary-400 text-4xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Purchase Successful!</h1>
          <p className="text-white opacity-90 mt-1">Your ticket has been confirmed</p>
        </div>
        
        <div className="p-6">
          <div className="border-b dark:border-dark-300 pb-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{ticket.event?.title || 'Event'}</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {ticket.event?.startDate ? formatDate(ticket.event.startDate) : 'Date not available'} at{' '}
              {ticket.event?.startDate ? formatTime(ticket.event.startDate) : 'Time not available'}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {ticket.event?.location?.venue
                ? `${ticket.event.location.venue}, ${ticket.event.location.city}`
                : 'Location not available'}
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ticket Number:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{ticket.ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Attendee Name:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{ticket.attendeeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Purchase Date:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {ticket.purchaseDate ? formatDate(ticket.purchaseDate) : 'Not available'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {isAuthenticated && (
              <>
                <button
                  onClick={handleDownloadTicket}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition duration-300 flex items-center justify-center"
                >
                  <FaDownload className="mr-2" /> Download Ticket
                </button>
                <button
                  onClick={handleShareTicket}
                  className="flex-1 px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition duration-300 flex items-center justify-center"
                >
                  <FaShare className="mr-2" /> Share Ticket
                </button>
              </>
            )}
          </div>
          
          {isAuthenticated && ticket && ticket._id && (
            <div className="mt-6">
              <TicketResale 
                ticket={ticket} 
                onResaleComplete={() => {
                  toast.success("Ticket resale status updated successfully!");
                  // Refresh ticket data
                  ticketService.getTicketById(ticket._id)
                    .then(response => setTicket(response.data))
                    .catch(err => console.error("Error refreshing ticket data:", err));
                }}
              />
            </div>
          )}
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/events"
              className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 rounded-md hover:bg-primary-600 hover:text-white dark:hover:bg-primary-700 transition duration-300 text-center"
            >
              Browse More Events
            </Link>
            {isAuthenticated ? (
              <Link
                to="/dashboard/tickets"
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition duration-300 text-center"
              >
                My Tickets
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition duration-300 text-center"
              >
                Sign In to Manage Tickets
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketSuccess; 