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
      console.log('getEvents called with filters:', filters);
      
      // Always ensure public visibility for unauthenticated users
      if (!localStorage.getItem('token')) {
        console.log('No authentication token found, ensuring public visibility');
        filters.visibility = 'public';
        filters.status = 'published';
      }
      
      console.log('Sending request with filters:', filters);
      const response = await api.get('/events', { params: filters });
      console.log('getEvents response:', response.data);
      
      // Handle empty response data
      if (!response.data || !response.data.data) {
        console.log('Empty response data from API');
        return {
          success: true,
          data: [],
          message: 'No events found',
          total: 0
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getEvents:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Return a standardized error response
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch events',
        error: error
      };
    }
  },

  /**
   * Get featured events
   * @param {number} limit - Number of events to return
   * @returns {Promise} - API response with featured events
   */
  getFeaturedEvents: async (limit = 4) => {
    try {
      console.log('getFeaturedEvents called with limit:', limit);
      
      // Try to get featured events from the API
      const response = await api.get('/events/featured', { params: { limit } });
      console.log('getFeaturedEvents response:', response.data);
      
      // Handle empty response data
      if (!response.data || !response.data.data || response.data.data.length === 0) {
        console.log('No featured events found, falling back to regular events');
        // Fall back to regular events
        return await eventService.getEvents({ 
          limit, 
          status: 'published',
          visibility: 'public',
          sort: 'startDate' // Sort by upcoming events
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getFeaturedEvents:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Try to get regular events as a fallback
      try {
        console.log('Falling back to getEvents due to featured events error');
        return await eventService.getEvents({ 
          limit, 
          status: 'published',
          visibility: 'public',
          sort: 'startDate' // Sort by upcoming events
        });
      } catch (fallbackError) {
        console.error('Fallback to getEvents also failed:', fallbackError);
      }
      
      // Return a standardized error response instead of throwing
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch featured events',
        error: error
      };
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
      // Make sure query is not empty
      if (!query || query.trim() === '') {
        return {
          success: true,
          data: [],
          message: 'Please enter a search term',
          total: 0
        };
      }
      
      const response = await api.get('/events/search', { params: { q: query } });
      
      // Handle empty response data
      if (!response.data || !response.data.data) {
        return {
          success: true,
          data: [],
          message: 'No events found matching your search',
          total: 0
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in searchEvents:', error);
      
      // If search fails, try to get all events as a fallback
      try {
        console.log('Falling back to getEvents due to search error');
        const fallbackResponse = await api.get('/events', { 
          params: { limit: 20 } 
        });
        
        if (fallbackResponse && fallbackResponse.data && fallbackResponse.data.success) {
          return {
            success: true,
            data: fallbackResponse.data.data || [],
            message: 'Search unavailable, showing all events instead',
            total: fallbackResponse.data.count || 0,
            searchFallback: true
          };
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
      }
      
      // Return a standardized error response
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to search events',
        error: error
      };
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
   * Get all events liked/saved by the current user
   * @returns {Promise} - API response with saved events
   */
  getSavedEvents: async () => {
    try {
      const response = await api.get('/events/saved');
      return response.data;
    } catch (error) {
      console.error('Error fetching saved events:', error);
      // Return a standardized error response
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch saved events',
        error: error
      };
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