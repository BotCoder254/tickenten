import api from './api';
import { io } from 'socket.io-client';

// Create socket instance
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
  withCredentials: true,
  autoConnect: false
});

// Queue of event listeners waiting for socket connection
const eventQueue = [];

// Connect socket when needed
const ensureSocketConnected = () => {
  if (!socket.connected) {
    socket.connect();
    
    // Process any queued events once connected
    socket.on('connect', () => {
      eventQueue.forEach(({ event, callback }) => {
        socket.on(event, callback);
      });
      eventQueue.length = 0; // Clear queue
    });
  }
};

/**
 * Queue service for handling ticket purchase queue operations
 */
const queueService = {
  /**
   * Subscribe to real-time queue updates for an event
   * @param {string} eventId - Event ID
   * @param {Function} callback - Callback function to be called when updates are received
   * @returns {Function} - Unsubscribe function
   */
  subscribeToQueueUpdates: (eventId, callback) => {
    ensureSocketConnected();
    
    // Join the queue room
    socket.emit('queue:join', eventId);
    
    // Register event handler
    const handleUpdate = (data) => {
      if (data.eventId === eventId) {
        callback(data);
      }
    };
    
    // If socket is connected, add listener immediately
    if (socket.connected) {
      socket.on('queue:update', handleUpdate);
    } else {
      // Otherwise queue it for when connection is established
      eventQueue.push({ event: 'queue:update', callback: handleUpdate });
    }
    
    // Return unsubscribe function
    return () => {
      socket.off('queue:update', handleUpdate);
      socket.emit('queue:leave', eventId);
    };
  },

  /**
   * Join a ticket purchase queue
   * @param {string} eventId - Event ID
   * @param {Object} userData - Optional user data for unauthenticated users
   * @returns {Promise} - API response with queue position
   */
  joinQueue: async (eventId, userData = {}) => {
    try {
      // Check if we have a stored queueId for this event
      const storedQueueId = localStorage.getItem(`queue_${eventId}`);
      if (storedQueueId) {
        userData.queueId = storedQueueId;
      }
      
      const response = await api.post('/queue/join', {
        eventId,
        ...userData
      }, { withCredentials: true }); // Enable cookies
      
      // Store the queueId in localStorage for persistence
      if (response.data && response.data.success && response.data.data && response.data.data.queueId) {
        localStorage.setItem(`queue_${eventId}`, response.data.data.queueId);
      }
      
      // Ensure socket is connected for real-time updates
      ensureSocketConnected();
      socket.emit('queue:join', eventId);
      
      return response.data;
    } catch (error) {
      console.error('Error joining queue:', error);
      throw error;
    }
  },

  /**
   * Check position in queue
   * @param {string} eventId - Event ID
   * @param {string} queueId - Optional queue ID for unauthenticated users
   * @returns {Promise} - API response with queue position
   */
  checkPosition: async (eventId, queueId = null) => {
    try {
      const url = `/queue/position/${eventId}`;
      const config = { withCredentials: true }; // Enable cookies
      
      // Try to get queueId from params, then localStorage if not provided
      let queueIdToUse = queueId;
      if (!queueIdToUse) {
        queueIdToUse = localStorage.getItem(`queue_${eventId}`);
      }
      
      // Add queueId as query param if available
      if (queueIdToUse) {
        config.params = { queueId: queueIdToUse };
      }
      
      const response = await api.get(url, config);
      
      // Store queueId if it's in the response and not already stored
      if (response.data && response.data.success && response.data.data && response.data.data.queueId) {
        localStorage.setItem(`queue_${eventId}`, response.data.data.queueId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error checking queue position:', error);
      
      // Return a more informative error object
      return { 
        success: false, 
        data: { 
          position: -1, 
          total: 0, 
          isProcessing: false,
          error: error.message || 'Network error when checking queue position'
        } 
      };
    }
  },

  /**
   * Complete processing (for authenticated users only)
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Promise} - API response
   */
  completeProcessing: async (eventId, userId) => {
    try {
      const response = await api.post(`/queue/complete/${eventId}`, { userId });
      
      // Clear the stored queueId when processing is complete
      localStorage.removeItem(`queue_${eventId}`);
      
      // Leave the queue room
      socket.emit('queue:leave', eventId);
      
      return response.data;
    } catch (error) {
      console.error('Error completing processing:', error);
      throw error;
    }
  },
  
  /**
   * Disconnect socket when app is unmounted
   */
  disconnect: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  }
};

export default queueService; 