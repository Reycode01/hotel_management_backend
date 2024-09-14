const express = require('express');
const { Client } = require('pg');
const router = express.Router();

// PostgreSQL client configuration using DATABASE_URL from environment variables
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

// POST request to add a new supply
router.post('/', async (req, res) => {
  const { name, amount, quantity, unit, supplyDate } = req.body;

  try {
    // Insert into the database
    await client.query(
      'INSERT INTO supplies(name, amount, quantity, unit, supply_date) VALUES($1, $2, $3, $4, $5)',
      [name, amount, quantity, unit, supplyDate]
    );

    res.status(201).json({ message: 'Supply successfully added.' });
  } catch (error) {
    console.error('Error adding supply:', error.message || error);
    res.status(500).json({ error: 'An error occurred while adding the supply.' });
  }
});

// GET request to fetch supplies by date or all supplies
router.get('/', async (req, res) => {
  const { supplyDate } = req.query;

  try {
    let query = 'SELECT * FROM supplies';
    let params = [];

    if (supplyDate) {
      query += ' WHERE supply_date = $1';
      params = [supplyDate];
    }

    const result = await client.query(query, params);

    res.json({ supplies: result.rows });
  } catch (error) {
    console.error('Error fetching supplies:', error.message || error);
    res.status(500).json({ error: 'An error occurred while fetching supplies.' });
  }
});

module.exports = router;

