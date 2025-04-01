const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Set up PostgreSQL connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // e.g., from .env or Render's environment settings
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// POST route to create a new booking
router.post('/', (req, res) => {
  const { roomName, customerName, amount, bookingDate } = req.body;

  // Validate required fields
  if (!roomName || !customerName || isNaN(amount) || !bookingDate) {
    return res.status(400).json({ error: 'All fields are required and amount must be a number.' });
  }

  // Check if the room is already booked for the given date
  const checkQuery = `SELECT * FROM room_bookings WHERE room_name = $1 AND booking_date = $2`;
  pool.query(checkQuery, [roomName, bookingDate], (err, result) => {
    if (err) {
      console.error('Error checking existing booking:', err.message);
      return res.status(500).json({ error: 'Database error while checking booking.' });
    }

    if (result.rows.length > 0) {
      return res.status(400).json({ error: `Room ${roomName} is already booked for ${bookingDate}. Please choose a different room or date.` });
    }

    // Insert the new booking if no conflict is found
    const insertQuery = `INSERT INTO room_bookings (room_name, customer_name, amount, booking_date)
                         VALUES ($1, $2, $3, $4) RETURNING id`;
    pool.query(insertQuery, [roomName, customerName, amount, bookingDate], (err, result) => {
      if (err) {
        console.error('Error booking room:', err.message);
        return res.status(500).json({ error: 'An error occurred while booking the room. Please try again later.' });
      }

      res.status(201).json({ message: 'Room was booked successfully!', id: result.rows[0].id });
    });
  });
});

// GET route to retrieve bookings for a specific date
router.get('/', (req, res) => {
  const { bookingDate } = req.query;

  const sql = bookingDate
    ? 'SELECT * FROM room_bookings WHERE booking_date = $1'
    : 'SELECT * FROM room_bookings';
  const params = bookingDate ? [bookingDate] : [];

  pool.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error fetching bookings:', err.message);
      return res.status(500).json({ error: 'Unable to fetch bookings. Please try again later.' });
    }
    res.json({ bookings: result.rows });
  });
});

module.exports = router;


