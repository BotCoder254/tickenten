const mongoose = require('mongoose');
const crypto = require('crypto');

const TicketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    ticketType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['valid', 'used', 'cancelled', 'expired'],
      default: 'valid',
    },
    checkInTime: {
      type: Date,
    },
    attendeeName: {
      type: String,
      required: true,
    },
    attendeeEmail: {
      type: String,
      required: function() {
        return this.user === null || this.user === undefined;
      },
    },
    attendeePhone: {
      type: String,
      required: false,
    },
    qrCodeData: {
      type: String,
    },
    paymentMethod: {
      type: String,
      default: 'standard',
    },
    paymentReference: {
      type: String,
    },
    paymentCurrency: {
      type: String,
      default: 'USD',
    },
    additionalInfo: {
      type: Object,
    },
    // Resale fields
    isForResale: {
      type: Boolean,
      default: false,
    },
    resalePrice: {
      type: Number,
    },
    resaleDescription: {
      type: String,
    },
    resaleListingDate: {
      type: Date,
    },
    resalePurchaseDate: {
      type: Date,
    },
    previousOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Generate a unique ticket number before saving
TicketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    // Generate a random ticket number
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.ticketNumber = `T-${randomString}-${Date.now().toString().slice(-6)}`;
    
    // Generate QR code data from the ticket number and ID
    this.qrCodeData = `${this._id}|${this.ticketNumber}|${Date.now()}`;
  }
  next();
});

// Add middleware to check for expired events and update ticket status
TicketSchema.pre(/^find/, async function() {
  // This runs before any find query on the Ticket model
  try {
    // First, look up tickets of valid status for events that have passed
    const Event = mongoose.model('Event');
    const now = new Date();
    
    // Find all valid tickets for events that have ended
    const events = await Event.find({ 
      endDate: { $lt: now } // Events that have already ended
    });
    
    if (events.length > 0) {
      const eventIds = events.map(event => event._id);
      
      // Update tickets for these events to expired status if they're still valid
      if (eventIds.length > 0) {
        await mongoose.model('Ticket').updateMany(
          { 
            event: { $in: eventIds }, 
            status: 'valid',
            isForResale: false // Only update tickets not listed for resale
          },
          { 
            $set: { 
              status: 'expired',
              isForResale: false // Cancel any resale listing
            },
            $unset: { 
              resalePrice: '',
              resaleDescription: '',
              resaleListingDate: ''
            }
          }
        );

        // Also cancel resale listings for expired events
        await mongoose.model('Ticket').updateMany(
          { 
            event: { $in: eventIds }, 
            isForResale: true
          },
          { 
            $set: { 
              status: 'expired',
              isForResale: false
            },
            $unset: { 
              resalePrice: '',
              resaleDescription: '',
              resaleListingDate: ''
            }
          }
        );
      }
    }
  } catch (error) {
    console.error('Error in ticket pre-find hook:', error);
    // Don't throw the error since we don't want to block the find operation
    // Just log it for debugging
  }
});

// Add index for faster queries
TicketSchema.index({ event: 1, user: 1 });
TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ attendeeEmail: 1 }, { sparse: true });
TicketSchema.index({ isForResale: 1 });

module.exports = mongoose.model('Ticket', TicketSchema); 