const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all guests
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Guest ORDER BY guestID');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET guest by email
router.get('/email/:email', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Guest WHERE email = $1', [req.params.email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single guest
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Guest WHERE guestID = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create guest
router.post('/', async (req, res) => {
  const { guestID, fullName, email, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Guest (guestID, fullName, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [guestID, fullName, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update guest
router.put('/:id', async (req, res) => {
  const { fullName, email, phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Guest SET fullName = $1, email = $2, phone = $3 WHERE guestID = $4 RETURNING *',
      [fullName, email, phone, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE guest 
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove upgrades linked to this guest's room reservations
    await client.query(`
      DELETE FROM RoomReservationUpgrade
      WHERE roomReservationID IN (
        SELECT roomReservationID FROM RoomReservation WHERE guestID = $1
      )
    `, [req.params.id]);

    // Delete room reservations
    await client.query('DELETE FROM RoomReservation WHERE guestID = $1', [req.params.id]);

    // Delete space reservations
    await client.query('DELETE FROM SpaceReservation WHERE guestID = $1', [req.params.id]);

    // Delete the guest
    const result = await client.query('DELETE FROM Guest WHERE guestID = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Guest not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Guest deleted', guest: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
