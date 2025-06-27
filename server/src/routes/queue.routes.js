const express = require('express');
const { body } = require('express-validator');
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const queueController = require('../controllers/queue.controller');

const router = express.Router();

// @route   POST /api/queue/join
// @desc    Join a ticket purchase queue
// @access  Public (with optional authentication)
router.post(
  '/join',
  [
    body('eventId').not().isEmpty().withMessage('Event ID is required'),
    body('email').optional().isEmail().withMessage('Valid email is required for guest users'),
    body('name').optional().isString().withMessage('Name must be a string'),
  ],
  optionalProtect,
  queueController.joinQueue
);

// @route   GET /api/queue/position/:eventId
// @desc    Check position in queue
// @access  Public (with optional authentication)
router.get(
  '/position/:eventId',
  optionalProtect,
  queueController.checkPosition
);

// @route   POST /api/queue/next/:eventId
// @desc    Get next user in queue (for processing)
// @access  Private (Admin only)
router.post(
  '/next/:eventId',
  protect,
  queueController.getNextInQueue
);

// @route   POST /api/queue/complete/:eventId
// @desc    Complete processing for a user
// @access  Private (Admin or self)
router.post(
  '/complete/:eventId',
  [
    body('userId').not().isEmpty().withMessage('User ID is required'),
  ],
  protect,
  queueController.completeProcessing
);

// @route   GET /api/queue/status/:eventId
// @desc    Get queue status for an event
// @access  Private (Admin only)
router.get(
  '/status/:eventId',
  protect,
  queueController.getQueueStatus
);

module.exports = router; 