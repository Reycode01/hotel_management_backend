require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // PostgreSQL library

// Import route modules
const salariesRouter = require('./routes/salaries');
const suppliesRouter = require('./routes/supplies');
const foodOrdersRouter = require('./routes/foodOrders');
const roomBookingsRouter = require('./routes/roomBookings');

const app = express();

// === PostgreSQL connection ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database');
  }
});

// === 🧱 Auto-create required tables ===
const createTables = async () => {
  const createFoodOrdersTable = `
    CREATE TABLE IF NOT EXISTS food_orders (
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      quantity INT NOT NULL,
      price NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createRoomBookingsTable = `
    CREATE TABLE IF NOT EXISTS room_bookings (
      id SERIAL PRIMARY KEY,
      room_name VARCHAR(100) NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      amount NUMERIC NOT NULL,
      booking_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createSuppliesTable = `
    CREATE TABLE IF NOT EXISTS supplies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      amount NUMERIC NOT NULL,
      quantity NUMERIC NOT NULL,
      unit VARCHAR(50) NOT NULL,
      supply_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createSalariesTable = `
    CREATE TABLE IF NOT EXISTS salaries (
      id SERIAL PRIMARY KEY,
      employee_name VARCHAR(100) NOT NULL,
      hours_worked NUMERIC NOT NULL,
      total_pay NUMERIC NOT NULL,
      total_damages NUMERIC NOT NULL,
      final_total_pay NUMERIC NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createFoodOrdersTable);
    console.log('✅ food_orders table is ready');

    await pool.query(createRoomBookingsTable);
    console.log('✅ room_bookings table is ready');

    await pool.query(createSuppliesTable);
    console.log('✅ supplies table is ready');

    await pool.query(createSalariesTable);
    console.log('✅ salaries table is ready');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
};

// Run the table creation
createTables();

// === CORS setup ===
const corsOptions = {
  origin: 'https://hotelfinancerecords.netlify.app', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// === Middleware ===
app.use(bodyParser.json());

// === Routes ===
app.use('/api/salaries', salariesRouter);
app.use('/api/supplies', suppliesRouter);
app.use('/api/food-orders', foodOrdersRouter);
app.use('/api/room-bookings', roomBookingsRouter);

// === Root endpoint ===
app.get('/', (req, res) => {
  res.send('Server is running ✅');
});

// === 404 handler ===
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// === Global error handler ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// === Start the server ===
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});

