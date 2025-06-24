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
      
      if (paymentInfo) {
        purchaseData = {
          ...purchaseData,
          paymentMethod: `Paystack - ${paymentInfo.currency || 'USD'}`,
          paymentReference: paymentInfo.reference,
          paymentTransaction: paymentInfo.trans,
          paymentCurrency: paymentInfo.currency || 'USD'
        };
      }
      
      const response = await api.post('/tickets/purchase', purchaseData);
      return response.data;
    } catch (error) {
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
      
      if (paymentInfo) {
        purchaseData = {
          ...purchaseData,
          paymentMethod: `Paystack - ${paymentInfo.currency || 'USD'}`,
          paymentReference: paymentInfo.reference,
          paymentTransaction: paymentInfo.trans,
          paymentCurrency: paymentInfo.currency || 'USD'
        };
      }
      
      const response = await api.post('/tickets/purchase', purchaseData);
      return response.data;
    } catch (error) {
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
      throw error;
    }
  }
};

export default ticketService; 