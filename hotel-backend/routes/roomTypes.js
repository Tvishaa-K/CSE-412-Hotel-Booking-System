const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all room types
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM RoomType ORDER BY roomTypeID');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single room type
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM RoomType WHERE roomTypeID = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room type not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create room type
router.post('/', async (req, res) => {
  const { roomTypeID, typeName, capacity, basePrice } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO RoomType (roomTypeID, typeName, capacity, basePrice) VALUES ($1, $2, $3, $4) RETURNING *',
      [roomTypeID, typeName, capacity, basePrice]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update room type
router.put('/:id', async (req, res) => {
  const { typeName, capacity, basePrice } = req.body;
  try {
    const result = await pool.query(
      'UPDATE RoomType SET typeName = $1, capacity = $2, basePrice = $3 WHERE roomTypeID = $4 RETURNING *',
      [typeName, capacity, basePrice, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room type not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
