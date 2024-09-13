const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('pg');

// Import route modules
const salariesRouter = require('./routes/salaries');
const suppliesRouter = require('./routes/supplies');
const foodOrdersRouter = require('./routes/foodOrders');
const roomBookingsRouter = require('./routes/roomBookings');

const app = express();

// PostgreSQL client setup
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Failed to connect to PostgreSQL', err));

// Enable CORS for all routes with specific origin in production
const corsOptions = {
  origin: 'https://hotelfinancerecords.netlify.app', // Updated URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json()); // Parse JSON bodies

// Use route modules
app.use('/api/salaries', salariesRouter);
app.use('/api/supplies', suppliesRouter);
app.use('/api/food-orders', foodOrdersRouter);
app.use('/api/room-bookings', roomBookingsRouter);

// Basic route to check server status
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Handle undefined routes with a 404 message
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// Listen on port 8080 or use environment variable for port
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

