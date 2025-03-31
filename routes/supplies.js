const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite database for supplies.');
  }
});

// POST request to add a new supply
router.post('/', (req, res) => {
  const { name, amount, quantity, unit, supplyDate } = req.body;

  if (!name || isNaN(amount) || isNaN(quantity) || !unit || !supplyDate) {
    return res.status(400).json({ error: 'All fields are required and must be valid.' });
  }

  const insertQuery = `
    INSERT INTO supplies (name, amount, quantity, unit, supply_date) 
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(insertQuery, [name, amount, quantity, unit, supplyDate], function (err) {
    if (err) {
      console.error('Error adding supply:', err.message);
      return res.status(500).json({ error: 'An error occurred while adding the supply.' });
    }
    res.status(201).json({ message: 'Supply successfully added.', id: this.lastID });
  });
});

// GET request to fetch supplies by date or all supplies
router.get('/', (req, res) => {
  const { supplyDate } = req.query;

  const sql = supplyDate
    ? 'SELECT * FROM supplies WHERE supply_date = ?'
    : 'SELECT * FROM supplies';
  const params = supplyDate ? [supplyDate] : [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching supplies:', err.message);
      return res.status(500).json({ error: 'An error occurred while fetching supplies.' });
    }

    res.json({ supplies: rows });
  });
});

// DELETE request to remove a supply by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Supply ID is required.' });
  }

  const deleteQuery = 'DELETE FROM supplies WHERE id = ?';

  db.run(deleteQuery, [id], function (err) {
    if (err) {
      console.error('Error deleting supply:', err.message);
      return res.status(500).json({ error: 'An error occurred while deleting the supply.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Supply not found.' });
    }

    res.status(200).json({ message: 'Supply successfully deleted.' });
  });
});

module.exports = router;

