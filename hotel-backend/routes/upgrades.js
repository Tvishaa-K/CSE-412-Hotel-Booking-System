const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all upgrades
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Upgrade ORDER BY upgradeID');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single upgrade
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Upgrade WHERE upgradeID = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Upgrade not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create upgrade
router.post('/', async (req, res) => {
  const { upgradeID, upgradeName, description, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Upgrade (upgradeID, upgradeName, description, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [upgradeID, upgradeName, description, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update upgrade
router.put('/:id', async (req, res) => {
  const { upgradeName, description, price } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Upgrade SET upgradeName = $1, description = $2, price = $3 WHERE upgradeID = $4 RETURNING *',
      [upgradeName, description, price, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Upgrade not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE upgrade (cleans up bridge table first)
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM RoomReservationUpgrade WHERE upgradeID = $1', [req.params.id]);
    const result = await client.query('DELETE FROM Upgrade WHERE upgradeID = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Upgrade not found' });
    }
    await client.query('COMMIT');
    res.json({ message: 'Upgrade deleted', upgrade: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
