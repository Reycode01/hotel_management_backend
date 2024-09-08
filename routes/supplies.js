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

router.post('/', async (req, res) => {
  const { supplyName, amount, quantity, unit, supplyDate } = req.body;

  try {
    // Insert into the database
    await client.query(
      'INSERT INTO supplies(name, amount, quantity, unit, supply_date) VALUES($1, $2, $3, $4, $5)',
      [supplyName, amount, quantity, unit, supplyDate]
    );

    res.status(201).json({ message: 'Supply successfully added.' });
  } catch (error) {
    console.error('Error adding supply:', error.message || error);
    res.status(500).json({ error: 'An error occurred while adding the supply.' });
  }
});

module.exports = router;
