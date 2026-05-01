# Hotel Booking API

Express + PostgreSQL backend for CSE 412 Phase 3.

## Setup

1. Install dependencies:
```
npm install
```

2. Create a `.env` file (already included as template):
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3001
```

3. Set up the database:
```
psql -U postgres -c "CREATE DATABASE hotel_db;"
psql -U postgres -d hotel_db -f phase2.sql
psql -U postgres -d hotel_db -f insert.sql
```

4. Start the server:
```
node index.js
```

## API Endpoints

### Guests
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/guests | Get all guests |
| GET | /api/guests/:id | Get single guest |
| POST | /api/guests | Create guest |
| PUT | /api/guests/:id | Update guest |
| DELETE | /api/guests/:id | Delete guest |

### Rooms
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/rooms | Get all rooms (with type info) |
| GET | /api/rooms/available | Get available rooms only |
| GET | /api/rooms/:id | Get single room |
| POST | /api/rooms | Create room |
| PUT | /api/rooms/:id | Update room |

### Room Types
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/room-types | Get all room types |
| GET | /api/room-types/:id | Get single room type |
| POST | /api/room-types | Create room type |
| PUT | /api/room-types/:id | Update room type |

### Spaces
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/spaces | Get all spaces |
| GET | /api/spaces/available | Get available spaces |
| GET | /api/spaces/:id | Get single space |
| POST | /api/spaces | Create space |
| PUT | /api/spaces/:id | Update space |

### Upgrades
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/upgrades | Get all upgrades |
| GET | /api/upgrades/:id | Get single upgrade |
| POST | /api/upgrades | Create upgrade |
| PUT | /api/upgrades/:id | Update upgrade |
| DELETE | /api/upgrades/:id | Delete upgrade |

### Room Reservations
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/room-reservations | Get all (with guest + room info) |
| GET | /api/room-reservations/:id | Get single (includes upgrades) |
| GET | /api/room-reservations/guest/:guestID | Get by guest |
| POST | /api/room-reservations | Create (checks overlap) |
| PUT | /api/room-reservations/:id | Update status |
| DELETE | /api/room-reservations/:id | Cancel reservation |
| POST | /api/room-reservations/:id/upgrades | Add upgrade |
| DELETE | /api/room-reservations/:id/upgrades/:upgradeID | Remove upgrade |

### Space Reservations
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/space-reservations | Get all (with guest + space info) |
| GET | /api/space-reservations/:id | Get single |
| GET | /api/space-reservations/guest/:guestID | Get by guest |
| POST | /api/space-reservations | Create (checks overlap) |
| PUT | /api/space-reservations/:id | Update status |
| DELETE | /api/space-reservations/:id | Cancel reservation |
