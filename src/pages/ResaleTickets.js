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
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
  <PageHeader
    title="🔥 Resale Tickets 🔥"
    subtitle="Score insane deals on tickets from real fans"
    icon={<FaTicketAlt className="text-purple-500 animate-pulse" />}
  />

  <div className="mb-10">
    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      <div className="relative flex-grow">
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
        <input
          type="text"
          placeholder="Search concerts, sports, festivals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 pr-6 py-3 w-full rounded-xl border-2 border-purple-300 focus:ring-4 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white shadow-lg transition-all duration-300"
        />
      </div>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        <FaFilter className="text-lg" />
        <span className="text-lg">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
      </button>
    </div>

    {showFilters && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl mb-6 border-2 border-purple-200 dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-grow">
            <label className="block text-lg font-bold text-purple-700 dark:text-purple-300 mb-3">
              💰 Price Range
            </label>
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="pl-12 pr-6 py-3 w-full rounded-xl border-2 border-purple-300 focus:ring-4 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <span className="text-xl font-bold text-purple-500 dark:text-purple-300">→</span>
              <div className="relative flex-grow">
                <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="pl-12 pr-6 py-3 w-full rounded-xl border-2 border-purple-300 focus:ring-4 focus:ring-purple-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-white"
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
              className="px-6 py-3 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-white font-bold rounded-xl transition-all duration-300 hover:bg-purple-100 dark:hover:bg-gray-700"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </div>

  {filteredTickets.length === 0 ? (
    <EmptyState
      title="🚫 No Tickets Found"
      message="Damn! No tickets match your search. Try different filters or check back soon for fresh drops!"
      icon={<FaTicketAlt className="w-16 h-16 text-purple-500 animate-bounce" />}
    />
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {filteredTickets.map((ticket) => (
        <motion.div
          key={ticket._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 border-purple-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
        >
          <div className="p-6">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 line-clamp-1">
              🎟️ {ticket.event?.title || 'Mystery Event'}
            </h3>
            <div className="flex items-center text-base text-gray-700 dark:text-gray-300 mb-2">
              <FaCalendarAlt className="mr-3 text-purple-500" />
              <span>
                {formatDate(ticket.event?.startDate)} @ {formatTime(ticket.event?.startTime || ticket.event?.startDate)}
              </span>
            </div>
            <div className="flex items-center text-base text-gray-700 dark:text-gray-300 mb-4">
              <FaMapMarkerAlt className="mr-3 text-purple-500" />
              <span className="font-medium">{getVenue(ticket)}</span>
            </div>
            <div className="flex items-center justify-between mb-5">
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm font-bold px-3 py-1 rounded-full">
                {getTicketTypeName(ticket)}
              </span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                ${ticket.resalePrice?.toFixed(2) || '???'}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-5 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="line-clamp-2 italic">{ticket.resaleDescription || 'No description... probably fire though 🔥'}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                👤 {ticket.user?.firstName || ticket.user?.name?.split(' ')[0] || 'Secret Seller'}
              </span>
              <button
                onClick={() => handlePurchaseTicket(ticket._id)}
                disabled={purchaseInProgress || (isAuthenticated && ticket.user?._id === user?._id)}
                className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all duration-300 transform hover:scale-105 ${
                  purchaseInProgress || (isAuthenticated && ticket.user?._id === user?._id)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'
                }`}
              >
                {isAuthenticated && ticket.user?._id === user?._id
                  ? 'Your Ticket 👑'
                  : 'BUY NOW'}
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
