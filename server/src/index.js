const express = require('express');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const queueSystem = require('./utils/queueSystem');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const userRoutes = require('./routes/user.routes');
const ticketRoutes = require('./routes/ticket.routes');
const queueRoutes = require('./routes/queue.routes');
const paypalRoutes = require('./routes/paypal.routes');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Pass io to queue system
queueSystem.setSocketIo(io);

// Set port
const PORT = process.env.PORT || 5000;

// MongoDB Connection URI - use environment variable
const uri = process.env.MONGO_URI || "mongodb+srv://stream:telvinteum@stream.o3qip.mongodb.net/?retryWrites=true&w=majority&appName=stream";

// Create a MongoClient with a MongoClientOptions object but without strict API mode
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Changed from true to false to allow text indexes
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
        try {
          // First try to create the index with standard options
          const result = await mongoose.connection.db.collection('events').createIndex({
            title: 'text',
            description: 'text',
            shortDescription: 'text',
            'location.city': 'text',
            'location.country': 'text',
            tags: 'text'
          });
          console.log('Text index created successfully:', result);
        } catch (indexError) {
          console.error('Error creating text index with standard options:', indexError);
          
          // If that fails, try without using text index
          console.log('Falling back to regular indexes for searchable fields');
          try {
            await mongoose.connection.db.collection('events').createIndex({ title: 1 });
            await mongoose.connection.db.collection('events').createIndex({ description: 1 });
            await mongoose.connection.db.collection('events').createIndex({ shortDescription: 1 });
            await mongoose.connection.db.collection('events').createIndex({ 'location.city': 1 });
            await mongoose.connection.db.collection('events').createIndex({ 'location.country': 1 });
            await mongoose.connection.db.collection('events').createIndex({ tags: 1 });
            console.log('Created individual indexes for searchable fields');
          } catch (fallbackError) {
            console.error('Error creating fallback indexes:', fallbackError);
          }
        }
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

// Connect to MongoDB with strict mode disabled for text indexes
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false, // Changed from true to false to allow text indexes
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser()); // Add cookie parser middleware

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Serve uploaded files - make sure this is before the routes
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize Passport
app.use(passport.initialize());
require('./config/passport')(passport);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/queue', queueRoutes); // Add queue routes
app.use('/api/paypal', paypalRoutes); // Add PayPal routes

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join a queue room for real-time updates
  socket.on('queue:join', (eventId) => {
    if (eventId) {
      socket.join(`queue:${eventId}`);
      console.log(`Client joined queue room for event ${eventId}`);
    }
  });
  
  // Leave a queue room
  socket.on('queue:leave', (eventId) => {
    if (eventId) {
      socket.leave(`queue:${eventId}`);
      console.log(`Client left queue room for event ${eventId}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

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
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 