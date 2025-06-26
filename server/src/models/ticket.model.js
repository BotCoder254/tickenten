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

// Generate unique ticket number and QR code data before saving
TicketSchema.pre('save', function (next) {
  if (!this.ticketNumber) {
    // Generate a random ticket number with event ID prefix
    const eventPrefix = this.event.toString().substring(0, 4);
    const randomPart = crypto.randomBytes(8).toString('hex');
    this.ticketNumber = `${eventPrefix}-${randomPart}`;
    
    // Generate more detailed QR code data
    // Include ticket number, event ID, ticket type ID, and purchase timestamp for verification
    const timestamp = Date.now();
    const verificationData = {
      ticket: this.ticketNumber,
      event: this.event.toString(),
      type: this.ticketType.toString(),
      purchaser: this.attendeeName,
      email: this.attendeeEmail,
      phone: this.attendeePhone,
      time: timestamp
    };
    
    // Create a JSON string of the verification data
    this.qrCodeData = JSON.stringify(verificationData);
  }
  next();
});

// Add index for faster queries
TicketSchema.index({ event: 1, user: 1 });
TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ attendeeEmail: 1 }, { sparse: true });
TicketSchema.index({ isForResale: 1 });

module.exports = mongoose.model('Ticket', TicketSchema); 