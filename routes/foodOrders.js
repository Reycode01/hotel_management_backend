const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite database for food orders.');
  }
});

// Valid food types and beverages
const validFoodTypes = ['Meat', 'Vegetables', 'Cereals'];
const validBeverages = ['Water', 'Soda', 'Juice'];

// POST route to create a new food order
router.post('/', (req, res) => {
  const { foodType, quantity, beverage, beverageQuantity, orderDate } = req.body;

  if (!validFoodTypes.includes(foodType)) {
    return res.status(400).json({ error: 'Invalid food type' });
  }
  if (beverage && !validBeverages.includes(beverage)) {
    return res.status(400).json({ error: 'Invalid beverage' });
  }

  const quantityInKg = parseFloat(quantity);
  const beverageQuantityInLitres = parseFloat(beverageQuantity);

  if (isNaN(quantityInKg)) {
    return res.status(400).json({ error: 'Invalid quantity provided' });
  }
  if (beverage && isNaN(beverageQuantityInLitres)) {
    return res.status(400).json({ error: 'Invalid beverage quantity provided' });
  }

  const sql = `INSERT INTO food_orders (food_type, quantity, beverage, beverage_quantity, order_date) 
               VALUES (?, ?, ?, ?, ?)`;

  db.run(sql, [foodType, quantityInKg, beverage || null, beverageQuantityInLitres || null, orderDate || null], function (err) {
    if (err) {
      console.error('Error adding food order:', err.message);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
    res.status(201).json({ message: 'Food order added successfully!', id: this.lastID });
  });
});

// GET route to retrieve food orders
router.get('/', (req, res) => {
  const { orderDate } = req.query;

  const sql = orderDate ? 'SELECT * FROM food_orders WHERE order_date = ?' : 'SELECT * FROM food_orders';
  const params = orderDate ? [orderDate] : [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching food orders:', err.message);
      return res.status(500).json({ error: 'An error occurred while fetching food orders.' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No food orders found.' });
    }

    res.status(200).json({ foodOrders: rows });
  });
});

// DELETE route to delete a food order by id
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM food_orders WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting food order:', err.message);
      return res.status(500).json({ error: 'An error occurred while deleting the food order.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Food order not found.' });
    }

    res.status(200).json({ message: 'Food order deleted successfully!' });
  });
});

module.exports = router;
