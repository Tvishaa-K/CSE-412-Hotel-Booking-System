# Hotel Booking API

Backend for our CSE 412 hotel booking project. Built with Node.js, Express, and PostgreSQL.

## How to Run

1. Install dependencies:
```bash
npm install
```

2. Update `db.js` with your PostgreSQL credentials. We used host `/tmp` and port `8888`.

3. Set up the database:
```bash
psql -U postgres -c "CREATE DATABASE hotel_db;"
psql -U postgres -d hotel_db -f phase2.sql
psql -U postgres -d hotel_db -f insert.sql
```

4. Start the server:
```bash
node index.js
```

Server runs on `http://localhost:3001`.

## Routes

- `/api/guests`
- `/api/rooms`
- `/api/room-types`
- `/api/spaces`
- `/api/upgrades`
- `/api/room-reservations`
- `/api/space-reservations`
