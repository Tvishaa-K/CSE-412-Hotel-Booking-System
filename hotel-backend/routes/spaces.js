const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all spaces with status matching active reservations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.spaceID, s.spaceName, s.capacity, s.hourlyRate,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM SpaceReservation sr
            WHERE sr.spaceID = s.spaceID
              AND sr.status != 'cancelled'
              AND sr.startDateTime <= NOW()
              AND sr.endDateTime > NOW()
          ) THEN 'reserved'
          ELSE 'available'
        END AS status
      FROM Space s
      ORDER BY s.spaceID
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET available spaces
router.get('/available', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.spaceID, s.spaceName, s.capacity, s.hourlyRate, 'available' AS status
      FROM Space s
      WHERE NOT EXISTS (
        SELECT 1 FROM SpaceReservation sr
        WHERE sr.spaceID = s.spaceID
          AND sr.status != 'cancelled'
          AND sr.endDateTime > NOW()
      )
      ORDER BY s.spaceID
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single space
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Space WHERE spaceID = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create space
router.post('/', async (req, res) => {
  const { spaceID, spaceName, capacity, hourlyRate, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Space (spaceID, spaceName, capacity, hourlyRate, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [spaceID, spaceName, capacity, hourlyRate, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update space
router.put('/:id', async (req, res) => {
  const { spaceName, capacity, hourlyRate, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Space SET spaceName = $1, capacity = $2, hourlyRate = $3, status = $4 WHERE spaceID = $5 RETURNING *',
      [spaceName, capacity, hourlyRate, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Space not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
