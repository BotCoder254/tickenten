const { validationResult } = require('express-validator');
const Ticket = require('../models/ticket.model');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/email');
const sendSMSNotification = require('../utils/sms');

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

  const { 
    eventId, 
    ticketTypeId, 
    quantity, 
    attendeeInfo,
    paymentMethod,
    paymentReference,
    paymentCurrency,
    paymentTransaction,
    isFreeTicket,
    phoneNumber // For authenticated users who only provide phone
  } = req.body;

  try {
    console.log('Processing ticket purchase:', {
      eventId,
      ticketTypeId,
      quantity,
      isFreeTicket,
      isAuthenticated: !!req.user
    });
    
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
      console.log('Event status check:', {
        eventId: event._id,
        status: event.status,
        title: event.title,
        normalizedStatus: event.status.toLowerCase().trim()
      });
      
      // Check if the status is effectively "published" accounting for case/whitespace issues
      if (event.status.toLowerCase().trim() === 'published') {
        console.log('Event status is effectively published after normalization, continuing');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Event is not available for ticket purchases',
          details: `Event status is "${event.status}" instead of "published"`
        });
      }
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
    
    // For paid tickets, verify payment information is provided
    // Skip payment validation for free tickets (price = 0)
    const isTicketFree = ticketType.price === 0 || isFreeTicket === true;
    console.log('Is ticket free:', isTicketFree, 'Price:', ticketType.price);
    
    if (!isTicketFree && !paymentReference && !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment information is required for paid tickets',
      });
    }

    // Get phone number from either the authenticated user, phoneNumber field, or attendeeInfo
    const attendeePhone = req.user ? 
                          (req.user.phoneNumber || phoneNumber) : 
                          (attendeeInfo ? attendeeInfo.phoneNumber : null);
                          
    if (!attendeePhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for ticket purchase',
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
        attendeePhone: attendeePhone,
        paymentMethod: isTicketFree ? 'Free Ticket' : (paymentMethod || 'standard'),
        paymentReference: isTicketFree ? (paymentReference || 'FREE-TICKET') : (paymentReference || null),
        paymentCurrency: paymentCurrency || ticketType.currency || 'USD',
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
        // Generate ticket information for email
        const ticketListItems = tickets.map(ticket => {
          return `
            <li style="margin-bottom: 10px;">
              <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
                <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
                <p><strong>Attendee:</strong> ${ticket.attendeeName}</p>
                <div style="margin-top: 10px; text-align: center;">
                  <p><strong>Scan QR code at the event:</strong></p>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ticket.qrCodeData)}&size=150x150" alt="Ticket QR Code" style="width: 150px; height: 150px;">
                </div>
              </div>
            </li>
          `;
        }).join('');

        // Create an enhanced HTML email with ticket details and QR code
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333;">Ticket Confirmation</h1>
              <p style="font-size: 16px; color: #666;">Thank you for purchasing tickets for ${event.title}!</p>
            </div>
            
            <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Event Details</h2>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()} at ${new Date(event.startDate).toLocaleTimeString()}</p>
              <p><strong>Location:</strong> ${event.isVirtual ? 'Virtual Event' : `${event.location.venue}, ${event.location.city}, ${event.location.country}`}</p>
              ${event.isVirtual ? `<p><strong>Virtual Link:</strong> Will be sent before the event</p>` : ''}
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333;">Purchase Summary</h2>
              <p><strong>Ticket Type:</strong> ${ticketType.name}</p>
              <p><strong>Quantity:</strong> ${quantity}</p>
              <p><strong>Price per Ticket:</strong> ${ticketType.price} ${ticketType.currency}</p>
              <p><strong>Total:</strong> ${ticketType.price * quantity} ${ticketType.currency}</p>
              ${paymentReference ? `<p><strong>Payment Reference:</strong> ${paymentReference}</p>` : ''}
              ${paymentMethod ? `<p><strong>Payment Method:</strong> ${paymentMethod}</p>` : ''}
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333;">Your Tickets</h2>
              <ul style="list-style-type: none; padding: 0;">
                ${ticketListItems}
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px;">
                ${req.user ? 'You can view your tickets in your account dashboard.' : 'Please keep this email as proof of purchase.'}
              </p>
              <p style="color: #666; font-size: 14px;">
                If you have any questions, please contact the event organizer.
              </p>
            </div>
          </div>
        `;

        await sendEmail({
          to: emailToSend,
          subject: `Your Tickets for ${event.title}`,
          html: emailHtml,
        });
      } catch (err) {
        console.error('Error sending ticket confirmation email:', err);
      }
    }

    // Send SMS notification if phone number is available
    const phoneToSend = req.user ? req.user.phoneNumber : (attendeeInfo ? attendeeInfo.phoneNumber : null);
    if (phoneToSend) {
      try {
        // Generate SMS message with ticket info
        const smsMessage = `
Ticket Confirmation for ${event.title}
Date: ${new Date(event.startDate).toLocaleDateString()}
Time: ${new Date(event.startDate).toLocaleTimeString()}
Ticket(s): ${quantity} x ${ticketType.name}
Total: ${ticketType.price * quantity} ${ticketType.currency}
${tickets.length > 0 ? `Ticket #: ${tickets[0].ticketNumber}` : ''}
        `.trim();

        // Send SMS via VasPro
        await sendSMSNotification(phoneToSend, smsMessage);
      } catch (err) {
        console.error('Error sending ticket confirmation SMS:', err);
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

    // Format response data
    const responseData = {
      ticketNumber: ticket.ticketNumber,
      eventTitle: ticket.event.title,
      eventDate: new Date(ticket.event.startDate).toLocaleDateString(),
      ticketType: ticketTypeName,
      status: ticket.status,
      attendeeName: ticket.attendeeName,
      attendeeEmail: ticket.attendeeEmail,
      purchaseDate: new Date(ticket.purchaseDate).toLocaleDateString(),
      qrCodeData: ticket.qrCodeData,
      paymentReference: ticket.paymentReference || 'N/A'
    };

    res.status(200).json({
      success: true,
      isValid,
      status: ticket.status,
      data: responseData,
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
    // First check if the ticket exists
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

    if (ticket.user && ticket.user.toString() !== req.user.id && event.creator.toString() !== req.user.id) {
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

    // Delete the ticket using findByIdAndDelete
    const deletedTicket = await Ticket.findByIdAndDelete(ticket._id);
    
    if (!deletedTicket) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete ticket',
      });
    }

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