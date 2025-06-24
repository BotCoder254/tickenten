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
      enum: ['valid', 'used', 'cancelled'],
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
    additionalInfo: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique ticket number before saving
TicketSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    // Generate a random ticket number with event ID prefix
    const eventPrefix = this.event.toString().substring(0, 4);
    const randomPart = crypto.randomBytes(8).toString('hex');
    this.ticketNumber = `${eventPrefix}-${randomPart}`;
    
    // Generate QR code data (in a real app, you would use a QR code library)
    this.qrCode = `TICKET:${this.ticketNumber}`;
  }
  next();
});

// Add index for faster queries
TicketSchema.index({ event: 1, user: 1 });
TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ attendeeEmail: 1 }, { sparse: true });

module.exports = mongoose.model('Ticket', TicketSchema); 