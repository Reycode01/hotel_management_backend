const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// PostgreSQL client configuration
const client = new Client({
  host: 'YOUR_NEW_DATABASE_HOST',
  port: YOUR_NEW_DATABASE_PORT,
  user: 'YOUR_NEW_DATABASE_USER',
  password: 'YOUR_NEW_DATABASE_PASSWORD',
  database: 'YOUR_NEW_DATABASE_NAME',
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

// Route to create a new booking
router.post('/', async (req, res) => {
  const { roomName, customerName, amount, bookingDate } = req.body;

  if (!roomName || !customerName || isNaN(amount) || !bookingDate) {
    return res.status(400).json({ error: 'All fields are required and amount must be a number.' });
  }

  try {
    const existingBooking = await client.query(
      'SELECT * FROM room_bookings WHERE room_name = $1 AND booking_date = $2',
      [roomName, bookingDate]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({ error: `Room ${roomName} is already booked for ${bookingDate}. Please choose a different room or date.` });
    }

    await client.query(
      'INSERT INTO room_bookings(room_name, customer_name, amount, booking_date) VALUES($1, $2, $3, $4)',
      [roomName, customerName, amount, bookingDate]
    );

    res.status(201).json({ message: 'Room was booked successfully!' });
  } catch (error) {
    console.error('Error booking room:', error.message || error);
    res.status(500).json({ error: 'An error occurred while booking the room. Please try again later.' });
  }
});

// Route to get bookings for a specific date
router.get('/', async (req, res) => {
  const { bookingDate } = req.query;

  try {
    const query = bookingDate
      ? 'SELECT * FROM room_bookings WHERE booking_date = $1'
      : 'SELECT * FROM room_bookings';
    const result = await client.query(query, bookingDate ? [bookingDate] : []);
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Error fetching bookings:', error.message || error);
    res.status(500).json({ error: 'Unable to fetch bookings. Please try again later.' });
  }
});

module.exports = router;
