/**
 * Queue System for Ticket Purchases
 * Manages a queue of users waiting to purchase tickets
 */

// Queue storage - In a production environment, this should be in Redis or a similar store
const ticketQueues = {};
let lastQueueId = 1000; // Starting queue ID
let io; // Socket.io instance

/**
 * Set the Socket.io instance for real-time updates
 * @param {Object} socketIo - Socket.io server instance
 */
const setSocketIo = (socketIo) => {
  io = socketIo;
};

/**
 * Send queue update to all clients for a specific event
 * @param {string} eventId - The ID of the event
 */
const emitQueueUpdate = (eventId) => {
  if (!io) return;
  
  const status = getQueueStatus(eventId);
  io.to(`queue:${eventId}`).emit('queue:update', {
    eventId,
    queueLength: status.total,
    timestamp: Date.now()
  });
};

/**
 * Initialize a queue for an event if it doesn't exist
 * @param {string} eventId - The ID of the event
 */
const initializeQueue = (eventId) => {
  if (!ticketQueues[eventId]) {
    ticketQueues[eventId] = {
      queue: [],
      processing: new Map(), // Map of users currently in the purchase process with timestamps
      lastActivity: Date.now()
    };
  }
};

/**
 * Add a user to the queue for an event
 * @param {string} eventId - The ID of the event
 * @param {string} userId - The ID of the user (can be anonymous ID for unauthenticated users)
 * @param {Object} userData - Additional user data (e.g., email, name for anonymous users)
 * @returns {Object} - Queue information including position and queueId
 */
const addToQueue = (eventId, userId, userData = {}) => {
  initializeQueue(eventId);
  
  // Check if user is already in queue
  const existingIndex = ticketQueues[eventId].queue.findIndex(item => 
    item.userId === userId || (userData.email && item.userData.email === userData.email)
  );
  
  if (existingIndex !== -1) {
    // User is already in queue, return their position
    return {
      queueId: ticketQueues[eventId].queue[existingIndex].queueId,
      position: existingIndex + 1,
      total: ticketQueues[eventId].queue.length,
      isProcessing: false
    };
  }
  
  // Check if user is already processing a purchase
  if (ticketQueues[eventId].processing.has(userId)) {
    // Update the timestamp to prevent timeout
    ticketQueues[eventId].processing.set(userId, {
      timestamp: Date.now(),
      userData
    });
    
    return {
      queueId: userId,
      position: 0,
      total: ticketQueues[eventId].queue.length,
      isProcessing: true
    };
  }
  
  // Generate a unique queue ID
  const queueId = `q-${lastQueueId++}`;
  
  // Add user to queue
  ticketQueues[eventId].queue.push({
    userId,
    queueId,
    userData,
    joinedAt: Date.now()
  });
  
  // Update last activity
  ticketQueues[eventId].lastActivity = Date.now();
  
  // Emit queue update
  emitQueueUpdate(eventId);
  
  return {
    queueId,
    position: ticketQueues[eventId].queue.length,
    total: ticketQueues[eventId].queue.length,
    isProcessing: false
  };
};

/**
 * Get the next user in the queue for an event
 * @param {string} eventId - The ID of the event
 * @returns {Object|null} - The next user in the queue or null if queue is empty
 */
const getNextInQueue = (eventId) => {
  if (!ticketQueues[eventId] || ticketQueues[eventId].queue.length === 0) {
    return null;
  }
  
  const nextUser = ticketQueues[eventId].queue.shift();
  ticketQueues[eventId].processing.set(nextUser.userId, {
    timestamp: Date.now(),
    userData: nextUser.userData
  });
  
  // Update last activity
  ticketQueues[eventId].lastActivity = Date.now();
  
  // Emit queue update
  emitQueueUpdate(eventId);
  
  return nextUser;
};

/**
 * Mark a user as done with their purchase
 * @param {string} eventId - The ID of the event
 * @param {string} userId - The ID of the user
 */
