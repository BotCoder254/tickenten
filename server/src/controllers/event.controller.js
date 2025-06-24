const { validationResult } = require('express-validator');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Public
 */
exports.getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const sort = {};

    // Sorting
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    // Filtering
    let filter = {};
    
    // If user is authenticated, show their draft events plus all published public events
    if (req.user) {
      filter = {
        $or: [
          { status: 'published', visibility: 'public' },
          { creator: req.user.id }
        ]
      };
    } else {
      // For unauthenticated users, only show published public events
      filter = { 
        status: 'published', 
        visibility: 'public' 
      };
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.startDate) {
      filter.startDate = { $gte: new Date(req.query.startDate) };
    }

    if (req.query.endDate) {
      filter.endDate = { $lte: new Date(req.query.endDate) };
    }

    // Location filtering
    if (req.query.city) {
      filter['location.city'] = { $regex: req.query.city, $options: 'i' };
    }

    if (req.query.country) {
      filter['location.country'] = { $regex: req.query.country, $options: 'i' };
    }

    // Virtual events filter
    if (req.query.isVirtual) {
      filter.isVirtual = req.query.isVirtual === 'true';
    }

    // Execute query
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort(sort)
      .limit(limit)
      .skip(startIndex)
      .populate('creator', 'name avatar');

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: events.length,
      pagination,
      data: events,
      total,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get featured events
 * @route   GET /api/events/featured
 * @access  Public
 */
exports.getFeaturedEvents = async (req, res) => {
  try {
    const featuredEvents = await Event.find({
      isFeatured: true,
      status: 'published',
      visibility: 'public',
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('creator', 'name avatar');

    res.status(200).json({
      success: true,
      count: featuredEvents.length,
      data: featuredEvents,
    });
  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get event categories
 * @route   GET /api/events/categories
 * @access  Public
 */
exports.getEventCategories = async (req, res) => {
  try {
    const categories = await Event.distinct('category');

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get event categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Search events
 * @route   GET /api/events/search
 * @access  Public
 */
exports.searchEvents = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Prepare the search query
    let searchQuery;
    
    // If user is authenticated, include their draft events in search results
    if (req.user) {
      searchQuery = {
        $and: [
          {
            $or: [
              { status: 'published', visibility: 'public' },
              { creator: req.user.id } // Include user's own events regardless of status
            ]
          },
          { $text: { $search: q } }
        ]
      };
    } else {
      // For unauthenticated users, only show published events
      searchQuery = {
        $and: [
          { status: 'published', visibility: 'public' },
          { $text: { $search: q } }
        ]
      };
    }

    const events = await Event.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .populate('creator', 'name avatar');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get events created by the current user
 * @route   GET /api/events/user
 * @access  Private
 */
exports.getUserEvents = async (req, res) => {
  try {
    const events = await Event.find({ creator: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
exports.getEventById = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format',
      });
    }

    const event = await Event.findById(req.params.id).populate(
      'creator',
      'name avatar email'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Allow viewing if:
    // 1. The event is published (public access)
    // 2. The requester is the creator of the event (regardless of status)
    const isCreator = req.user && event.creator && 
                    (event.creator._id.toString() === req.user.id);
    
    if (event.status !== 'published' && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this event',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private
 */
exports.createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    // Create event
    const event = new Event({
      ...req.body,
      creator: req.user.id,
    });

    await event.save();

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an event
 * @route   PUT /api/events/:id
 * @access  Private
 */
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    // Don't allow updating certain fields if event is published
    if (event.status === 'published') {
      const restrictedFields = ['status', 'ticketTypes'];
      const attemptedRestrictedUpdate = restrictedFields.some(
        (field) => req.body[field] !== undefined
      );

      if (attemptedRestrictedUpdate) {
        return res.status(400).json({
          success: false,
          message:
            'Cannot update status or ticket types directly for a published event',
        });
      }
    }

    // Update event
    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete an event
 * @route   DELETE /api/events/:id
 * @access  Private
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event',
      });
    }

    // Use findByIdAndDelete instead of remove()
    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Publish an event
 * @route   PUT /api/events/:id/publish
 * @access  Private
 */
exports.publishEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this event',
      });
    }

    // Check if event has at least one ticket type
    if (!event.ticketTypes || event.ticketTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Event must have at least one ticket type before publishing',
      });
    }

    // Update event status
    event.status = 'published';
    await event.save();

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Publish event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel an event
 * @route   PUT /api/events/:id/cancel
 * @access  Private
 */
exports.cancelEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this event',
      });
    }

    // Update event status
    event.status = 'cancelled';
    await event.save();

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a ticket type to an event
 * @route   POST /api/events/:id/ticket-types
 * @access  Private
 */
