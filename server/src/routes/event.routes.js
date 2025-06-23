const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/events
 * @desc    Get all events
 * @access  Public
 */
router.get('/', eventController.getEvents);

/**
 * @route   GET /api/events/featured
 * @desc    Get featured events
 * @access  Public
 */
router.get('/featured', eventController.getFeaturedEvents);

/**
 * @route   GET /api/events/categories
 * @desc    Get event categories
 * @access  Public
 */
router.get('/categories', eventController.getEventCategories);

/**
 * @route   GET /api/events/search
 * @desc    Search events
 * @access  Public
 */
router.get('/search', eventController.searchEvents);

/**
 * @route   GET /api/events/user
 * @desc    Get events created by the current user
 * @access  Private
 */
router.get('/user', protect, eventController.getUserEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get event by ID
 * @access  Public
 */
router.get('/:id', eventController.getEventById);

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private
 */
router.post(
  '/',
  protect,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('shortDescription', 'Short description is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty(),
    check('featuredImage', 'Featured image is required').not().isEmpty(),
    check('ticketTypes', 'At least one ticket type is required').isArray({ min: 1 }),
  ],
  eventController.createEvent
);

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event
 * @access  Private
 */
router.put('/:id', protect, eventController.updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event
 * @access  Private
 */
router.delete('/:id', protect, eventController.deleteEvent);

/**
 * @route   PUT /api/events/:id/publish
 * @desc    Publish an event
 * @access  Private
 */
router.put('/:id/publish', protect, eventController.publishEvent);

/**
 * @route   PUT /api/events/:id/cancel
 * @desc    Cancel an event
 * @access  Private
 */
router.put('/:id/cancel', protect, eventController.cancelEvent);

/**
 * @route   POST /api/events/:id/ticket-types
 * @desc    Add a ticket type to an event
 * @access  Private
 */
router.post(
  '/:id/ticket-types',
  protect,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('price', 'Price is required').isNumeric(),
    check('quantity', 'Quantity is required').isNumeric(),
  ],
  eventController.addTicketType
);

/**
 * @route   PUT /api/events/:id/ticket-types/:typeId
 * @desc    Update a ticket type
 * @access  Private
 */
router.put('/:id/ticket-types/:typeId', protect, eventController.updateTicketType);

/**
 * @route   DELETE /api/events/:id/ticket-types/:typeId
 * @desc    Delete a ticket type
 * @access  Private
 */
router.delete('/:id/ticket-types/:typeId', protect, eventController.deleteTicketType);

module.exports = router; 