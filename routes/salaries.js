const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Connect to SQLite database
const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite database for salaries.');
  }
});

// Route to create a new salary record
router.post('/', (req, res) => {
  const { employeeName, hoursWorked, totalPay, totalDamages, finalTotalPay, date } = req.body;

  // Validate input fields
  if (!employeeName || isNaN(hoursWorked) || isNaN(totalPay) || isNaN(totalDamages) || isNaN(finalTotalPay) || !date) {
    return res.status(400).json({ error: 'All fields are required and must be valid numbers.' });
  }

  // Check if a salary record for the same employee exists within the last 24 hours
  const checkQuery = `
    SELECT * FROM salaries 
    WHERE employee_name = ? 
    AND date >= datetime('now', '-1 day')
  `;
  
  db.get(checkQuery, [employeeName], (err, existingSalary) => {
    if (err) {
      console.error('Error checking existing salary record:', err.message);
      return res.status(500).json({ error: 'Database error while checking salary record.' });
    }

    if (existingSalary) {
      return res.status(400).json({ error: 'Daily salary already paid for the mentioned employee.' });
    }

    // Insert the new salary record
    const insertQuery = `
      INSERT INTO salaries (employee_name, hours_worked, total_pay, total_damages, final_total_pay, date) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertQuery, [employeeName, hoursWorked, totalPay, totalDamages, finalTotalPay, date], function (err) {
      if (err) {
        console.error('Error creating salary record:', err.message);
        return res.status(500).json({ error: 'An error occurred while creating the salary record. Please try again later.' });
      }
      res.status(201).json({ message: 'Salary record was created successfully!', id: this.lastID });
    });
  });
});

// Route to get salary records for a specific date
router.get('/', (req, res) => {
  const { date } = req.query;

  const sql = date
    ? 'SELECT * FROM salaries WHERE date = ?'
    : 'SELECT * FROM salaries';
  const params = date ? [date] : [];

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching salaries:', err.message);
      return res.status(500).json({ error: 'Unable to fetch salaries. Please try again later.' });
    }

    res.json({ salaries: rows });
  });
});

// Route to delete a salary record by id
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Salary id is required.' });
  }

  const deleteQuery = 'DELETE FROM salaries WHERE id = ?';

  db.run(deleteQuery, [id], function (err) {
    if (err) {
      console.error('Error deleting salary record:', err.message);
      return res.status(500).json({ error: 'An error occurred while deleting the salary record. Please try again later.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Salary record not found.' });
    }

    res.json({ message: 'Salary record deleted successfully!' });
  });
});

module.exports = router;


