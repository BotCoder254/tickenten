const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an event title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide an event description'],
      maxlength: [5000, 'Description cannot be more than 5000 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Please provide a short description'],
      maxlength: [200, 'Short description cannot be more than 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['Music', 'Sports', 'Arts', 'Food', 'Business', 'Technology', 'Other'],
    },
    location: {
      type: {
        venue: String,
        address: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      required: [true, 'Please provide an event location'],
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    virtualMeetingLink: {
      type: String,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date'],
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    featuredImage: {
      type: String,
      required: [true, 'Please provide a featured image'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketTypes: [
      {
        name: {
          type: String,
          required: true,
        },
        description: String,
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        currency: {
          type: String,
          default: 'USD',
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        quantitySold: {
          type: Number,
          default: 0,
        },
        saleStartDate: Date,
        saleEndDate: Date,
      },
    ],
    tags: [String],
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    capacity: {
      type: Number,
      min: 1,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    socialLinks: {
      website: String,
      facebook: String,
      twitter: String,
      instagram: String,
    },
    faq: [
      {
        question: String,
        answer: String,
      },
    ],
    stripeProductId: String,
    stripePriceId: String,
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for tickets related to this event
EventSchema.virtual('tickets', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'event',
  justOne: false,
});

// Create slug from title
EventSchema.pre('save', function (next) {
  this.slug = this.title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  next();
});

// Add a text index for searching
EventSchema.index({
  title: 'text',
  description: 'text',
  shortDescription: 'text',
  'location.city': 'text',
  'location.country': 'text',
  tags: 'text',
});

module.exports = mongoose.model('Event', EventSchema); 