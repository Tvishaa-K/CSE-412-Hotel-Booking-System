const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all room reservations with guest and room info
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rr.roomReservationID, g.fullName, g.guestID, r.roomID, r.floor,
             rt.typeName, rr.checkInDate, rr.checkOutDate, rr.numGuests,
             rr.status, rr.createdAt
      FROM RoomReservation rr
      JOIN Guest g ON rr.guestID = g.guestID
      JOIN Room r ON rr.roomID = r.roomID
      JOIN RoomType rt ON r.roomTypeID = rt.roomTypeID
      ORDER BY rr.roomReservationID
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all reservation-upgrade links 
router.get('/upgrades/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rru.roomReservationID, g.fullName, r.roomID, rt.typeName,
             u.upgradeID, u.upgradeName, u.description, u.price, rru.quantity,
             (u.price * rru.quantity) AS total
      FROM RoomReservationUpgrade rru
      JOIN RoomReservation rr ON rru.roomReservationID = rr.roomReservationID
      JOIN Guest g ON rr.guestID = g.guestID
      JOIN Room r ON rr.roomID = r.roomID
      JOIN RoomType rt ON r.roomTypeID = rt.roomTypeID
      JOIN Upgrade u ON rru.upgradeID = u.upgradeID
      ORDER BY rru.roomReservationID
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single room reservation with upgrades
router.get('/:id', async (req, res) => {
  try {
    const resResult = await pool.query(`
      SELECT rr.roomReservationID, g.fullName, g.guestID, r.roomID, r.floor,
             rt.typeName, rt.basePrice, rr.checkInDate, rr.checkOutDate,
             rr.numGuests, rr.status, rr.createdAt
      FROM RoomReservation rr
      JOIN Guest g ON rr.guestID = g.guestID
      JOIN Room r ON rr.roomID = r.roomID
      JOIN RoomType rt ON r.roomTypeID = rt.roomTypeID
      WHERE rr.roomReservationID = $1
    `, [req.params.id]);

    if (resResult.rows.length === 0) return res.status(404).json({ error: 'Reservation not found' });

    const upgradeResult = await pool.query(`
      SELECT u.upgradeID, u.upgradeName, u.price, rru.quantity
      FROM RoomReservationUpgrade rru
      JOIN Upgrade u ON rru.upgradeID = u.upgradeID
      WHERE rru.roomReservationID = $1
    `, [req.params.id]);

    res.json({ ...resResult.rows[0], upgrades: upgradeResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET reservations for a specific guest
router.get('/guest/:guestID', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rr.roomReservationID, r.roomID, r.floor, rt.typeName,
             rr.checkInDate, rr.checkOutDate, rr.numGuests, rr.status, rr.createdAt
      FROM RoomReservation rr
      JOIN Room r ON rr.roomID = r.roomID
      JOIN RoomType rt ON r.roomTypeID = rt.roomTypeID
      WHERE rr.guestID = $1
      ORDER BY rr.checkInDate
    `, [req.params.guestID]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create room reservation with overlap check
router.post('/', async (req, res) => {
  const { roomReservationID, guestID, roomID, checkInDate, checkOutDate, numGuests, status } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check for overlapping reservation
    const overlap = await client.query(`
      SELECT roomReservationID FROM RoomReservation
      WHERE roomID = $1
        AND status != 'cancelled'
        AND checkInDate < $3
        AND checkOutDate > $2
    `, [roomID, checkInDate, checkOutDate]);

    if (overlap.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Room is already booked for those dates' });
    }

    const result = await client.query(`
      INSERT INTO RoomReservation (roomReservationID, guestID, roomID, checkInDate, checkOutDate, numGuests, status, createdAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *
    `, [roomReservationID, guestID, roomID, checkInDate, checkOutDate, numGuests, status || 'confirmed']);

    // Update room status to occupied 
    await client.query(
      "UPDATE Room SET status = 'occupied' WHERE roomID = $1 AND status != 'maintenance'",
      [roomID]
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

// PUT update reservation status
router.put('/:id', async (req, res) => {
  const { status, numGuests } = req.body;
  try {
    const result = await pool.query(
      'UPDATE RoomReservation SET status = $1, numGuests = $2 WHERE roomReservationID = $3 RETURNING *',
      [status, numGuests, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// cancel reservation
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      "UPDATE RoomReservation SET status = 'cancelled' WHERE roomReservationID = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const roomID = result.rows[0].roomid;

    // Remove all upgrades linked to this reservation
    await client.query(
      'DELETE FROM RoomReservationUpgrade WHERE roomReservationID = $1',
      [req.params.id]
    );

    // Check if any other active reservations exist for this room
    const others = await client.query(
      "SELECT 1 FROM RoomReservation WHERE roomID = $1 AND status != 'cancelled' AND roomReservationID != $2",
      [roomID, req.params.id]
    );
    // If no other active reservations, set room back to available
    if (others.rows.length === 0) {
      await client.query(
        "UPDATE Room SET status = 'available' WHERE roomID = $1 AND status = 'occupied'",
        [roomID]
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

// POST add upgrade to reservation
router.post('/:id/upgrades', async (req, res) => {
  const { upgradeID, quantity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO RoomReservationUpgrade (roomReservationID, upgradeID, quantity) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, upgradeID, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE upgrade from reservation
router.delete('/:id/upgrades/:upgradeID', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM RoomReservationUpgrade WHERE roomReservationID = $1 AND upgradeID = $2 RETURNING *',
      [req.params.id, req.params.upgradeID]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Upgrade not found on this reservation' });
    res.json({ message: 'Upgrade removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
