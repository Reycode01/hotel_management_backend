const { Pool } = require('pg');
const express = require('express');
const router = express.Router();

// Connect to PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Make sure to set the DATABASE_URL in your .env file
});

// POST request to add a new supply
router.post('/', (req, res) => {
  const { name, amount, quantity, unit, supplyDate } = req.body;

  if (!name || isNaN(amount) || isNaN(quantity) || !unit || !supplyDate) {
    return res.status(400).json({ error: 'All fields are required and must be valid.' });
  }

  const insertQuery = `
    INSERT INTO supplies (name, amount, quantity, unit, supply_date) 
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `;

  pool.query(insertQuery, [name, amount, quantity, unit, supplyDate], (err, result) => {
    if (err) {
      console.error('Error adding supply:', err.message);
      return res.status(500).json({ error: 'An error occurred while adding the supply.' });
    }
    res.status(201).json({ message: 'Supply successfully added.', id: result.rows[0].id });
  });
});

// GET request to fetch supplies by date or all supplies
router.get('/', (req, res) => {
  const { supplyDate } = req.query;

  const sql = supplyDate
    ? 'SELECT * FROM supplies WHERE supply_date = $1'
    : 'SELECT * FROM supplies';
  const params = supplyDate ? [supplyDate] : [];

  pool.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error fetching supplies:', err.message);
      return res.status(500).json({ error: 'An error occurred while fetching supplies.' });
    }

    res.json({ supplies: result.rows });
  });
});

// DELETE request to remove a supply by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Supply ID is required.' });
  }

  const deleteQuery = 'DELETE FROM supplies WHERE id = $1';

  pool.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error('Error deleting supply:', err.message);
      return res.status(500).json({ error: 'An error occurred while deleting the supply.' });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Supply not found.' });
    }

    res.status(200).json({ message: 'Supply successfully deleted.' });
  });
});

module.exports = router;


