const express = require('express');
const { Pool } = require('pg');  // Import the pg library
const router = express.Router();

// Set up the PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,  // Use the DATABASE_URL environment variable
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,  // Enable SSL if DATABASE_SSL is true
});

// Route to create a new salary record
router.post('/', async (req, res) => {
  const { employeeName, hoursWorked, totalPay, totalDamages, finalTotalPay, date } = req.body;

  // Validate input fields
  if (!employeeName || isNaN(hoursWorked) || isNaN(totalPay) || isNaN(totalDamages) || isNaN(finalTotalPay) || !date) {
    return res.status(400).json({ error: 'All fields are required and must be valid numbers.' });
  }

  // Check if a salary record for the same employee exists within the last 24 hours
  const checkQuery = `
    SELECT * FROM salaries 
    WHERE employee_name = $1 
    AND date >= CURRENT_DATE - INTERVAL '1 day'
  `;
  
  try {
    const result = await pool.query(checkQuery, [employeeName]);
    if (result.rows.length > 0) {
      return res.status(400).json({ error: 'Daily salary already paid for the mentioned employee.' });
    }

    // Insert the new salary record
    const insertQuery = `
      INSERT INTO salaries (employee_name, hours_worked, total_pay, total_damages, final_total_pay, date) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;
    
    const insertResult = await pool.query(insertQuery, [employeeName, hoursWorked, totalPay, totalDamages, finalTotalPay, date]);
    res.status(201).json({ message: 'Salary record was created successfully!', id: insertResult.rows[0].id });
  } catch (err) {
    console.error('Error creating salary record:', err.message);
    return res.status(500).json({ error: 'An error occurred while creating the salary record. Please try again later.' });
  }
});

// Route to get salary records for a specific date
router.get('/', async (req, res) => {
  const { date } = req.query;

  const sql = date
    ? 'SELECT * FROM salaries WHERE date = $1'
    : 'SELECT * FROM salaries';
  const params = date ? [date] : [];

  try {
    const result = await pool.query(sql, params);
    res.json({ salaries: result.rows });
  } catch (err) {
    console.error('Error fetching salaries:', err.message);
    return res.status(500).json({ error: 'Unable to fetch salaries. Please try again later.' });
  }
});

// Route to delete a salary record by id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Salary id is required.' });
  }

  const deleteQuery = 'DELETE FROM salaries WHERE id = $1';

  try {
    const result = await pool.query(deleteQuery, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Salary record not found.' });
    }

    res.json({ message: 'Salary record deleted successfully!' });
  } catch (err) {
    console.error('Error deleting salary record:', err.message);
    return res.status(500).json({ error: 'An error occurred while deleting the salary record. Please try again later.' });
  }
});

module.exports = router;



