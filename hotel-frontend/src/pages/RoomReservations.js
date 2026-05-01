import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoomReservations.css';

const API = 'http://localhost:3001/api';

const ROOM_TYPE_IMAGES = {
  'Standard':   'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
  'Deluxe':     'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
  'Suite':      'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&q=80',
  'Executive':  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
  'Family':     'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80',
  'Penthouse':  'https://images.unsplash.com/photo-1609949279531-cf48d64bed89?w=600&q=80',
  'Accessible': 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600&q=80',
};

export default function RoomReservations() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomFilter, setRoomFilter] = useState('all');
  const [availableForDates, setAvailableForDates] = useState(null);
  const [form, setForm] = useState({
    newGuestName: '', newGuestEmail: '', newGuestPhone: '',
    roomID: '', checkInDate: '', checkOutDate: '', numGuests: ''
  });

  // My Reservations state
  const [myEmail, setMyEmail] = useState('');
  const [myReservations, setMyReservations] = useState(null);
  const [myError, setMyError] = useState('');
  const [myLoading, setMyLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const [roomRes, typeRes] = await Promise.all([
        axios.get(`${API}/rooms`),
        axios.get(`${API}/room-types`),
      ]);
      setRooms(roomRes.data);
      setRoomTypes(typeRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableForDates = async (checkIn, checkOut) => {
    if (!checkIn || !checkOut) { setAvailableForDates(null); return; }
    try {
      const res = await axios.get(`${API}/rooms/available`, { params: { checkIn, checkOut } });
      setAvailableForDates(res.data);
    } catch { setAvailableForDates(null); }
  };

  const availableRoomsForType = (typeName) => {
    const list = availableForDates || rooms.filter(r => r.status === 'available');
    return list.filter(r => r.typename === typeName);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setSelectedRoom(null);
    setForm(f => ({ ...f, roomID: '' }));
    setTimeout(() => document.getElementById('res-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleRoomSelect = (e) => {
    const roomID = e.target.value;
    const room = rooms.find(r => String(r.roomid) === String(roomID));
    setSelectedRoom(room || null);
    setForm(f => ({ ...f, roomID }));
  };

  const handleDateChange = (field, value) => {
    const updated = { ...form, [field]: value, roomID: '' };
    setForm(updated);
    setSelectedRoom(null);
    const checkIn = field === 'checkInDate' ? value : form.checkInDate;
    const checkOut = field === 'checkOutDate' ? value : form.checkOutDate;
    fetchAvailableForDates(checkIn, checkOut);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const guestID = Date.now() % 100000;
      const reservationID = Math.floor(Math.random() * 90000) + 10000;

      await axios.post(`${API}/guests`, {
        guestID,
        fullName: form.newGuestName,
        email: form.newGuestEmail,
        phone: form.newGuestPhone,
      });
      await axios.post(`${API}/room-reservations`, {
        roomReservationID: reservationID,
        guestID,
        roomID: form.roomID,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        numGuests: form.numGuests,
        status: 'confirmed',
      });
      setSuccess(`Reservation #${reservationID} created successfully!`);
      setForm({ newGuestName: '', newGuestEmail: '', newGuestPhone: '', roomID: '', checkInDate: '', checkOutDate: '', numGuests: '' });
      setSelectedRoom(null);
      setSelectedType(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create reservation');
    }
  };

  const getRoomBadge = (status) => {
    const map = { available: 'badge-available', occupied: 'badge-occupied', maintenance: 'badge-maintenance' };
    return `badge ${map[status] || ''}`;
  };

  const nights = () => {
    if (!form.checkInDate || !form.checkOutDate) return 0;
    const diff = new Date(form.checkOutDate) - new Date(form.checkInDate);
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const filteredRooms = roomFilter === 'available' ? rooms.filter(r => r.status === 'available') : rooms;

  const handleLookup = async (e) => {
    e.preventDefault();
    setMyError(''); setMyReservations(null); setMyLoading(true);
    try {
      const guestRes = await axios.get(`${API}/guests/email/${encodeURIComponent(myEmail)}`);
      const guest = guestRes.data;
      const resRes = await axios.get(`${API}/room-reservations/guest/${guest.guestid}`);
      setMyReservations({ guest, reservations: resRes.data });
    } catch (err) {
      setMyError(err.response?.data?.error || 'No guest found with that email');
    } finally {
      setMyLoading(false);
    }
  };

  const handleCancelMy = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await axios.delete(`${API}/room-reservations/${id}`);
      const updated = myReservations.reservations.map(r =>
        r.roomreservationid === id ? { ...r, status: 'cancelled' } : r
      );
      setMyReservations({ ...myReservations, reservations: updated });
    } catch (err) {
      setMyError('Failed to cancel reservation');
    }
  };

  const getResBadge = (status) => {
    const map = { confirmed: 'badge-confirmed', cancelled: 'badge-cancelled' };
    return `badge ${map[status] || ''}`;
  };

  return (
    <div>
      <h1>Room Reservations</h1>

      <div className="card">
        <h2>Choose a Room Type</h2>
        <div className="room-type-grid">
          {roomTypes.map(rt => {
            const available = availableRoomsForType(rt.typename).length;
            const isSelected = selectedType?.roomtypeid === rt.roomtypeid;
            return (
              <div
                key={rt.roomtypeid}
                className={`room-type-card ${isSelected ? 'room-type-selected' : ''} ${available === 0 ? 'room-type-unavailable' : ''}`}
                onClick={() => available > 0 && handleTypeSelect(rt)}
              >
                <div className="room-type-img" style={{ backgroundImage: `url('${ROOM_TYPE_IMAGES[rt.typename] || ''}')` }} />
                <div className="room-type-body">
                  <h3>{rt.typename}</h3>
                  <p>Up to {rt.capacity} guests</p>
                  <p className="room-type-price">${rt.baseprice}<span>/night</span></p>
                  <p className="room-type-avail">{available > 0 ? `${available} room${available > 1 ? 's' : ''} available` : 'No rooms available'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedType && (
        <div className="card" id="res-form">
          <h2>Book a {selectedType.typename} Room</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: '#555', display: 'block', marginBottom: '0.5rem' }}>Guest Details</label>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Jane Smith" value={form.newGuestName} onChange={e => setForm({ ...form, newGuestName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="jane@email.com" value={form.newGuestEmail} onChange={e => setForm({ ...form, newGuestEmail: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" placeholder="602-555-0000" value={form.newGuestPhone} onChange={e => setForm({ ...form, newGuestPhone: e.target.value })} required />
                </div>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Room</label>
                {availableForDates !== null && availableRoomsForType(selectedType.typename).length === 0 ? (
                  <div style={{ background: '#fff0f0', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.75rem 1rem', color: '#c0392b', fontSize: '0.88rem', fontWeight: 600 }}>
                    No {selectedType.typename} rooms available for these dates. Please choose different dates.
                  </div>
                ) : (
                  <select value={form.roomID} onChange={handleRoomSelect} required>
                    <option value="">
                      {availableForDates === null ? 'Enter dates first to see available rooms' : 'Select a room'}
                    </option>
                    {availableRoomsForType(selectedType.typename).map(r => (
                      <option key={r.roomid} value={r.roomid}>Room {r.roomid} — Floor {r.floor}</option>
                    ))}
                  </select>
                )}
                {availableForDates === null && (
                  <p style={{ fontSize: '0.78rem', color: '#999', marginTop: '0.3rem' }}>Select check-in and check-out dates to see available rooms</p>
                )}
              </div>
              <div className="form-group">
                <label>Check-In Date</label>
                <input type="date" value={form.checkInDate} onChange={e => handleDateChange('checkInDate', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Check-Out Date</label>
                <input type="date" value={form.checkOutDate} onChange={e => handleDateChange('checkOutDate', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Number of Guests</label>
                <input type="number" min="1" max={selectedType.capacity} value={form.numGuests} onChange={e => setForm({ ...form, numGuests: e.target.value })} required />
              </div>
            </div>
            {nights() > 0 && (
              <div style={{ background: '#f0f4ff', border: '1px solid #d0d9ff', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
                <strong>{selectedType.typename}</strong> | Capacity: {selectedType.capacity} guests | ${selectedType.baseprice}/night
                <span style={{ marginLeft: '1rem', color: '#e94560', fontWeight: 700 }}>
                  Estimated Total: ${(selectedType.baseprice * nights()).toFixed(2)} ({nights()} nights)
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary">Create Reservation</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setSelectedType(null); setSelectedRoom(null); }}>← Back</button>
            </div>
          </form>
        </div>
      )}

      {/* My Reservations */}
      <div className="card">
        <h2>My Reservations</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter your email to view and manage your room reservations</p>
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={myEmail}
            onChange={e => setMyEmail(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={myLoading}>
            {myLoading ? 'Looking up...' : 'Look Up'}
          </button>
        </form>
        {myError && <div className="error">{myError}</div>}
        {myReservations && (
          <>
            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '1rem' }}>
              Showing reservations for <strong>{myReservations.guest.fullname}</strong>
            </p>
            {myReservations.reservations.length === 0 ? (
              <p style={{ color: '#888' }}>No room reservations found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Room</th><th>Type</th><th>Check-In</th><th>Check-Out</th><th>Guests</th><th>Status</th><th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myReservations.reservations.map(r => (
                    <tr key={r.roomreservationid}>
                      <td>{r.roomreservationid}</td>
                      <td>Room {r.roomid}</td>
                      <td>{r.typename}</td>
                      <td>{new Date(r.checkindate).toLocaleDateString()}</td>
                      <td>{new Date(r.checkoutdate).toLocaleDateString()}</td>
                      <td>{r.numguests}</td>
                      <td><span className={getResBadge(r.status)}>{r.status}</span></td>
                      <td>{new Date(r.createdat).toLocaleDateString()}</td>
                      <td>
                        {r.status !== 'cancelled' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancelMy(r.roomreservationid)}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.2rem' }}>All Rooms</h2>
            <p style={{ color: '#888', fontSize: '0.82rem', margin: 0 }}>Total: {rooms.length} rooms</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`btn btn-sm ${roomFilter === 'all' ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setRoomFilter('all')}>All</button>
            <button className={`btn btn-sm ${roomFilter === 'available' ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setRoomFilter('available')}>Available Only</button>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Room ID</th><th>Floor</th><th>Type</th><th>Capacity</th><th>Price/Night</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filteredRooms.map(r => (
              <tr key={r.roomid}>
                <td>{r.roomid}</td>
                <td>{r.floor}</td>
                <td>{r.typename}</td>
                <td>{r.capacity}</td>
                <td>${r.baseprice}</td>
                <td><span className={getRoomBadge(r.status)}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}