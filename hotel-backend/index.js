const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/guests', require('./routes/guests'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/room-types', require('./routes/roomTypes'));
app.use('/api/spaces', require('./routes/spaces'));
app.use('/api/upgrades', require('./routes/upgrades'));
app.use('/api/room-reservations', require('./routes/roomReservations'));
app.use('/api/space-reservations', require('./routes/spaceReservations'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Hotel Booking API is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
