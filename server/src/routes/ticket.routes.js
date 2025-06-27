const express = require('express');
const { body } = require('express-validator');
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const ticketController = require('../controllers/ticket.controller');

const router = express.Router();

// @route   GET /api/tickets/user
// @desc    Get tickets purchased by the current user
// @access  Private
router.get('/user', protect, ticketController.getUserTickets);

// @route   GET /api/tickets/user/resale-listings
// @desc    Get tickets listed for resale by the current user
// @access  Private
router.get('/user/resale-listings', protect, ticketController.getUserResaleListings);

// @route   GET /api/tickets/user/resale-sold
// @desc    Get tickets sold by the user through resale
// @access  Private
router.get('/user/resale-sold', protect, ticketController.getUserResaleSold);

// @route   GET /api/tickets/event/:eventId
// @desc    Get tickets for an event (for event organizers)
// @access  Private
router.get('/event/:eventId', protect, ticketController.getEventTickets);

// @route   GET /api/tickets/verify/:ticketNumber
// @desc    Verify ticket validity
// @access  Public
router.get('/verify/:ticketNumber', ticketController.verifyTicket);

// Ticket Resale Routes

// @route   GET /api/tickets/resale-listings
// @desc    Get available resale tickets
// @access  Public
router.get('/resale-listings', ticketController.getResaleTickets);

// @route   POST /api/tickets/resale/:ticketId/purchase
// @desc    Purchase a resale ticket
// @access  Private
router.post(
  '/resale/:ticketId/purchase',
  [
    body('paymentMethod').not().isEmpty().withMessage('Payment method is required'),
    body('paymentReference').not().isEmpty().withMessage('Payment reference is required'),
  ],
  protect,
  ticketController.purchaseResaleTicket
);

// @route   POST /api/tickets/purchase
// @desc    Purchase tickets for an event
// @access  Public (with optional authentication)
router.post(
  '/purchase',
  [
    body('eventId').not().isEmpty().withMessage('Event ID is required'),
    body('ticketTypeId').not().isEmpty().withMessage('Ticket type ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('attendeeInfo').optional().isObject().withMessage('Attendee info must be an object'),
    body('paymentMethod').optional().isString().withMessage('Payment method must be a string'),
    body('paymentReference').optional().isString().withMessage('Payment reference must be a string'),
    body('paymentCurrency').optional().isString().withMessage('Payment currency must be a string'),
    body('paymentTransaction').optional()
  ],
  optionalProtect,
  ticketController.purchaseTickets
);

// @route   GET /api/tickets/:ticketId
// @desc    Get ticket by ID
// @access  Private
router.get('/:ticketId', protect, ticketController.getTicketById);

// @route   PUT /api/tickets/:ticketId/cancel
// @desc    Cancel a ticket
// @access  Private
router.put('/:ticketId/cancel', protect, ticketController.cancelTicket);

// @route   PUT /api/tickets/:ticketId/check-in
// @desc    Check in a ticket
// @access  Private
router.put('/:ticketId/check-in', protect, ticketController.checkInTicket);

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

// @route   POST /api/tickets/:ticketId/resale
// @desc    List a ticket for resale
// @access  Private
router.post(
  '/:ticketId/resale',
  [
    body('resalePrice').isNumeric().withMessage('Resale price must be a number'),
    body('description').optional().isString().withMessage('Description must be a string'),
  ],
  protect,
  ticketController.listTicketForResale
);

// @route   DELETE /api/tickets/:ticketId/resale
// @desc    Cancel a ticket resale listing
// @access  Private
router.delete('/:ticketId/resale', protect, ticketController.cancelTicketResale);

module.exports = router; 