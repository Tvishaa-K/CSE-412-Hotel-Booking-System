# Grand Vista Hotel - Booking System

**CSE 412 — Group 17**
Tvishaa Kandala, Joyce Lu, Shukri Muhidin

## What This App Does

This is a web-based hotel booking system that lets users manage hotel room reservations, event space reservations, guests, and optional room upgrades. It was built as a full-stack application that connects to a PostgreSQL database we designed in Phase 1 and 2.

The app supports:
- Browsing and managing hotel guests
- Viewing rooms by type and availability
- Booking rooms for overnight stays (with check-in/check-out dates)
- Reserving event spaces by the hour
- Adding optional upgrades to room reservations (breakfast, late checkout, extra bed, airport transfer, parking, spa access)
- Cancelling reservations
- Preventing double-bookings for rooms and spaces

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL
- **Library:** pg (node-postgres)

## Database Schema

The database has 7 tables based on our ER diagram:

- `Guest` — stores guest info (name, email, phone)
- `RoomType` — room categories with capacity and base price (Standard, Deluxe, Suite, Executive, Family, Penthouse, Accessible)
- `Room` — individual rooms with floor and status
- `Space` — event spaces with capacity and hourly rate
- `Upgrade` — optional add-ons for room reservations
- `RoomReservation` — room bookings linked to a guest and room
- `SpaceReservation` — space bookings linked to a guest and space
- `RoomReservationUpgrade` — bridge table linking upgrades to room reservations

## Project Structure

```
CSE-412-Hotel-Booking-System/
├── hotel-backend/      # Express API server
│   ├── index.js        # Entry point
│   ├── db.js           # PostgreSQL connection
│   └── routes/         # API routes for each table
├── hotel-frontend/     # React app
│   └── src/
│       └── pages/      # One page per feature
```

## How to Run

### 1. Set up the database

```bash
psql -U postgres -c "CREATE DATABASE hotel_db;"
psql -U postgres -d hotel_db -f phase2.sql
psql -U postgres -d hotel_db -f insert.sql
```

### 2. Start the backend

```bash
cd hotel-backend
npm install
node index.js
```

Runs on `http://localhost:3001`. Update `db.js` with your PostgreSQL credentials (we used host `/tmp`, port `8888`).

### 3. Start the frontend

```bash
cd hotel-frontend
npm install
npm start
```

Opens at `http://localhost:3000`.

## Pages

| Page | What it does |
|------|-------------|
| Home | Landing page with navigation to main features |
| Room Reservations | Create, view, update, and cancel room bookings. Prevents overlapping reservations. |
| Space Reservations | Book event spaces by time slot. Prevents overlapping reservations. |
| Rooms | View all rooms with type, floor, and availability status |
| Guests | Add, edit, and delete guests. Deleting a guest also removes all their reservations. |
| Upgrades | View all available upgrades and their prices |
| Staff | Staff information page |

## Data

The database is seeded with:
- 25 guests
- 25 rooms across 7 room types
- 6 event spaces (Conference Room A & B, Banquet Hall, Club Lounge, Rooftop Space, Board Room)
- 6 upgrades (Breakfast $20, Late Checkout $30, Extra Bed $50, Airport Transfer $45, Parking $15, Spa Access $60)
- 25 room reservations and 20 space reservations
