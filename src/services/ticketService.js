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
   * @returns {Promise} - API response with purchase confirmation
   */
  purchaseTickets: async (ticketData) => {
    try {
      const response = await api.post('/tickets/purchase', ticketData);
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