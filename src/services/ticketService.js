import api from './api';

/**
 * Ticket service for handling ticket-related operations
 */
const ticketService = {
  /**
   * Get tickets for an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response with tickets data
   */
  getEventTickets: async (eventId) => {
    try {
      const response = await api.get(`/tickets/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get tickets purchased by the current user
   * @returns {Promise} - API response with user's tickets
   */
  getUserTickets: async () => {
    try {
      const response = await api.get('/tickets/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Purchase tickets for an event
   * @param {Object} ticketData - Ticket purchase data
   * @param {Object} paymentInfo - Optional payment information from Paystack
   * @returns {Promise} - API response with purchase confirmation
   */
  purchaseTickets: async (ticketData, paymentInfo = null) => {
    try {
      // If payment info is provided, add it to the ticket data
      let purchaseData = { ...ticketData };
      
      // Add phone number if provided in guest info
      if (ticketData.attendeeInfo && ticketData.attendeeInfo.phoneNumber) {
        purchaseData.phoneNumber = ticketData.attendeeInfo.phoneNumber;
      }
      
      // Add payment info if provided (for paid tickets)
      if (paymentInfo) {
        purchaseData = {
          ...purchaseData,
          paymentMethod: `Paystack - ${paymentInfo.currency || 'USD'}`,
          paymentReference: paymentInfo.reference,
          paymentTransaction: paymentInfo.trans,
          paymentCurrency: paymentInfo.currency || 'USD'
        };
      } else {
        // For free tickets, add a flag to indicate it's free
        purchaseData = {
          ...purchaseData,
          paymentMethod: 'Free Ticket',
          paymentReference: 'FREE-TICKET-' + Date.now(),
          paymentCurrency: 'USD',
          isFreeTicket: true
        };
      }
      
      console.log('Sending ticket purchase request:', purchaseData);
      const response = await api.post('/tickets/purchase', purchaseData);
      return response.data;
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      throw error;
    }
  },

  /**
   * Purchase tickets as a guest (without authentication)
   * @param {Object} ticketData - Ticket purchase data including attendee information
   * @param {Object} paymentInfo - Optional payment information from Paystack
   * @returns {Promise} - API response with purchase confirmation
   */
  guestPurchaseTickets: async (ticketData, paymentInfo = null) => {
    // Make sure attendee info is provided for guest purchases
    if (!ticketData.attendeeInfo || !ticketData.attendeeInfo.name || !ticketData.attendeeInfo.email || !ticketData.attendeeInfo.phoneNumber) {
      throw new Error('Name, email, and phone number are required for guest ticket purchases');
    }
    
    // Validate phone number
    if (ticketData.attendeeInfo.phoneNumber.trim() === '') {
      throw new Error('Please provide a valid phone number');
    }

    try {
      // If payment info is provided, add it to the ticket data
      let purchaseData = { ...ticketData };
      
      // Add payment info if provided (for paid tickets)
      if (paymentInfo) {
        purchaseData = {
          ...purchaseData,
          paymentMethod: `Paystack - ${paymentInfo.currency || 'USD'}`,
          paymentReference: paymentInfo.reference,
          paymentTransaction: paymentInfo.trans,
          paymentCurrency: paymentInfo.currency || 'USD'
        };
      } else {
        // For free tickets, add a flag to indicate it's free
        purchaseData = {
          ...purchaseData,
          paymentMethod: 'Free Ticket',
          paymentReference: 'FREE-TICKET-GUEST-' + Date.now(),
          paymentCurrency: 'USD',
          isFreeTicket: true
        };
      }
      
      console.log('Sending guest ticket purchase request:', purchaseData);
      const response = await api.post('/tickets/purchase', purchaseData);
      return response.data;
    } catch (error) {
      console.error('Error purchasing guest tickets:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      throw error;
    }
  },

  /**
   * Get ticket by ID
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} - API response with ticket data
   */
  getTicketById: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel a ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} - API response
   */
  cancelTicket: async (ticketId) => {
    try {
      const response = await api.put(`/tickets/${ticketId}/cancel`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} - API response
   */
  deleteTicket: async (ticketId) => {
    try {
      // Verify token exists before attempting deletion
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in to delete tickets.');
      }
      
      const response = await api.delete(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Delete ticket error:', error);
      // Provide more specific error messages based on response
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication required. Please log in again to delete this ticket.');
        } else if (error.response.status === 403) {
          throw new Error('You are not authorized to delete this ticket.');
        } else if (error.response.status === 404) {
          throw new Error('Ticket not found. It may have been already deleted.');
        } else {
          throw new Error(error.response.data?.message || 'Failed to delete ticket. Please try again.');
        }
      }
      throw error;
    }
  },

  /**
   * Check in a ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} - API response
   */
  checkInTicket: async (ticketId) => {
    try {
      const response = await api.put(`/tickets/${ticketId}/check-in`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify ticket validity
   * @param {string} ticketNumber - Ticket number
   * @returns {Promise} - API response with verification result
   */
  verifyTicket: async (ticketNumber) => {
    try {
      const response = await api.get(`/tickets/verify/${ticketNumber}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Download ticket as PDF
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} - API response with PDF data
   */
  downloadTicket: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Share ticket via email
   * @param {string} ticketId - Ticket ID
   * @param {Object} emailData - Email data with recipient
   * @returns {Promise} - API response
   */
  shareTicket: async (ticketId, emailData) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/share`, emailData);
      return response.data;
    } catch (error) {
      console.error('Error sharing ticket:', error);
      throw error;
    }
  },

  /**
   * List a ticket for resale
   * @param {string} ticketId - Ticket ID
   * @param {Object} resaleData - Resale data including price and description
   * @returns {Promise} - API response
   */
  listTicketForResale: async (ticketId, resaleData) => {
    try {
      console.log(`Attempting to list ticket for resale: ${ticketId}`, resaleData);
      // Remove the /api prefix since axios instance already has it configured
      const response = await api.post(`/tickets/${ticketId}/resale`, resaleData);
      return response.data;
    } catch (error) {
      console.error('Error listing ticket for resale:', error);
      
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('You must be logged in to resell tickets');
        } else if (error.response.status === 403) {
          throw new Error('You are not authorized to resell this ticket');
        } else if (error.response.status === 400) {
          throw new Error(error.response.data?.message || 'Invalid resale data. Please check your inputs.');
        } else if (error.response.status === 404) {
          throw new Error('Ticket not found');
        } else if (error.response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      throw error;
    }
  },

  /**
   * Cancel a ticket resale listing
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} - API response
   */
  cancelTicketResale: async (ticketId) => {
    try {
      console.log(`Attempting to cancel ticket resale: ${ticketId}`);
      // Remove the /api prefix since axios instance already has it configured
      const response = await api.delete(`/tickets/${ticketId}/resale`);
      return response.data;
    } catch (error) {
      console.error('Error canceling ticket resale:', error);
      
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('You must be logged in to manage resale listings');
        } else if (error.response.status === 403) {
          throw new Error('You are not authorized to cancel this resale listing');
        } else if (error.response.status === 404) {
          throw new Error('Ticket not found or not listed for resale');
        } else if (error.response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      throw error;
    }
  },

  /**
   * Get available resale tickets
   * @param {Object} filters - Optional filters (eventId, minPrice, maxPrice)
   * @returns {Promise} - API response with resale tickets
   */
  getResaleTickets: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.eventId) {
        queryParams.append('eventId', filters.eventId);
      }
      
      if (filters.minPrice) {
        queryParams.append('minPrice', filters.minPrice);
      }
      
      if (filters.maxPrice) {
        queryParams.append('maxPrice', filters.maxPrice);
      }
      
      const queryString = queryParams.toString();
      // Remove the /api prefix since axios instance already has it configured
      const url = `/tickets/resale-listings${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching resale tickets from URL:', url);
      const response = await api.get(url);
      
      if (!response.data || !response.data.success) {
        console.warn('Resale tickets API returned unsuccessful response:', response.data);
        return { data: [] };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting resale tickets:', error);
      // Return empty data array instead of throwing to prevent UI crashes
      return { data: [] };
    }
  },

  /**
   * Get user's resale listings
   * @returns {Promise} - API response with user's resale listings
   */
  getUserResaleListings: async () => {
    try {
      console.log('Fetching user resale listings...');
      
      // Check if user is authenticated before making the request
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('User is not authenticated, cannot fetch resale listings');
        return { success: true, data: [] };
      }
      
      // Make the API request with retry logic
      let retries = 0;
      const maxRetries = 2;
      let response;
      
      while (retries <= maxRetries) {
        try {
          response = await api.get('/tickets/user/resale-listings');
          console.log('User resale listings response received:', response);
          break; // Success, exit retry loop
        } catch (err) {
          retries++;
          if (retries > maxRetries) {
            throw err; // Max retries reached, propagate error
          }
          console.log(`Retry attempt ${retries} for resale listings...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      console.log('User resale listings response data:', response.data);
      
      // Validate the response data
      if (!response.data.success) {
        console.warn('API returned unsuccessful response:', response.data);
      }
      
      // Ensure we always return an array for data
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.warn('API returned non-array data, using empty array instead:', response.data.data);
        response.data.data = [];
      }
      
      // Log the number of resale listings
      console.log(`Found ${response.data.data.length} resale listings`);
      
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error getting user resale listings:', error);
      // Check for specific error types
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      return { success: true, data: [] };
    }
  },

  /**
   * Get user's sold resale tickets
   * @returns {Promise} - API response with user's sold resale tickets and revenue
   */
  getUserResaleSold: async () => {
    try {
      const response = await api.get('/tickets/user/resale-sold');
      return response.data;
    } catch (error) {
      console.error('Error getting user sold resale tickets:', error);
      return { data: [], totalRevenue: 0 };
    }
  },

  /**
   * Purchase a resale ticket
   * @param {string} resaleId - Resale listing ID
   * @param {Object} purchaseData - Purchase data including payment info
   * @returns {Promise} - API response with purchase confirmation
   */
  purchaseResaleTicket: async (resaleId, purchaseData) => {
    try {
      console.log(`Attempting to purchase resale ticket: ${resaleId}`);
      // Remove the /api prefix since axios instance already has it configured
      const response = await api.post(`/tickets/resale/${resaleId}/purchase`, purchaseData);
      return response.data;
    } catch (error) {
      console.error('Error purchasing resale ticket:', error);
      
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('You must be logged in to purchase resale tickets');
        } else if (error.response.status === 403) {
          throw new Error('You are not authorized to purchase this ticket');
        } else if (error.response.status === 400) {
          throw error; // Pass through validation errors
        } else if (error.response.status === 404) {
          throw new Error('The ticket you are trying to purchase is no longer available');
        } else if (error.response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
      }
      
      throw error;
    }
  }
};

export default ticketService; 