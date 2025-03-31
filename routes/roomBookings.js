const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite database for room bookings.');
  }
});

// Route to create a new booking
router.post('/', (req, res) => {
  const { roomName, customerName, amount, bookingDate } = req.body;

  if (!roomName || !customerName || isNaN(amount) || !bookingDate) {
    return res.status(400).json({ error: 'All fields are required and amount must be a number.' });
  }

  // Check if the room is already booked for the given date
  const checkQuery = `SELECT * FROM room_bookings WHERE room_name = ? AND booking_date = ?`;
  db.get(checkQuery, [roomName, bookingDate], (err, existingBooking) => {
    if (err) {
      console.error('Error checking existing booking:', err.message);
      return res.status(500).json({ error: 'Database error while checking booking.' });
    }

    if (existingBooking) {
      return res.status(400).json({ error: `Room ${roomName} is already booked for ${bookingDate}. Please choose a different room or date.` });
    }

    // Insert the new booking if no conflict
    const insertQuery = `INSERT INTO room_bookings (room_name, customer_name, amount, booking_date) VALUES (?, ?, ?, ?)`;
    db.run(insertQuery, [roomName, customerName, amount, bookingDate], function (err) {
      if (err) {
        console.error('Error booking room:', err.message);
        return res.status(500).json({ error: 'An error occurred while booking the room. Please try again later.' });
      }
      res.status(201).json({ message: 'Room was booked successfully!', id: this.lastID });
    });
  });
});

// Route to get bookings for a specific date
router.get('/', (req, res) => {
  const { bookingDate } = req.query;

  const sql = bookingDate
    ? 'SELECT * FROM room_bookings WHERE booking_date = ?'
    : 'SELECT * FROM room_bookings';
  const params = bookingDate ? [bookingDate] : [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching bookings:', err.message);
      return res.status(500).json({ error: 'Unable to fetch bookings. Please try again later.' });
    }

    res.json({ bookings: rows });
  });
});

module.exports = router;

