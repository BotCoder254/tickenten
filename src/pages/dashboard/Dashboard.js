import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';

import {
  FiPlusCircle,
  FiCalendar,
  FiUsers,
  FiTag,
  FiDollarSign,
  FiBarChart2,
  FiPieChart,
  FiMapPin,
  FiGrid
} from 'react-icons/fi';

import eventService from '../../services/eventService';
import ticketService from '../../services/ticketService';
// Helper function for consistent image handling
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
};

const Dashboard = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');

  // Update URL when tab changes
  useEffect(() => {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', newUrl);
  }, [activeTab]);

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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Revenue Overview</h3>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                  <RevenueChart events={userEvents || []} />
                </div>
              </div>
              
              {/* Attendance Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Attendance by Event</h3>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                  <AttendanceChart events={userEvents || []} />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket Sales Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ticket Sales Over Time</h3>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                  <TicketSalesChart events={userEvents || []} />
                </div>
              </div>
              
              {/* Category Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Event Categories</h3>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                  <CategoryChart events={userEvents || []} />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
const tabs = [
  { id: "overview", label: "Overview", icon: <FiGrid /> },
  { id: "events", label: "My Events", icon: <FiCalendar /> },
  { id: "tickets", label: "My Tickets", icon: <FiTag /> },
  { id: "analytics", label: "Analytics", icon: <FiBarChart2 /> },
];
                
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
const tabs = [
  { id: "overview", label: "Overview", icon: <FiGrid /> },
  { id: "events", label: "My Events", icon: <FiCalendar /> },
  { id: "tickets", label: "My Tickets", icon: <FiTicket /> },
  { id: "analytics", label: "Analytics", icon: <FiBarChart2 /> },
];

// 👇 Your tab UI
<div className="relative mb-8">
  <div className="flex overflow-x-auto space-x-2 pb-2 px-1 relative rounded-xl bg-white/50 dark:bg-dark-300/30 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-inner dark:shadow-lg">
    {tabs.map((tab, index) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`relative z-10 flex items-center gap-2 px-5 py-2 font-semibold rounded-lg whitespace-nowrap transition-all duration-300 
          ${
            activeTab === tab.id
              ? "text-white dark:text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
          }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}

    {/* 🔥 Sliding Tab Indicator */}
    <motion.div
      layoutId="dashboard-tab"
      className="absolute top-1 bottom-1 z-0 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 shadow-md"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        width: `calc(100% / ${tabs.length} - 0.5rem)`,
        left: `calc(${tabs.findIndex(t => t.id === activeTab)} * (100% / ${tabs.length}) + 0.25rem)`,
      }}
    />
  </div>
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
  // Get lowest price from ticket types
  const getLowestPrice = () => {
    if (!event.ticketTypes || event.ticketTypes.length === 0) return 'Free';
    const prices = event.ticketTypes.map(ticket => ticket.price);
    const lowestPrice = Math.min(...prices);
    return lowestPrice > 0 ? `${lowestPrice} ${event.ticketTypes[0].currency || 'USD'}` : 'Free';
  };

  return (
    <div className="card overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
        {event.featuredImage ? (
          <img 
            src={getImageUrl(event.featuredImage)} 
            alt={event.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FiCalendar className="h-12 w-12" />
          </div>
        )}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        
        {/* Status badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium">
          {event.status === 'published' ? 'Published' : 'Draft'}
        </div>
        
        {/* Category tag */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
          {event.category || 'Technology'}
        </div>
        
        {/* Date and location at bottom */}
        <div className="absolute bottom-2 left-2 right-2 text-white">
          <div className="flex items-center text-sm">
            <FiCalendar className="mr-1" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center text-sm mt-1">
            <FiMapPin className="mr-1" />
            <span>{event.isVirtual ? 'Virtual Event' : event.location?.city || 'Location unavailable'}</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex-grow">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 line-clamp-2">
          {event.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {event.shortDescription}
        </p>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">
            {(event.ticketTypes || []).reduce((sum, ticket) => sum + (ticket.quantitySold || 0), 0)} tickets sold
          </span>
          <span className="font-medium text-primary-600 dark:text-primary-400">
            From {getLowestPrice()}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {event.status === 'published' ? 'Revenue' : 'Capacity'}
          </span>
          <span className="font-medium text-primary-600 dark:text-primary-400">
            {event.status === 'published' 
              ? `$${(event.ticketTypes || []).reduce((sum, ticket) => sum + ((ticket.price || 0) * (ticket.quantitySold || 0)), 0)}`
              : event.capacity ? `${event.capacity} attendees` : 'Unlimited'
            }
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();

  const handleDeleteTicket = async () => {
    if (isDeleting) return;
    
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setErrorMessage('');
      await ticketService.deleteTicket(ticket._id);
      // Refresh tickets by invalidating the query
      queryClient.invalidateQueries(['userTickets']);
      setIsDeleting(false);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      const message = error.message || 'Failed to delete ticket. Please try again.';
      setErrorMessage(message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="card p-4 flex flex-col md:flex-row">
      <div className="md:w-1/4 mb-4 md:mb-0">
        {ticket.event?.featuredImage ? (
          <img 
            src={getImageUrl(ticket.event.featuredImage)} 
            alt={ticket.event.title} 
            className="w-full h-32 md:h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
            }}
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
          {formatDate(ticket.event?.startDate)} • {ticket.ticketTypeInfo?.name || 'General Admission'}
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
              {ticket.ticketTypeInfo?.price || 0} {ticket.ticketTypeInfo?.currency || 'USD'}
            </p>
          </div>
        </div>
        {errorMessage && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}
        <div className="mt-4 flex space-x-3">
          <Link 
            to={`/tickets/${ticket._id}`}
            className="btn btn-outline-primary btn-sm"
          >
            View Ticket
          </Link>
          {ticket.status !== 'used' && ticket.status !== 'cancelled' && (
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={handleDeleteTicket}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Ticket'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Revenue Chart Component
const RevenueChart = ({ events }) => {
  if (!events.length) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        <FiBarChart2 className="mx-auto h-12 w-12 mb-2" />
        <p>No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-grow relative">
        {/* This is a placeholder for a real chart library */}
        <div className="absolute inset-0 flex items-end">
          {events.slice(0, 5).map((event, index) => {
            const revenue = event.revenue || Math.floor(Math.random() * 1000) + 100;
            const height = `${(revenue / 1000) * 100}%`;
            
            return (
              <div key={index} className="flex-1 mx-1 flex flex-col items-center">
                <div 
                  style={{ height }} 
                  className="w-full bg-primary-500 dark:bg-primary-600 rounded-t-md"
                ></div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-6 mt-2 flex">
        {events.slice(0, 5).map((event, index) => (
          <div key={index} className="flex-1 mx-1 text-xs text-center truncate text-gray-600 dark:text-gray-400">
            {event.title}
          </div>
        ))}
      </div>
    </div>
  );
};

// Attendance Chart Component
const AttendanceChart = ({ events }) => {
  if (!events.length) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        <FiUsers className="mx-auto h-12 w-12 mb-2" />
        <p>No attendance data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-grow relative">
        {/* This is a placeholder for a real chart library */}
        <div className="absolute inset-0 flex items-end">
          {events.slice(0, 5).map((event, index) => {
            const attendees = event.attendeeCount || Math.floor(Math.random() * 100) + 10;
            const height = `${(attendees / 100) * 100}%`;
            
            return (
              <div key={index} className="flex-1 mx-1 flex flex-col items-center">
                <div 
                  style={{ height }} 
                  className="w-full bg-green-500 dark:bg-green-600 rounded-t-md"
                ></div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-6 mt-2 flex">
        {events.slice(0, 5).map((event, index) => (
          <div key={index} className="flex-1 mx-1 text-xs text-center truncate text-gray-600 dark:text-gray-400">
            {event.title}
          </div>
        ))}
      </div>
    </div>
  );
};

// Ticket Sales Chart Component
const TicketSalesChart = ({ events }) => {
  if (!events.length) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        <FiTag className="mx-auto h-12 w-12 mb-2" />
        <p>No ticket sales data available</p>
      </div>
    );
  }

  // Generate a line chart for ticket sales over time
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-grow relative">
        {/* This is a placeholder for a real chart library */}
        <svg className="w-full h-full" viewBox="0 0 100 50">
          <polyline
            points="0,50 20,35 40,40 60,20 80,25 100,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-purple-500 dark:text-purple-400"
          />
          <circle cx="0" cy="50" r="2" className="fill-current text-purple-600" />
          <circle cx="20" cy="35" r="2" className="fill-current text-purple-600" />
          <circle cx="40" cy="40" r="2" className="fill-current text-purple-600" />
          <circle cx="60" cy="20" r="2" className="fill-current text-purple-600" />
          <circle cx="80" cy="25" r="2" className="fill-current text-purple-600" />
          <circle cx="100" cy="10" r="2" className="fill-current text-purple-600" />
        </svg>
      </div>
      <div className="h-6 mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
    </div>
  );
};
const CategoryChart = ({ events }) => {
  if (!events.length) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        <FiPieChart className="mx-auto h-12 w-12 mb-2" />
        <p>No category data available</p>
      </div>
    );
  }

  const categories = events.reduce((acc, event) => {
    const category = event.category?.toLowerCase() || 'other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const total = events.length;
  const radius = 60;
  const center = 75;
  const colors = [
    '#f87171', '#60a5fa', '#34d399',
    '#fbbf24', '#c084fc', '#f472b6',
  ];

  let cumulativeAngle = 0;

  const categoryData = Object.entries(categories).map(([label, count], index) => {
    const percentage = count / total;
    const angle = percentage * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    const color = colors[index % colors.length];
    cumulativeAngle += angle;

    return { label, count, percentage, startAngle, endAngle, color };
  });

  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${x} ${y}`,
      `Z`,
    ].join(' ');
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full items-center justify-center gap-8">
      <motion.svg
        width={150}
        height={150}
        viewBox="0 0 150 150"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {categoryData.map((cat, i) => (
          <motion.path
            key={cat.label}
            d={describeArc(center, center, radius, cat.startAngle, cat.endAngle)}
            fill={cat.color}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.2 }}
          />
        ))}
        {/* Inner circle for donut effect */}
        <circle cx={center} cy={center} r={radius - 20} fill="white" className="dark:fill-dark-700" />
      </motion.svg>

      {/* Legend */}
      <div className="flex flex-col space-y-2">
        {categoryData.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 + 0.6 }}
            className="flex items-center space-x-2"
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
            <span className="text-sm text-gray-800 dark:text-gray-200 capitalize">
              {cat.label} — {cat.count} ({Math.round(cat.percentage * 100)}%)
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default Dashboard; 