const completeProcessing = (eventId, userId) => {
  if (ticketQueues[eventId] && ticketQueues[eventId].processing.has(userId)) {
    ticketQueues[eventId].processing.delete(userId);
    
    // Update last activity
    ticketQueues[eventId].lastActivity = Date.now();
    
    // Emit queue update
    emitQueueUpdate(eventId);
    
    return true;
  }
  return false;
};

/**
 * Check a user's position in the queue
 * @param {string} eventId - The ID of the event
 * @param {string} identifier - The user ID or queue ID
 * @returns {Object} - Queue information including position
 */
const checkQueuePosition = (eventId, identifier) => {
  if (!ticketQueues[eventId]) {
    return { position: -1, total: 0, isProcessing: false };
  }
  
  // Check if user is currently processing
  if (ticketQueues[eventId].processing.has(identifier)) {
    // Update the timestamp to prevent timeout
    const userData = ticketQueues[eventId].processing.get(identifier).userData;
    ticketQueues[eventId].processing.set(identifier, {
      timestamp: Date.now(),
      userData
    });
    
    return {
      position: 0,
      total: ticketQueues[eventId].queue.length,
      isProcessing: true
    };
  }
  
  // Find user in queue by userId or queueId
  const position = ticketQueues[eventId].queue.findIndex(item => 
    item.userId === identifier || item.queueId === identifier
  );
  
  if (position !== -1) {
    return {
      position: position + 1,
      total: ticketQueues[eventId].queue.length,
      isProcessing: false,
      queueId: ticketQueues[eventId].queue[position].queueId
    };
  }
  
  return { position: -1, total: ticketQueues[eventId].queue.length, isProcessing: false };
};

/**
 * Get all users in a queue for an event
 * @param {string} eventId - The ID of the event
 * @returns {Array} - Array of users in the queue
 */
const getQueueStatus = (eventId) => {
  if (!ticketQueues[eventId]) {
    return { queue: [], processing: [], total: 0 };
  }
  
  return {
    queue: ticketQueues[eventId].queue,
    processing: Array.from(ticketQueues[eventId].processing.keys()),
    total: ticketQueues[eventId].queue.length + ticketQueues[eventId].processing.size
  };
};

/**
 * Check for users who have been processing for too long and move them back to the end of the queue
 * or remove them from processing
 */
const checkProcessingTimeouts = () => {
  const now = Date.now();
  const oneMinuteMs = 60 * 1000; // 1 minute timeout
  
  Object.keys(ticketQueues).forEach(eventId => {
    const queue = ticketQueues[eventId];
    if (!queue.processing) return;
    
    Array.from(queue.processing.entries()).forEach(([userId, data]) => {
      if (now - data.timestamp > oneMinuteMs) {
        console.log(`User ${userId} timed out in processing for event ${eventId}`);
        
        // Remove from processing
        queue.processing.delete(userId);
        
        // If there are users waiting, move the next one to processing
        if (queue.queue.length > 0) {
          const nextUser = queue.queue.shift();
          queue.processing.set(nextUser.userId, {
            timestamp: now,
            userData: nextUser.userData
          });
          
          // Emit queue update
          emitQueueUpdate(eventId);
        }
      }
    });
  });
};

/**
 * Clean up inactive queues (older than 24 hours)
 */
const cleanupInactiveQueues = () => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  Object.keys(ticketQueues).forEach(eventId => {
    if (now - ticketQueues[eventId].lastActivity > oneDayMs) {
      delete ticketQueues[eventId];
    }
  });
};

// Run processing timeout check every 10 seconds
setInterval(checkProcessingTimeouts, 10 * 1000);

// Run cleanup every hour
setInterval(cleanupInactiveQueues, 60 * 60 * 1000);

module.exports = {
  addToQueue,
  getNextInQueue,
  completeProcessing,
  checkQueuePosition,
  getQueueStatus,
  setSocketIo
}; 