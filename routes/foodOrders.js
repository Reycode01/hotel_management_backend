const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// PostgreSQL Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use the PostgreSQL URL from Render
  ssl: {
    rejectUnauthorized: false,
  },
});

// Valid food types and beverages
const validFoodTypes = ['Meat', 'Vegetables', 'Cereals'];
const validBeverages = ['Water', 'Soda', 'Juice'];

// CREATE TABLE if not exists (run once during startup)
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS food_orders (
    id SERIAL PRIMARY KEY,
    food_type VARCHAR(50) NOT NULL,
    quantity NUMERIC NOT NULL,
    beverage VARCHAR(50),
    beverage_quantity NUMERIC,
    order_date DATE NOT NULL
  );
`;
pool.query(createTableQuery)
  .then(() => console.log('✅ food_orders table is ready'))
  .catch((err) => console.error('❌ Error creating table:', err.message));

// POST route to create a new food order
router.post('/', async (req, res) => {
  const { foodType, quantity, beverage, beverageQuantity, orderDate } = req.body;

  if (!validFoodTypes.includes(foodType)) {
    return res.status(400).json({ error: 'Invalid food type' });
  }
  if (beverage && !validBeverages.includes(beverage)) {
    return res.status(400).json({ error: 'Invalid beverage' });
  }

  const quantityInKg = parseFloat(quantity);
  const beverageQuantityInLitres = beverage ? parseFloat(beverageQuantity) : null;

  if (isNaN(quantityInKg)) {
    return res.status(400).json({ error: 'Invalid quantity provided' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO food_orders (food_type, quantity, beverage, beverage_quantity, order_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [foodType, quantityInKg, beverage || null, beverageQuantityInLitres, orderDate]
    );
    res.status(201).json({ message: 'Food order added successfully!', foodOrder: result.rows[0] });
  } catch (error) {
    console.error('Error adding food order:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// GET route to retrieve food orders
router.get('/', async (req, res) => {
  const { orderDate } = req.query;
  const query = orderDate
    ? 'SELECT * FROM food_orders WHERE order_date = $1'
    : 'SELECT * FROM food_orders';
  const params = orderDate ? [orderDate] : [];

  try {
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No food orders found.' });
    }
    res.status(200).json({ foodOrders: result.rows });
  } catch (error) {
    console.error('Error fetching food orders:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching food orders.' });
  }
});

// DELETE route to delete a food order by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM food_orders WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Food order not found.' });
    }

    res.status(200).json({ message: 'Food order deleted successfully!' });
  } catch (error) {
    console.error('Error deleting food order:', error.message);
    res.status(500).json({ error: 'An error occurred while deleting the food order.' });
  }
});

module.exports = router;
