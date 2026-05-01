import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SpaceReservations.css';

const API = 'http://localhost:3001/api';

const SPACE_IMAGES = {
  'Conference Room A': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
  'Conference Room B': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&q=80',
  'Banquet Hall':      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80',
  'Club Lounge':       'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80',
  'Rooftop Space':     'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80',
  'Board Room':        'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=600&q=80',
};

export default function SpaceReservations() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [form, setForm] = useState({
    newGuestName: '', newGuestEmail: '', newGuestPhone: '',
    spaceID: '', startDateTime: '', endDateTime: '', numAttendees: '', status: 'confirmed'
  });

  // My Reservations state
  const [timeConflict, setTimeConflict] = useState(null);
  const [myEmail, setMyEmail] = useState('');
  const [myReservations, setMyReservations] = useState(null);
  const [myError, setMyError] = useState('');
  const [myLoading, setMyLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const spaceRes = await axios.get(`${API}/spaces`);
      setSpaces(spaceRes.data);
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

  const handleSpaceSelect = (space) => {
    if (space.status !== 'available') return;
    setSelectedSpace(space);
    setForm(f => ({ ...f, spaceID: space.spaceid }));
    setTimeout(() => document.getElementById('space-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const checkTimeAvailability = async (spaceID, start, end) => {
    if (!spaceID || !start || !end) { setTimeConflict(null); return; }
    try {
      const res = await axios.get(`${API}/space-reservations/check/availability`, { params: { spaceID, start, end } });
      setTimeConflict(res.data.available ? null : res.data.conflicts);
    } catch { setTimeConflict(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const newID = Math.floor(Math.random() * 90000) + 10000;
      const guestID = Date.now() % 100000;
      await axios.post(`${API}/guests`, {
        guestID,
        fullName: form.newGuestName,
        email: form.newGuestEmail,
        phone: form.newGuestPhone,
      });
      await axios.post(`${API}/space-reservations`, {
        spaceReservationID: newID,
        guestID,
        spaceID: form.spaceID,
        startDateTime: form.startDateTime,
        endDateTime: form.endDateTime,
        numAttendees: form.numAttendees,
        status: form.status,
      });
      setSuccess(`Space reservation #${newID} created successfully!`);
      setForm({ newGuestName: '', newGuestEmail: '', newGuestPhone: '', spaceID: '', startDateTime: '', endDateTime: '', numAttendees: '', status: 'confirmed' });
      setSelectedSpace(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create reservation');
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setMyError(''); setMyReservations(null); setMyLoading(true);
    try {
      const guestRes = await axios.get(`${API}/guests/email/${encodeURIComponent(myEmail)}`);
      const guest = guestRes.data;
      const resRes = await axios.get(`${API}/space-reservations/guest/${guest.guestid}`);
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
      await axios.delete(`${API}/space-reservations/${id}`);
      const updated = myReservations.reservations.map(r =>
        r.spacereservationid === id ? { ...r, status: 'cancelled' } : r
      );
      setMyReservations({ ...myReservations, reservations: updated });
    } catch (err) {
      setMyError('Failed to cancel reservation');
    }
  };

  const getSpaceBadge = (status) => {
    const map = { available: 'badge-available', reserved: 'badge-reserved', maintenance: 'badge-maintenance' };
    return `badge ${map[status] || ''}`;
  };

  const getResBadge = (status) => {
    const map = { confirmed: 'badge-confirmed', cancelled: 'badge-cancelled' };
    return `badge ${map[status] || ''}`;
  };

  const hours = () => {
    if (!form.startDateTime || !form.endDateTime) return 0;
    const diff = new Date(form.endDateTime) - new Date(form.startDateTime);
    return Math.max(0, (diff / (1000 * 60 * 60)).toFixed(1));
  };

  return (
    <div>
      <h1>Space Reservations</h1>

      {/* Space Cards */}
      <div className="card">
        <h2>Choose a Space</h2>
        <div className="space-grid">
          {spaces.map(s => {
            const isSelected = selectedSpace?.spaceid === s.spaceid;
            const unavailable = s.status !== 'available';
            return (
              <div
                key={s.spaceid}
                className={`space-card ${isSelected ? 'space-selected' : ''} ${unavailable ? 'space-unavailable' : ''}`}
                onClick={() => handleSpaceSelect(s)}
              >
                <div className="space-img" style={{ backgroundImage: `url('${SPACE_IMAGES[s.spacename] || ''}')` }} />
                <div className="space-body">
                  <h3>{s.spacename}</h3>
                  <p>Capacity: {s.capacity} people</p>
                  <p className="space-price">${s.hourlyrate}<span>/hr</span></p>
                  <span className={getSpaceBadge(s.status)}>{s.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Form */}
      {selectedSpace && (
        <div className="card" id="space-form">
          <h2>Reserve {selectedSpace.spacename}</h2>
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
                <label>Start Date &amp; Time</label>
                <input type="datetime-local" value={form.startDateTime} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, startDateTime: v })); checkTimeAvailability(form.spaceID, v, form.endDateTime); }} required />
              </div>
              <div className="form-group">
                <label>End Date &amp; Time</label>
                <input type="datetime-local" value={form.endDateTime} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, endDateTime: v })); checkTimeAvailability(form.spaceID, form.startDateTime, v); }} required />
              </div>
              <div className="form-group">
                <label>Number of Attendees</label>
                <input type="number" min="1" max={selectedSpace.capacity} value={form.numAttendees} onChange={e => setForm({ ...form, numAttendees: e.target.value })} required />
              </div>
            </div>
            {hours() > 0 && (
              <div style={{ background: '#f0f4ff', border: '1px solid #d0d9ff', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
                <strong>{selectedSpace.spacename}</strong> | Capacity: {selectedSpace.capacity} | ${selectedSpace.hourlyrate}/hr
                <span style={{ marginLeft: '1rem', color: '#e94560', fontWeight: 700 }}>
                  Estimated Total: ${(selectedSpace.hourlyrate * hours()).toFixed(2)} ({hours()} hrs)
                </span>
              </div>
            )}
            {timeConflict && (
              <div style={{ background: '#fff0f0', border: '1px solid #f5c6cb', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#c0392b', fontSize: '0.88rem' }}>
                <strong>This space is already booked during your selected time:</strong>
                <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0 }}>
                  {timeConflict.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
                Please choose a different time slot.
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={!!timeConflict}>Create Reservation</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setSelectedSpace(null); setTimeConflict(null); }}>← Back</button>
            </div>
          </form>
        </div>
      )}

      {/* My Reservations */}
      <div className="card">
        <h2>My Reservations</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter your email to view and manage your space reservations</p>
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
              <p style={{ color: '#888' }}>No space reservations found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Space</th><th>Start</th><th>End</th><th>Attendees</th><th>Status</th><th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myReservations.reservations.map(r => (
                    <tr key={r.spacereservationid}>
                      <td>{r.spacereservationid}</td>
                      <td>{r.spacename}</td>
                      <td>{new Date(r.startdatetime).toLocaleString()}</td>
                      <td>{new Date(r.enddatetime).toLocaleString()}</td>
                      <td>{r.numattendees}</td>
                      <td><span className={getResBadge(r.status)}>{r.status}</span></td>
                      <td>{new Date(r.createdat).toLocaleDateString()}</td>
                      <td>
                        {r.status !== 'cancelled' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancelMy(r.spacereservationid)}>Cancel</button>
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

    </div>
  );
}
