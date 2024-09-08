const express = require('express');
const { Client } = require('pg');
const router = express.Router();

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

// Valid food types and beverages
const validFoodTypes = ['Meat', 'Vegetables', 'Cereals'];
const validBeverages = ['Water', 'Soda', 'Juice'];

router.post('/', async (req, res) => {
  const { foodType, quantity, beverage, beverageQuantity, orderDate } = req.body;

  // Validate food type and beverage
  if (!validFoodTypes.includes(foodType)) {
    return res.status(400).json({ error: 'Invalid food type' });
  }
  if (beverage && !validBeverages.includes(beverage)) {
    return res.status(400).json({ error: 'Invalid beverage' });
  }

  // Validate and adjust units
  let quantityInKg = parseFloat(quantity);
  let beverageQuantityInLitres = parseFloat(beverageQuantity);

  if (isNaN(quantityInKg)) {
    console.error('Invalid quantity provided:', quantity);
    return res.status(400).json({ error: 'Invalid quantity provided' });
  }

  if (beverage && isNaN(beverageQuantityInLitres)) {
    console.error('Invalid beverage quantity provided:', beverageQuantity);
    return res.status(400).json({ error: 'Invalid beverage quantity provided' });
  }

  try {
    console.log('Attempting to insert:', foodType, quantityInKg, beverage, beverageQuantityInLitres, orderDate);

    await client.query(
      'INSERT INTO food_orders(food_type, quantity, beverage, beverage_quantity, order_date) VALUES($1, $2::numeric, $3, $4::numeric, $5)',
      [foodType, quantityInKg, beverage, beverageQuantityInLitres, orderDate || null] // Use the provided date or null if not provided
    );

    res.status(201).json({ message: 'Food order added successfully!' });
  } catch (error) {
    console.error('Error adding food order:', error.message);
    if (error.message.includes('violates')) {
      res.status(400).json({ error: 'Database constraint violation.' });
    } else {
      res.status(500).json({ error: 'An internal server error occurred.' });
    }
  }
});

module.exports = router;
