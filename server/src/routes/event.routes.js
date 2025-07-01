const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { protect, optionalProtect } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

/**
 * @route   GET /api/events
 * @desc    Get all events
 * @access  Public
 */
router.get('/', optionalProtect, eventController.getEvents);

/**
 * @route   GET /api/events/featured
 * @desc    Get featured events
 * @access  Public
 */
router.get('/featured', optionalProtect, eventController.getFeaturedEvents);

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
router.get('/search', optionalProtect, eventController.searchEvents);

/**
 * @route   GET /api/events/user
 * @desc    Get events created by the current user
 * @access  Private
 */
router.get('/user', protect, eventController.getUserEvents);

/**
 * @route   GET /api/events/saved
 * @desc    Get events saved/liked by the current user
 * @access  Private
 */
router.get('/saved', protect, eventController.getSavedEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get event by ID
 * @access  Public
 */
router.get('/:id', optionalProtect, eventController.getEventById);

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

/**
 * @route   POST /api/events/:id/upload-image
 * @desc    Upload event image
 * @access  Private
 */
router.post(
  '/:id/upload-image',
  protect,
  upload.single('image'),
  eventController.uploadEventImage
);

/**
 * @route   GET /api/events/:id/like
 * @desc    Check if user has liked an event
 * @access  Private
 */
router.get('/:id/like', protect, eventController.checkEventLiked);

/**
 * @route   POST /api/events/:id/like
 * @desc    Like an event
 * @access  Private
 */
router.post('/:id/like', protect, eventController.likeEvent);

/**
 * @route   DELETE /api/events/:id/like
 * @desc    Unlike an event
 * @access  Private
 */
router.delete('/:id/like', protect, eventController.unlikeEvent);

module.exports = router; 