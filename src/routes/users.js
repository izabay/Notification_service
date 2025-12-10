const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query('SELECT id, name, email FROM users');
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', 
  body('name').notEmpty(),
  body('email').isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const connection = await db.getConnection();
      const { name, email } = req.body;
      const [result] = await connection.query(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [name, email]
      );
      connection.release();
      res.status(201).json({ id: result.insertId, name, email });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
