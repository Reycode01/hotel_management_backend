const express = require('express');
const { Client } = require('pg');
const router = express.Router();

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
    console.error('Error adding supply:', error);
    res.status(500).json({ error: 'An error occurred while adding the supply.' });
  }
});

module.exports = router;
