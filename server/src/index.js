const express = require('express');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const userRoutes = require('./routes/user.routes');
const ticketRoutes = require('./routes/ticket.routes');

// Create Express app
const app = express();

// Set port
const PORT = process.env.PORT || 5000;

// MongoDB Connection URI
const uri = "mongodb+srv://stream:telvinteum@stream.o3qip.mongodb.net/?retryWrites=true&w=majority&appName=stream";

// Create a MongoClient with a MongoClientOptions object
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Function to check and create text index for Event collection
async function ensureTextIndex() {
  try {
    console.log('Checking Event collection text index...');
    const collections = await mongoose.connection.db.listCollections({ name: 'events' }).toArray();
    
    if (collections.length > 0) {
      const indexes = await mongoose.connection.db.collection('events').indexes();
      const hasTextIndex = indexes.some(index => index.textIndexVersion);
      
      if (!hasTextIndex) {
        console.log('Text index not found. Creating index for Event collection...');
        const result = await mongoose.connection.db.collection('events').createIndex({
          title: 'text',
          description: 'text',
          shortDescription: 'text',
          'location.city': 'text',
          'location.country': 'text',
          tags: 'text'
        });
        console.log('Text index created successfully:', result);
      } else {
        console.log('Text index already exists.');
      }
    } else {
      console.log('Events collection does not exist yet. Index will be created when the collection is created.');
    }
  } catch (error) {
    console.error('Error checking/creating text index:', error);
  }
}

// Connect to MongoDB
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
})
.then(async () => {
    try {
        // Connect the client to the server
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("MongoDB Connected Successfully!");
        
        // Ensure text index exists for Event collection
        await ensureTextIndex();
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
})
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize Passport
app.use(passport.initialize());
require('./config/passport')(passport);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../../build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../build', 'index.html'));
  });
} else {
  // In development, serve images from uploads directly
  app.use('/images', express.static(path.join(__dirname, '../uploads')));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 