const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all space reservations with guest and space info
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sr.spaceReservationID, g.fullName, g.guestID, s.spaceID, s.spaceName,
             s.hourlyRate, sr.startDateTime, sr.endDateTime, sr.numAttendees,
             sr.status, sr.createdAt
      FROM SpaceReservation sr
      JOIN Guest g ON sr.guestID = g.guestID
      JOIN Space s ON sr.spaceID = s.spaceID
      ORDER BY sr.spaceReservationID
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single space reservation
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sr.spaceReservationID, g.fullName, g.guestID, s.spaceID, s.spaceName,
             s.capacity, s.hourlyRate, sr.startDateTime, sr.endDateTime,
             sr.numAttendees, sr.status, sr.createdAt
      FROM SpaceReservation sr
      JOIN Guest g ON sr.guestID = g.guestID
      JOIN Space s ON sr.spaceID = s.spaceID
      WHERE sr.spaceReservationID = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET availability check for a space and time range
router.get('/check/availability', async (req, res) => {
  const { spaceID, start, end } = req.query;
  try {
    const overlap = await pool.query(`
      SELECT startDateTime, endDateTime FROM SpaceReservation
      WHERE spaceID = $1
        AND status != 'cancelled'
        AND startDateTime < $3
        AND endDateTime > $2
      ORDER BY startDateTime
    `, [spaceID, start, end]);
    if (overlap.rows.length > 0) {
      const conflicts = overlap.rows.map(r =>
        `${new Date(r.startdatetime).toLocaleString()} – ${new Date(r.enddatetime).toLocaleString()}`
      );
      res.json({ available: false, conflicts });
    } else {
      res.json({ available: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET reservations for a specific guest
router.get('/guest/:guestID', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sr.spaceReservationID, s.spaceName, sr.startDateTime, sr.endDateTime,
             sr.numAttendees, sr.status, sr.createdAt
      FROM SpaceReservation sr
      JOIN Space s ON sr.spaceID = s.spaceID
      WHERE sr.guestID = $1
      ORDER BY sr.startDateTime
    `, [req.params.guestID]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create space reservation (with overlap check)
router.post('/', async (req, res) => {
  const { spaceReservationID, guestID, spaceID, startDateTime, endDateTime, numAttendees, status } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check for overlapping reservation
    const overlap = await client.query(`
      SELECT spaceReservationID FROM SpaceReservation
      WHERE spaceID = $1
        AND status != 'cancelled'
        AND startDateTime < $3
        AND endDateTime > $2
    `, [spaceID, startDateTime, endDateTime]);

    if (overlap.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Space is already booked for that time period' });
    }

    const result = await client.query(`
      INSERT INTO SpaceReservation (spaceReservationID, guestID, spaceID, startDateTime, endDateTime, numAttendees, status, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *
    `, [spaceReservationID, guestID, spaceID, startDateTime, endDateTime, numAttendees, status || 'confirmed']);

    // Mark space as reserved
    await client.query(
      "UPDATE Space SET status = 'reserved' WHERE spaceID = $1",
      [spaceID]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update space reservation status
router.put('/:id', async (req, res) => {
  const { status, numAttendees } = req.body;
  try {
    const result = await pool.query(
      'UPDATE SpaceReservation SET status = $1, numAttendees = $2 WHERE spaceReservationID = $3 RETURNING *',
      [status, numAttendees, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (cancel) space reservation
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      "UPDATE SpaceReservation SET status = 'cancelled' WHERE spaceReservationID = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const spaceID = result.rows[0].spaceid;
    // Check if any other active reservations exist for this space
    const others = await client.query(
      "SELECT 1 FROM SpaceReservation WHERE spaceID = $1 AND status != 'cancelled' AND spaceReservationID != $2",
      [spaceID, req.params.id]
    );
    // If no other active reservations, set space back to available
    if (others.rows.length === 0) {
      await client.query(
        "UPDATE Space SET status = 'available' WHERE spaceID = $1 AND status = 'reserved'",
        [spaceID]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Reservation cancelled', reservation: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
