/**
 * Utility script to create the text index for the Event model
 * Run this script with: node src/utils/createTextIndex.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MongoDB connection string not found in environment variables!');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Get a reference to the Event collection
    const Event = mongoose.model('Event');
    
    if (!Event) {
      // If Event model is not registered, register it
      console.log('Event model not registered, loading it now...');
      require('../models/event.model');
      const Event = mongoose.model('Event');
    }
    
    // Create the text index
    console.log('Creating text index for Event collection...');
    
    const result = await mongoose.connection.collection('events').createIndex({
      title: 'text',
      description: 'text',
      shortDescription: 'text',
      'location.city': 'text',
      'location.country': 'text',
      tags: 'text'
    });
    
    console.log('Text index created successfully:', result);
    console.log('\nNow your search functionality should work correctly!');
    
  } catch (error) {
    console.error('Error creating text index:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 