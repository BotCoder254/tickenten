import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiCalendar, FiUsers, FiTag, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import eventService from '../../services/eventService';
import ticketService from '../../services/ticketService';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Get user events
  const { 
    data: userEvents, 
    isLoading: eventsLoading 
  } = useQuery({
    queryKey: ['userEvents'],
    queryFn: eventService.getUserEvents,
    select: (data) => data.data || [],
  });

  // Get user tickets
  const { 
    data: userTickets, 
    isLoading: ticketsLoading 
  } = useQuery({
    queryKey: ['userTickets'],
    queryFn: ticketService.getUserTickets,
    select: (data) => data.data || [],
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard 
              title="Total Events" 
              value={userEvents?.length || 0} 
              icon={<FiCalendar className="text-blue-500" />} 
            />
            <DashboardCard 
              title="Total Attendees" 
              value={(userEvents || []).reduce((sum, event) => sum + (event.attendeeCount || 0), 0)} 
              icon={<FiUsers className="text-green-500" />} 
            />
            <DashboardCard 
              title="Tickets Sold" 
              value={(userEvents || []).reduce((sum, event) => {
                return sum + (event.ticketTypes || []).reduce((tSum, ticket) => tSum + (ticket.quantitySold || 0), 0)
              }, 0)} 
              icon={<FiTag className="text-purple-500" />} 
            />
            <DashboardCard 
              title="Revenue" 
              value={`$${(userEvents || []).reduce((sum, event) => {
                return sum + (event.revenue || 0)
              }, 0).toLocaleString()}`} 
              icon={<FiDollarSign className="text-yellow-500" />} 
            />
          </div>
        );
      case 'events':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Events</h2>
              <Link to="/dashboard/events/new" className="btn btn-primary flex items-center">
                <FiPlusCircle className="mr-2" />
                Create Event
              </Link>
            </div>
            
            {eventsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : userEvents?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userEvents.map((event) => (
                  <EventCard key={event._id} event={event} formatDate={formatDate} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No events yet</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Get started by creating your first event.</p>
                <div className="mt-6">
                  <Link to="/dashboard/events/new" className="btn btn-primary">
                    Create Event
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      case 'tickets':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Tickets</h2>
            
            {ticketsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : userTickets?.length > 0 ? (
              <div className="space-y-4">
                {userTickets.map((ticket) => (
                  <TicketCard key={ticket._id} ticket={ticket} formatDate={formatDate} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FiTag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No tickets yet</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">You haven't purchased any tickets.</p>
                <div className="mt-6">
                  <Link to="/events" className="btn btn-primary">
                    Browse Events
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      case 'analytics':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
              <FiBarChart2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Analytics Coming Soon</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                We're working on bringing you detailed analytics for your events.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your events and tickets
          </p>
        </motion.div>

        {/* Dashboard Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-4 overflow-x-auto pb-2">
            <button
              className={`px-4 py-2 font-medium rounded-md transition-colors ${
                activeTab === 'overview'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 font-medium rounded-md transition-colors ${
                activeTab === 'events'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('events')}
            >
              My Events
            </button>
            <button
              className={`px-4 py-2 font-medium rounded-md transition-colors ${
                activeTab === 'tickets'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('tickets')}
            >
              My Tickets
            </button>
            <button
              className={`px-4 py-2 font-medium rounded-md transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Dashboard Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ title, value, icon }) => {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
        </div>
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
          {icon}
        </div>
      </div>
    </div>
  );
};

// Event Card Component
const EventCard = ({ event, formatDate }) => {
  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
        {event.featuredImage ? (
          <img 
            src={event.featuredImage} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FiCalendar className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium">
          {event.status || 'Draft'}
        </div>
      </div>
      <div className="p-4 flex-grow">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {formatDate(event.startDate)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
          {event.shortDescription}
        </p>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {(event.ticketTypes || []).reduce((sum, ticket) => sum + (ticket.quantitySold || 0), 0)} tickets sold
          </span>
          <span className="font-medium text-primary-600 dark:text-primary-400">
            ${event.revenue || 0}
          </span>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between">
        <Link 
          to={`/events/${event._id}`} 
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
        >
          View
        </Link>
        <Link 
          to={`/dashboard/events/edit/${event._id}`} 
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
        >
          Edit
        </Link>
      </div>
    </div>
  );
};

// Ticket Card Component
const TicketCard = ({ ticket, formatDate }) => {
  return (
    <div className="card p-4 flex flex-col md:flex-row">
      <div className="md:w-1/4 mb-4 md:mb-0">
        {ticket.event?.featuredImage ? (
          <img 
            src={ticket.event.featuredImage} 
            alt={ticket.event.title} 
            className="w-full h-32 md:h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <FiTag className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
      <div className="md:w-3/4 md:pl-6">
        <div className="flex flex-wrap justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {ticket.event?.title || 'Event Name'}
          </h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            ticket.status === 'used' 
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300' 
              : ticket.status === 'cancelled' 
              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
          }`}>
            {ticket.status === 'used' ? 'Used' : ticket.status === 'cancelled' ? 'Cancelled' : 'Valid'}
          </span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
          {formatDate(ticket.event?.startDate)} • {ticket.ticketType?.name || 'General Admission'}
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Ticket #</p>
            <p className="font-medium text-gray-900 dark:text-white">{ticket.ticketNumber}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Purchase Date</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(ticket.purchaseDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Price</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {ticket.ticketType?.price || 0} {ticket.ticketType?.currency || 'USD'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <Link 
            to={`/tickets/${ticket._id}`}
            className="btn btn-outline-primary btn-sm"
          >
            View Ticket
          </Link>
          {ticket.status !== 'used' && ticket.status !== 'cancelled' && (
            <button className="btn btn-outline-danger btn-sm">
              Cancel Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 