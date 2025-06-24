const express = require('express');
const { body } = require('express-validator');
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const ticketController = require('../controllers/ticket.controller');

const router = express.Router();

// @route   GET /api/tickets/user
// @desc    Get tickets purchased by the current user
// @access  Private
router.get('/user', protect, ticketController.getUserTickets);

// @route   GET /api/tickets/event/:eventId
// @desc    Get tickets for an event (for event organizers)
// @access  Private
router.get('/event/:eventId', protect, ticketController.getEventTickets);

// @route   GET /api/tickets/:ticketId
// @desc    Get ticket by ID
// @access  Private
router.get('/:ticketId', protect, ticketController.getTicketById);

// @route   POST /api/tickets/purchase
// @desc    Purchase tickets for an event
// @access  Private
router.post(
  '/purchase',
  [
    body('eventId').not().isEmpty().withMessage('Event ID is required'),
    body('ticketTypeId').not().isEmpty().withMessage('Ticket type ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  protect,
  ticketController.purchaseTickets
);

// @route   PUT /api/tickets/:ticketId/cancel
// @desc    Cancel a ticket
// @access  Private
router.put('/:ticketId/cancel', protect, ticketController.cancelTicket);

// @route   PUT /api/tickets/:ticketId/check-in
// @desc    Check in a ticket
// @access  Private
router.put('/:ticketId/check-in', protect, ticketController.checkInTicket);

// @route   GET /api/tickets/verify/:ticketNumber
// @desc    Verify ticket validity
// @access  Public
router.get('/verify/:ticketNumber', ticketController.verifyTicket);

// @route   GET /api/tickets/:ticketId/download
// @desc    Download ticket as PDF
// @access  Private
router.get('/:ticketId/download', protect, ticketController.downloadTicket);

// @route   POST /api/tickets/:ticketId/share
// @desc    Share ticket via email
// @access  Private
router.post(
  '/:ticketId/share',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  protect,
  ticketController.shareTicket
);

// @route   DELETE /api/tickets/:ticketId
// @desc    Delete a ticket
// @access  Private
router.delete('/:ticketId', protect, ticketController.deleteTicket);

module.exports = router; 