const { validationResult } = require('express-validator');
const Ticket = require('../models/ticket.model');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/email');

/**
 * @desc    Get tickets purchased by the current user
 * @route   GET /api/tickets/user
 * @access  Private
 */
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate({
        path: 'event',
        select: 'title startDate endDate location isVirtual featuredImage ticketTypes',
      })
      .populate({
        path: 'ticketType',
        select: '_id',
      });

    // Process tickets to include ticket type information from the event
    const processedTickets = tickets.map(ticket => {
      const ticketData = ticket.toObject();
      
      // Find the ticket type in the event's ticketTypes array using the ticketType ID reference
      if (ticketData.event && ticketData.event.ticketTypes && ticketData.ticketType) {
        const foundTicketType = ticketData.event.ticketTypes.find(
          type => type._id.toString() === ticketData.ticketType._id.toString()
        );
        
        if (foundTicketType) {
          ticketData.ticketTypeInfo = foundTicketType;
        }
      }
      
      return ticketData;
    });

    res.status(200).json({
      success: true,
      data: processedTickets,
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get tickets for an event (for event organizers)
 * @route   GET /api/tickets/event/:eventId
 * @access  Private
 */
exports.getEventTickets = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

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
        message: 'Not authorized to access these tickets',
      });
    }

    const tickets = await Ticket.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .populate({
        path: 'ticketType',
        select: '_id',
      });

    // Process tickets to include ticket type information from the event
    const processedTickets = tickets.map(ticket => {
      const ticketData = ticket.toObject();
      
      // Find the ticket type in the event's ticketTypes array using the ticketType ID reference
      if (event.ticketTypes && ticketData.ticketType) {
        const foundTicketType = event.ticketTypes.find(
          type => type._id.toString() === ticketData.ticketType._id.toString()
        );
        
        if (foundTicketType) {
          ticketData.ticketTypeInfo = foundTicketType;
        }
      }
      
      return ticketData;
    });

    res.status(200).json({
      success: true,
      data: processedTickets,
    });
  } catch (error) {
    console.error('Get event tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get ticket by ID
 * @route   GET /api/tickets/:ticketId
 * @access  Private
 */
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate({
        path: 'event',
        select: 'title startDate endDate location isVirtual featuredImage ticketTypes creator',
      })
      .populate({
        path: 'ticketType',
        select: '_id',
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check if user is authorized to view this ticket
    if (ticket.user.toString() !== req.user.id && ticket.event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this ticket',
      });
    }

    // Process ticket to include ticket type information
    const ticketData = ticket.toObject();
    if (ticketData.event && ticketData.event.ticketTypes && ticketData.ticketType) {
      const foundTicketType = ticketData.event.ticketTypes.find(
        type => type._id.toString() === ticketData.ticketType._id.toString()
      );
      
      if (foundTicketType) {
        ticketData.ticketTypeInfo = foundTicketType;
      }
    }

    res.status(200).json({
      success: true,
      data: ticketData,
    });
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Purchase tickets for an event
 * @route   POST /api/tickets/purchase
 * @access  Private
 */
exports.purchaseTickets = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { eventId, ticketTypeId, quantity, attendeeInfo } = req.body;

  try {
    // Find event and check if it exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if event is published and not ended
    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for ticket purchases',
      });
    }

    if (new Date(event.endDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event has already ended',
      });
    }

    // Only check for event creators if user is authenticated
    if (req.user && event.creator.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Event creators cannot purchase tickets for their own events',
      });
    }

    // Find ticket type
    const ticketType = event.ticketTypes.find(
      (type) => type._id.toString() === ticketTypeId
    );

    if (!ticketType) {
      return res.status(404).json({
        success: false,
        message: 'Ticket type not found',
      });
    }

    // Check if there are enough tickets available
    const availableTickets = ticketType.quantity - ticketType.quantitySold;
    if (availableTickets < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableTickets} tickets available`,
      });
    }

    // For unauthenticated users, check if attendee info is provided
    if (!req.user && !attendeeInfo) {
      return res.status(400).json({
        success: false,
        message: 'Attendee information is required for non-authenticated users',
      });
    }

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = new Ticket({
        event: eventId,
        user: req.user ? req.user.id : null, // Allow null for unauthenticated users
        ticketType: ticketTypeId,
        ticketNumber: `${event.title.substring(0, 3).toUpperCase()}${Date.now()}${Math.floor(Math.random() * 1000)}`,
        purchaseDate: Date.now(),
        status: 'valid',
        attendeeName: req.user ? req.user.name : (attendeeInfo ? attendeeInfo.name : 'Guest'),
        attendeeEmail: req.user ? req.user.email : (attendeeInfo ? attendeeInfo.email : null),
        guestPurchase: !req.user,
      });

      await ticket.save();
      tickets.push(ticket);
    }

    // Update ticket type quantity sold
    ticketType.quantitySold += quantity;
    await event.save();

    // Update event revenue
    event.revenue = (event.revenue || 0) + (ticketType.price * quantity);
    await event.save();

    // Send confirmation email if email is available
    const emailToSend = req.user ? req.user.email : (attendeeInfo ? attendeeInfo.email : null);
    if (emailToSend) {
      try {
        await sendEmail({
          to: emailToSend,
          subject: `Your Tickets for ${event.title}`,
          html: `
            <h1>Ticket Confirmation</h1>
            <p>Thank you for purchasing tickets for ${event.title}!</p>
            <p>Event Date: ${new Date(event.startDate).toLocaleDateString()}</p>
            <p>Ticket Type: ${ticketType.name}</p>
            <p>Quantity: ${quantity}</p>
            <p>Total: ${ticketType.price * quantity} ${ticketType.currency}</p>
            <p>Your ticket numbers: ${tickets.map(t => t.ticketNumber).join(', ')}</p>
            ${req.user ? '<p>You can view your tickets in your account dashboard.</p>' : ''}
          `,
        });
      } catch (err) {
        console.error('Error sending ticket confirmation email:', err);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Tickets purchased successfully',
      data: tickets,
    });
  } catch (error) {
    console.error('Purchase tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel a ticket
 * @route   PUT /api/tickets/:ticketId/cancel
 * @access  Private
 */
exports.cancelTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check if user owns the ticket
    if (ticket.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this ticket',
      });
    }

    // Check if ticket is already used or cancelled
    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a used ticket',
      });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already cancelled',
      });
    }

    // Update ticket status
    ticket.status = 'cancelled';
    await ticket.save();

    // Update event ticket quantity sold
    const event = await Event.findById(ticket.event);
    if (event) {
      const ticketType = event.ticketTypes.find(
        (type) => type._id.toString() === ticket.ticketType.toString()
      );

      if (ticketType) {
        ticketType.quantitySold -= 1;
        await event.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Ticket cancelled successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Check in a ticket
 * @route   PUT /api/tickets/:ticketId/check-in
 * @access  Private
 */
exports.checkInTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Get event
    const event = await Event.findById(ticket.event);
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
        message: 'Not authorized to check in tickets for this event',
      });
    }

    // Check if ticket is already used or cancelled
    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used',
      });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check in a cancelled ticket',
      });
    }

    // Update ticket status
    ticket.status = 'used';
    ticket.checkInTime = Date.now();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket checked in successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Check in ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify ticket validity
 * @route   GET /api/tickets/verify/:ticketNumber
 * @access  Public
 */
exports.verifyTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketNumber: req.params.ticketNumber })
      .populate({
        path: 'event',
        select: 'title startDate endDate ticketTypes',
      })
      .populate({
        path: 'ticketType',
        select: '_id',
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        isValid: false,
      });
    }

    const isValid = ticket.status === 'valid';
    
    // Find ticket type info
    let ticketTypeName = 'Unknown';
    if (ticket.event && ticket.event.ticketTypes && ticket.ticketType) {
      const foundTicketType = ticket.event.ticketTypes.find(
        type => type._id.toString() === ticket.ticketType._id.toString()
      );
      
      if (foundTicketType) {
        ticketTypeName = foundTicketType.name;
      }
    }

    res.status(200).json({
      success: true,
      isValid,
      status: ticket.status,
      data: {
        ticketNumber: ticket.ticketNumber,
        eventTitle: ticket.event.title,
        ticketType: ticketTypeName,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error('Verify ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Download ticket as PDF
 * @route   GET /api/tickets/:ticketId/download
 * @access  Private
 */
exports.downloadTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate({
        path: 'event',
        select: 'title startDate endDate location isVirtual ticketTypes',
      })
      .populate({
        path: 'ticketType',
        select: '_id',
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check if user owns the ticket
    if (ticket.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this ticket',
      });
    }
    
    // Process ticket to include ticket type information
    const ticketData = ticket.toObject();
    if (ticketData.event && ticketData.event.ticketTypes && ticketData.ticketType) {
      const foundTicketType = ticketData.event.ticketTypes.find(
        type => type._id.toString() === ticketData.ticketType._id.toString()
      );
      
      if (foundTicketType) {
        ticketData.ticketTypeInfo = foundTicketType;
      }
    }

    // In a real application, you would generate a PDF here
    // For now, we'll just send a success message
    res.status(200).json({
      success: true,
      message: 'Ticket downloaded successfully',
      data: ticketData
    });
  } catch (error) {
    console.error('Download ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Share ticket via email
 * @route   POST /api/tickets/:ticketId/share
 * @access  Private
 */
exports.shareTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate({
        path: 'event',
        select: 'title startDate endDate location isVirtual ticketTypes',
      })
      .populate({
        path: 'ticketType',
        select: '_id',
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check if user owns the ticket
    if (ticket.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to share this ticket',
      });
    }
    
    // Find ticket type info
    let ticketTypeName = 'Standard Ticket';
    if (ticket.event && ticket.event.ticketTypes && ticket.ticketType) {
      const foundTicketType = ticket.event.ticketTypes.find(
        type => type._id.toString() === ticket.ticketType._id.toString()
      );
      
      if (foundTicketType) {
        ticketTypeName = foundTicketType.name;
      }
    }

    // Send email
    await sendEmail({
      to: req.body.email,
      subject: `Ticket for ${ticket.event.title}`,
      html: `
        <h1>Ticket Information</h1>
        <p>${req.user.name} has shared a ticket with you for ${ticket.event.title}!</p>
        <p>Event Date: ${new Date(ticket.event.startDate).toLocaleDateString()}</p>
        <p>Ticket Type: ${ticketTypeName}</p>
        <p>Ticket Number: ${ticket.ticketNumber}</p>
        <p>Status: ${ticket.status}</p>
        <p>You can view the ticket by clicking the link below:</p>
        <a href="${process.env.FRONTEND_URL}/tickets/${ticket._id}">View Ticket</a>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Ticket shared successfully',
    });
  } catch (error) {
    console.error('Share ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a ticket
 * @route   DELETE /api/tickets/:ticketId
 * @access  Private
 */
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check if user is authorized to delete this ticket
    // Allow deletion by the ticket owner or event creator
    const event = await Event.findById(ticket.event);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Associated event not found',
      });
    }

    if (ticket.user.toString() !== req.user.id && event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ticket',
      });
    }

    // Update ticket type quantity if needed
    if (ticket.status === 'valid') {
      const ticketType = event.ticketTypes.find(
        (type) => type._id.toString() === ticket.ticketType.toString()
      );

      if (ticketType) {
        ticketType.quantitySold -= 1;
        await event.save();
      }
    }

    // Delete the ticket
    await ticket.remove();

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}; 