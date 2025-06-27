const { validationResult } = require('express-validator');
const queueSystem = require('../utils/queueSystem');
const crypto = require('crypto');

/**
 * @desc    Join a ticket purchase queue
 * @route   POST /api/queue/join
 * @access  Public
 */
exports.joinQueue = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required',
      });
    }
    
    let userId;
    let userData = {};
    
    // For authenticated users, use their user ID
    if (req.user) {
      userId = req.user.id;
      userData = {
        name: req.user.name,
        email: req.user.email
      };
    } else {
      // For unauthenticated users, generate a temporary ID and store their info
      userId = req.body.queueId || `anon-${crypto.randomBytes(8).toString('hex')}`;
      userData = {
        name: req.body.name || 'Guest',
        email: req.body.email || null
      };
    }
    
    // Add user to queue
    const queueInfo = queueSystem.addToQueue(eventId, userId, userData);
    
    // Set a cookie with the queue ID for anonymous users
    if (!req.user) {
      res.cookie('ticketQueueId', queueInfo.queueId, {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Added to queue successfully',
      data: {
        queueId: queueInfo.queueId,
        position: queueInfo.position,
        total: queueInfo.total,
        isProcessing: queueInfo.isProcessing,
        userId
      }
    });
  } catch (error) {
    console.error('Join queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Check position in queue
 * @route   GET /api/queue/position/:eventId
 * @access  Public
 */
exports.checkPosition = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    let identifier;
    
    // For authenticated users, use their user ID
    if (req.user) {
      identifier = req.user.id;
    } else {
      // For unauthenticated users, get the queue ID from query params or cookies
      identifier = req.query.queueId || req.cookies.ticketQueueId;
      
      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Queue ID is required for unauthenticated users',
        });
      }
    }
    
    // Check position in queue
    const queueInfo = queueSystem.checkQueuePosition(eventId, identifier);
    
    res.status(200).json({
      success: true,
      data: {
        position: queueInfo.position,
        total: queueInfo.total,
        isProcessing: queueInfo.isProcessing,
        queueId: queueInfo.queueId || identifier
      }
    });
  } catch (error) {
    console.error('Check queue position error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get next user in queue (for processing)
 * @route   POST /api/queue/next/:eventId
 * @access  Private (Admin only)
 */
exports.getNextInQueue = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if user is admin (you should implement proper authorization)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access queue management',
      });
    }
    
    // Get next user in queue
    const nextUser = queueSystem.getNextInQueue(eventId);
    
    if (!nextUser) {
      return res.status(404).json({
        success: false,
        message: 'Queue is empty',
      });
    }
    
    res.status(200).json({
      success: true,
      data: nextUser
    });
  } catch (error) {
    console.error('Get next in queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Complete processing for a user
 * @route   POST /api/queue/complete/:eventId
 * @access  Private (Admin or self)
 */
exports.completeProcessing = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    // Check if user is admin or the user themselves
    if (!req.user || (req.user.id !== userId && !req.user.isAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this processing',
      });
    }
    
    // Complete processing
    const completed = queueSystem.completeProcessing(eventId, userId);
    
    if (!completed) {
      return res.status(404).json({
        success: false,
        message: 'User not found in processing queue',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Processing completed successfully'
    });
  } catch (error) {
    console.error('Complete processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get queue status for an event
 * @route   GET /api/queue/status/:eventId
 * @access  Private (Admin only)
 */
exports.getQueueStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if user is admin (you should implement proper authorization)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access queue status',
      });
    }
    
    // Get queue status
    const status = queueSystem.getQueueStatus(eventId);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}; 