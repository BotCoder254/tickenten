import api from './api';

/**
 * Event service for handling event-related operations
 */
const eventService = {
  /**
   * Get all events with optional filters
   * @param {Object} filters - Query parameters for filtering events
   * @returns {Promise} - API response with events data
   */
  getEvents: async (filters = {}) => {
    try {
      const response = await api.get('/events', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get featured events
   * @param {number} limit - Number of events to return
   * @returns {Promise} - API response with featured events
   */
  getFeaturedEvents: async (limit = 4) => {
    try {
      const response = await api.get('/events/featured', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response with event data
   */
  getEventById: async (eventId) => {
    try {
      // Validate eventId format (MongoDB ObjectId is a 24-character hex string)
      if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
        throw {
          response: {
            status: 400,
            data: { message: 'Invalid event ID format' }
          }
        };
      }
      
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise} - API response with created event
   */
  createEvent: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an event
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise} - API response with updated event
   */
  updateEvent: async (eventId, eventData) => {
    try {
      const response = await api.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response
   */
  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get events created by the current user
   * @returns {Promise} - API response with user's events
   */
  getUserEvents: async () => {
    try {
      const response = await api.get('/events/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload event image
   * @param {string} eventId - Event ID
   * @param {FormData} formData - Form data with image
   * @param {Function} progressCallback - Optional callback for tracking upload progress
   * @returns {Promise} - API response with image URL
   */
  uploadEventImage: async (eventId, formData, progressCallback) => {
    try {
      const response = await api.post(`/events/${eventId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressCallback ? 
          (progressEvent) => progressCallback(progressEvent) : 
          undefined
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search events
   * @param {string} query - Search query
   * @returns {Promise} - API response with search results
   */
  searchEvents: async (query) => {
    try {
      const response = await api.get('/events/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Like/save an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response
   */
  likeEvent: async (eventId) => {
    try {
      const response = await api.post(`/events/${eventId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Unlike/unsave an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response
   */
  unlikeEvent: async (eventId) => {
    try {
      const response = await api.delete(`/events/${eventId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if user has liked an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response
   */
  checkLiked: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Publish an event
   * @param {string} eventId - Event ID
   * @returns {Promise} - API response
   */
  publishEvent: async (eventId) => {
    try {
      const response = await api.put(`/events/${eventId}/publish`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default eventService; 