const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// PostgreSQL client configuration using DATABASE_URL from environment variables
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

// Route to create a new salary record
router.post('/', async (req, res) => {
  const { employeeName, hoursWorked, totalPay, totalDamages, finalTotalPay, date } = req.body;

  // Validate input fields
  if (!employeeName || isNaN(hoursWorked) || isNaN(totalPay) || isNaN(totalDamages) || isNaN(finalTotalPay) || !date) {
    return res.status(400).json({ error: 'All fields are required and must be valid numbers.' });
  }

  try {
    // Check if a salary record for the same employee exists within the last 24 hours
    const existingSalaryQuery = `
      SELECT * FROM salaries 
      WHERE employee_name = $1 
      AND date > (NOW() - INTERVAL '24 HOURS')
    `;
    const existingSalary = await client.query(existingSalaryQuery, [employeeName]);

    if (existingSalary.rowCount > 0) {
      return res.status(400).json({ error: 'Daily salary already paid for the mentioned employee.' });
    }

    // Insert the new salary record
    await client.query(
      'INSERT INTO salaries(employee_name, hours_worked, total_pay, total_damages, final_total_pay, date) VALUES($1, $2, $3, $4, $5, $6)',
      [employeeName, hoursWorked, totalPay, totalDamages, finalTotalPay, date]
    );

    res.status(201).json({ message: 'Salary record was created successfully!' });
  } catch (error) {
    console.error('Error creating salary record:', error.message || error);
    res.status(500).json({ error: 'An error occurred while creating the salary record. Please try again later.' });
  }
});

// Route to get salary records for a specific date
router.get('/', async (req, res) => {
  const { date } = req.query;

  try {
    const query = date
      ? 'SELECT * FROM salaries WHERE date::date = $1'
      : 'SELECT * FROM salaries';
    const result = await client.query(query, date ? [date] : []);
    res.json({ salaries: result.rows });
  } catch (error) {
    console.error('Error fetching salaries:', error.message || error);
    res.status(500).json({ error: 'Unable to fetch salaries. Please try again later.' });
  }
});

// Route to delete a salary record by id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Salary id is required.' });
  }

  try {
    const result = await client.query('DELETE FROM salaries WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Salary record not found.' });
    }

    res.json({ message: 'Salary record deleted successfully!' });
  } catch (error) {
    console.error('Error deleting salary record:', error.message || error);
    res.status(500).json({ error: 'An error occurred while deleting the salary record. Please try again later.' });
  }
});

module.exports = router;