exports.addTicketType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add ticket types to this event',
      });
    }

    // Add ticket type
    event.ticketTypes.push(req.body);
    await event.save();

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Add ticket type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a ticket type
 * @route   PUT /api/events/:id/ticket-types/:typeId
 * @access  Private
 */
exports.updateTicketType = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update ticket types for this event',
      });
    }

    // Find ticket type index
    const ticketTypeIndex = event.ticketTypes.findIndex(
      (type) => type._id.toString() === req.params.typeId
    );

    if (ticketTypeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ticket type not found',
      });
    }

    // Don't allow reducing quantity below sold tickets
    if (
      req.body.quantity &&
      req.body.quantity < event.ticketTypes[ticketTypeIndex].quantitySold
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot reduce ticket quantity below the number of tickets already sold',
      });
    }

    // Update ticket type
    event.ticketTypes[ticketTypeIndex] = {
      ...event.ticketTypes[ticketTypeIndex].toObject(),
      ...req.body,
    };

    await event.save();

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Update ticket type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a ticket type
 * @route   DELETE /api/events/:id/ticket-types/:typeId
 * @access  Private
 */
exports.deleteTicketType = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete ticket types for this event',
      });
    }

    // Find ticket type
    const ticketType = event.ticketTypes.find(
      (type) => type._id.toString() === req.params.typeId
    );

    if (!ticketType) {
      return res.status(404).json({
        success: false,
        message: 'Ticket type not found',
      });
    }

    // Check if tickets have been sold
    if (ticketType.quantitySold > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete ticket type with sold tickets',
      });
    }

    // Remove ticket type
    event.ticketTypes = event.ticketTypes.filter(
      (type) => type._id.toString() !== req.params.typeId
    );

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Ticket type deleted successfully',
      data: event,
    });
  } catch (error) {
    console.error('Delete ticket type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Upload event image
 * @route   POST /api/events/:id/upload-image
 * @access  Private
 */
exports.uploadEventImage = async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is the event creator
    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this event',
      });
    }

    // Update event with image URL
    // In a real implementation, you would:
    // 1. Save the uploaded file to a storage service (AWS S3, etc.)
    // 2. Get the URL of the saved file
    // 3. Update the event with the image URL
    
    // For this implementation, we'll use a simple approach
    const imageUrl = `/uploads/${req.file.filename}`;
    
    event.featuredImage = imageUrl;
    await event.save();

    res.status(200).json({
      success: true,
      data: {
        imageUrl,
      },
    });
  } catch (error) {
    console.error('Upload event image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Check if user has liked an event
 * @route   GET /api/events/:id/like
 * @access  Private
 */
exports.checkEventLiked = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user has liked this event (requires a likedBy array on the Event model)
    const isLiked = event.likedBy && event.likedBy.includes(userId);

    res.status(200).json({
      success: true,
      isLiked,
    });
  } catch (error) {
    console.error('Check event liked error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Like an event
 * @route   POST /api/events/:id/like
 * @access  Private
 */
exports.likeEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    let event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Initialize likedBy array if it doesn't exist
    if (!event.likedBy) {
      event.likedBy = [];
    }

    // Check if user already liked the event
    if (event.likedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Event already liked',
      });
    }

    // Add user to likedBy array
    event.likedBy.push(userId);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event liked successfully',
    });
  } catch (error) {
    console.error('Like event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Unlike an event
 * @route   DELETE /api/events/:id/like
 * @access  Private
 */
exports.unlikeEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    let event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Initialize likedBy array if it doesn't exist
    if (!event.likedBy) {
      event.likedBy = [];
    }

    // Check if user has liked the event
    if (!event.likedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Event not liked yet',
      });
    }

    // Remove user from likedBy array
    event.likedBy = event.likedBy.filter(id => id.toString() !== userId);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event unliked successfully',
    });
  } catch (error) {
    console.error('Unlike event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};