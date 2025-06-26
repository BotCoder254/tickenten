import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaFilter, FaSearch, FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ticketService from '../services/ticketService';
import Spinner from '../components/Spinner';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { useTheme } from '../App';

const ResaleTickets = () => {
  const { isAuthenticated, user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resaleTickets, setResaleTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);

  useEffect(() => {
    const fetchResaleTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching resale tickets...');
        const response = await ticketService.getResaleTickets();
        console.log('Resale tickets response:', response);
        
        if (response && response.tickets) {
          // Use response.tickets instead of response.data
          const ticketsArray = Array.isArray(response.tickets) ? response.tickets : [];
          console.log(`Found ${ticketsArray.length} resale tickets`);
          
          setResaleTickets(ticketsArray);
          setFilteredTickets(ticketsArray);
        } else if (response && response.data) {
          // Fallback to response.data if response.tickets doesn't exist
          const ticketsArray = Array.isArray(response.data) ? response.data : [];
          console.log(`Found ${ticketsArray.length} resale tickets (using data fallback)`);
          
          setResaleTickets(ticketsArray);
          setFilteredTickets(ticketsArray);
        } else {
          console.warn('No resale tickets data found in response');
          setResaleTickets([]);
          setFilteredTickets([]);
        }
      } catch (error) {
        console.error('Error fetching resale tickets:', error);
        setError('Failed to load resale tickets. Please try again later.');
        toast.error('Failed to load resale tickets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResaleTickets();
  }, []);

  useEffect(() => {
    // Apply filters when search term or price range changes
    if (!resaleTickets || resaleTickets.length === 0) {
      setFilteredTickets([]);
      return;
    }
    
    let results = [...resaleTickets];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        ticket => 
          (ticket.event?.title || '').toLowerCase().includes(term) ||
          (ticket.event?.location?.venue || '').toLowerCase().includes(term) ||
          (ticket.ticketTypeInfo?.name || '').toLowerCase().includes(term)
      );
    }

    if (priceRange.min) {
      results = results.filter(ticket => ticket.resalePrice >= Number(priceRange.min));
    }

    if (priceRange.max) {
      results = results.filter(ticket => ticket.resalePrice <= Number(priceRange.max));
    }

    setFilteredTickets(results);
  }, [searchTerm, priceRange, resaleTickets]);

  const handlePurchaseTicket = async (ticketId) => {
    if (!isAuthenticated) {
      toast.info('Please log in to purchase this ticket');
      navigate('/login', { state: { from: `/tickets/resale-listings` } });
      return;
    }

    try {
      setPurchaseInProgress(true);
      const purchaseData = {
        userId: user._id,
        paymentMethod: 'direct', // Simplified for demo
        paymentReference: `RESALE-${Date.now()}`, // Simplified for demo
      };

      await ticketService.purchaseResaleTicket(ticketId, purchaseData);
      toast.success('Ticket purchased successfully!');
      
      // Refresh the list
      const response = await ticketService.getResaleTickets();
      if (response && response.tickets) {
        // Use response.tickets instead of response.data
        const ticketsArray = Array.isArray(response.tickets) ? response.tickets : [];
        setResaleTickets(ticketsArray);
        setFilteredTickets(ticketsArray);
      } else if (response && response.data) {
        // Fallback to response.data
        const ticketsArray = Array.isArray(response.data) ? response.data : [];
        setResaleTickets(ticketsArray);
        setFilteredTickets(ticketsArray);
      }
      
      // Navigate to success page or user tickets
      navigate('/dashboard/tickets');
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to purchase ticket. Please try again.');
    } finally {
      setPurchaseInProgress(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date not available';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Time not available';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error('Time formatting error:', error);
      return 'Time not available';
    }
  };

  const getTicketTypeName = (ticket) => {
    if (ticket.ticketTypeInfo && ticket.ticketTypeInfo.name) {
      return ticket.ticketTypeInfo.name;
    }
    if (ticket.ticketType && ticket.ticketType.name) {
      return ticket.ticketType.name;
    }
    return 'Standard Ticket';
  };

  const getVenue = (ticket) => {
    if (ticket.event?.location?.venue) {
      return ticket.event.location.venue;
    }
    if (ticket.event?.venue) {
      return ticket.event.venue;
    }
    return 'Location not specified';
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Retry fetching tickets
    ticketService.getResaleTickets()
      .then(response => {
        if (response && response.tickets) {
          // Use response.tickets instead of response.data
          const ticketsArray = Array.isArray(response.tickets) ? response.tickets : [];
          setResaleTickets(ticketsArray);
          setFilteredTickets(ticketsArray);
        } else if (response && response.data) {
          // Fallback to response.data
          const ticketsArray = Array.isArray(response.data) ? response.data : [];
          setResaleTickets(ticketsArray);
          setFilteredTickets(ticketsArray);
        } else {
          setResaleTickets([]);
          setFilteredTickets([]);
        }
      })
      .catch(err => {
        console.error('Error retrying fetch:', err);
        setError('Failed to load resale tickets. Please try again later.');
        toast.error('Failed to load resale tickets. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return <Spinner size="large" />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Resale Tickets"
          subtitle="Find great deals on tickets from other users"
          icon={<FaTicketAlt className="text-primary-500" />}
        />
        <EmptyState
          title="Error Loading Tickets"
          message={error}
          icon={<FaTicketAlt className="w-12 h-12" />}
          actionButton={
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Resale Tickets"
        subtitle="Find great deals on tickets from other users"
        icon={<FaTicketAlt className="text-primary-500" />}
      />

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events, venues, or ticket types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-200 dark:border-dark-100 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-dark-200 dark:hover:bg-dark-300 rounded-lg transition-colors"
          >
            <FaFilter />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white dark:bg-dark-100 p-4 rounded-lg shadow mb-4"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-200 dark:border-dark-100 dark:text-white"
                    />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <div className="relative">
                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-dark-200 dark:border-dark-100 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="self-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPriceRange({ min: '', max: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {filteredTickets.length === 0 ? (
        <EmptyState
          title="No resale tickets found"
          message="There are no tickets currently available for resale. Check back later or adjust your search filters."
          icon={<FaTicketAlt className="w-12 h-12" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <motion.div
              key={ticket._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-dark-100 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-dark-300"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-1">
                  {ticket.event?.title || 'Untitled Event'}
                </h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <FaCalendarAlt className="mr-2" />
                  <span>
                    {formatDate(ticket.event?.startDate)} at {formatTime(ticket.event?.startTime || ticket.event?.startDate)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{getVenue(ticket)}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 text-xs font-semibold px-2.5 py-0.5 rounded">
                    {getTicketTypeName(ticket)}
                  </span>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    ${ticket.resalePrice?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p className="line-clamp-2">{ticket.resaleDescription || 'No description provided.'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Listed by {ticket.user?.firstName || ticket.user?.name?.split(' ')[0] || 'Anonymous'}
                  </span>
                  <button
                    onClick={() => handlePurchaseTicket(ticket._id)}
                    disabled={purchaseInProgress || (isAuthenticated && ticket.user?._id === user?._id)}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${
                      purchaseInProgress || (isAuthenticated && ticket.user?._id === user?._id)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {isAuthenticated && ticket.user?._id === user?._id
                      ? 'Your Ticket'
                      : 'Purchase'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResaleTickets; 