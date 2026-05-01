const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all rooms with status matching active reservations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.roomID, r.floor,
        CASE
          WHEN r.status = 'maintenance' THEN 'maintenance'
          WHEN EXISTS (
            SELECT 1 FROM RoomReservation rr
            WHERE rr.roomID = r.roomID
              AND rr.status != 'cancelled'
              AND rr.checkInDate <= CURRENT_DATE
              AND rr.checkOutDate > CURRENT_DATE
          ) THEN 'occupied'
          ELSE 'available'
        END AS status,
        rt.roomTypeID, rt.typeName, rt.capacity, rt.basePrice
      FROM Room r
      LEFT JOIN RoomType rt ON r.roomTypeID = rt.roomTypeID
      ORDER BY r.roomID
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET available rooms filtered by specific date range
router.get('/available', async (req, res) => {
  const { checkIn, checkOut } = req.query;
  try {
    let result;
    if (checkIn && checkOut) {
      // Return rooms with no overlapping reservations for the requested dates
      result = await pool.query(`
        SELECT r.roomID, r.floor, 'available' AS status,
          rt.roomTypeID, rt.typeName, rt.capacity, rt.basePrice
        FROM Room r
        LEFT JOIN RoomType rt ON r.roomTypeID = rt.roomTypeID
        WHERE r.status != 'maintenance'
          AND NOT EXISTS (
            SELECT 1 FROM RoomReservation rr
            WHERE rr.roomID = r.roomID
              AND rr.status != 'cancelled'
              AND rr.checkInDate < $2
              AND rr.checkOutDate > $1
          )
        ORDER BY r.roomID
      `, [checkIn, checkOut]);
    } else {
      result = await pool.query(`
        SELECT r.roomID, r.floor, 'available' AS status,
          rt.roomTypeID, rt.typeName, rt.capacity, rt.basePrice
        FROM Room r
        LEFT JOIN RoomType rt ON r.roomTypeID = rt.roomTypeID
        WHERE r.status != 'maintenance'
          AND NOT EXISTS (
            SELECT 1 FROM RoomReservation rr
            WHERE rr.roomID = r.roomID
              AND rr.status != 'cancelled'
              AND rr.checkOutDate > CURRENT_DATE
          )
        ORDER BY r.roomID
      `);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single room
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.roomID, r.floor, r.status, rt.roomTypeID, rt.typeName, rt.capacity, rt.basePrice
      FROM Room r
      JOIN RoomType rt ON r.roomTypeID = rt.roomTypeID
      WHERE r.roomID = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create room
router.post('/', async (req, res) => {
  const { roomID, floor, status, roomTypeID } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Room (roomID, floor, status, roomTypeID) VALUES ($1, $2, $3, $4) RETURNING *',
      [roomID, floor, status, roomTypeID]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update room status
router.put('/:id', async (req, res) => {
  const { floor, status, roomTypeID } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Room SET floor = $1, status = $2, roomTypeID = $3 WHERE roomID = $4 RETURNING *',
      [floor, status, roomTypeID, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
