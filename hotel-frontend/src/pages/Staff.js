import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api';
const STAFF_CODE = '1234';

export default function Staff() {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [activeTab, setActiveTab] = useState('guests');

  const [guests, setGuests] = useState([]);
  const [guestForm, setGuestForm] = useState({ guestID: '', fullName: '', email: '', phone: '' });
  const [guestError, setGuestError] = useState('');
  const [guestSuccess, setGuestSuccess] = useState('');
  const [expandedGuest, setExpandedGuest] = useState(null);
  const [bookingGuest, setBookingGuest] = useState(null);
  const [bookingType, setBookingType] = useState(null);
  const [bookingForm, setBookingForm] = useState({});
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableSpaces, setAvailableSpaces] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [roomRes, setRoomRes] = useState([]);
  const [spaceRes, setSpaceRes] = useState([]);
  const [resUpgrades, setResUpgrades] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnlock = (e) => {
    e.preventDefault();
    if (code === STAFF_CODE) {
      setUnlocked(true);
    } else {
      setCodeError('Incorrect code. Please try again.');
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    const [gRes, rrRes, srRes, ruRes, uRes, rRes] = await Promise.allSettled([
      axios.get(`${API}/guests`),
      axios.get(`${API}/room-reservations`),
      axios.get(`${API}/space-reservations`),
      axios.get(`${API}/room-reservations/upgrades/all`),
      axios.get(`${API}/upgrades`),
      axios.get(`${API}/rooms`),
    ]);
    if (gRes.status === 'fulfilled')   setGuests(gRes.value.data);
    if (rrRes.status === 'fulfilled')  setRoomRes(rrRes.value.data);
    if (srRes.status === 'fulfilled')  setSpaceRes(srRes.value.data);
    if (ruRes.status === 'fulfilled')  setResUpgrades(ruRes.value.data);
    if (uRes.status === 'fulfilled')   setUpgrades(uRes.value.data);
    if (rRes.status === 'fulfilled')   setRooms(rRes.value.data);
    const rtRes = await Promise.allSettled([axios.get(`${API}/room-types`), axios.get(`${API}/spaces`)]);
    if (rtRes[0].status === 'fulfilled') setRoomTypes(rtRes[0].value.data);
    if (rtRes[1].status === 'fulfilled') setAvailableSpaces(rtRes[1].value.data.filter(s => s.status === 'available'));
    setLoading(false);
  };

  const openBooking = (guest, type) => {
    setBookingGuest(guest);
    setBookingType(type);
    setBookingForm({});
    setBookingError('');
    setBookingSuccess('');
    setAvailableRooms([]);
  };

  const fetchRoomsForDates = async (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return;
    try {
      const res = await axios.get(`${API}/rooms/available`, { params: { checkIn, checkOut } });
      setAvailableRooms(res.data);
    } catch { setAvailableRooms([]); }
  };

  const handleStaffBookRoom = async (e) => {
    e.preventDefault();
    setBookingError(''); setBookingSuccess('');
    try {
      const reservationID = Math.floor(Math.random() * 90000) + 10000;
      await axios.post(`${API}/room-reservations`, {
        roomReservationID: reservationID,
        guestID: bookingGuest.guestid,
        roomID: bookingForm.roomID,
        checkInDate: bookingForm.checkInDate,
        checkOutDate: bookingForm.checkOutDate,
        numGuests: bookingForm.numGuests,
        status: 'confirmed',
      });
      setBookingSuccess(`Room reservation #${reservationID} created!`);
      setBookingGuest(null);
      fetchAll();
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to create reservation');
    }
  };

  const handleStaffBookSpace = async (e) => {
    e.preventDefault();
    setBookingError(''); setBookingSuccess('');
    try {
      const reservationID = Math.floor(Math.random() * 90000) + 10000;
      await axios.post(`${API}/space-reservations`, {
        spaceReservationID: reservationID,
        guestID: bookingGuest.guestid,
        spaceID: bookingForm.spaceID,
        startDateTime: bookingForm.startDateTime,
        endDateTime: bookingForm.endDateTime,
        numAttendees: bookingForm.numAttendees,
        status: 'confirmed',
      });
      setBookingSuccess(`Space reservation #${reservationID} created!`);
      setBookingGuest(null);
      fetchAll();
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to create reservation');
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    setGuestError(''); setGuestSuccess('');
    try {
      await axios.post(`${API}/guests`, guestForm);
      setGuestSuccess('Guest added successfully');
      setGuestForm({ guestID: '', fullName: '', email: '', phone: '' });
      fetchAll();
    } catch (err) {
      setGuestError(err.response?.data?.error || 'Failed to add guest');
    }
  };

  const handleDeleteGuest = async (id) => {
    if (!window.confirm('Delete this guest and all their reservations?')) return;
    setGuestError('');
    try {
      await axios.delete(`${API}/guests/${id}`);
      fetchAll();
    } catch (err) {
      setGuestError(err.response?.data?.error || 'Failed to delete guest');
    }
  };

  const handleCancelRoom = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await axios.delete(`${API}/room-reservations/${id}`);
      fetchAll();
    } catch (err) {}
  };

  const handleCancelSpace = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await axios.delete(`${API}/space-reservations/${id}`);
      fetchAll();
    } catch (err) {}
  };

  const handleRemoveUpgradeFromRes = async (reservationID, upgradeID) => {
    if (!window.confirm('Remove this upgrade from the reservation?')) return;
    try {
      await axios.delete(`${API}/room-reservations/${reservationID}/upgrades/${upgradeID}`);
      fetchAll();
    } catch (err) {}
  };

  const handleUpdateRoomStatus = async (room, newStatus) => {
    try {
      await axios.put(`${API}/rooms/${room.roomid}`, {
        floor: room.floor,
        status: newStatus,
        roomTypeID: room.roomtypeid,
      });
      fetchAll();
    } catch (err) {}
  };

  const handleDeleteUpgrade = async (upgradeID, upgradeName) => {
    if (!window.confirm(`Delete upgrade "${upgradeName}" from the system? This will remove it from all reservations.`)) return;
    try {
      await axios.delete(`${API}/upgrades/${upgradeID}`);
      fetchAll();
    } catch (err) {}
  };

  const getBadge = (status) => {
    const map = { confirmed: 'badge-confirmed', cancelled: 'badge-cancelled' };
    return `badge ${map[status] || ''}`;
  };

  if (!unlocked) {
    return (
      <div style={{ maxWidth: 400, margin: '6rem auto', textAlign: 'center' }}>
        <div className="card">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Staff Access</h2>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter your staff code to continue</p>
          {codeError && <div className="error">{codeError}</div>}
          <form onSubmit={handleUnlock}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Enter staff code"
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{ width: '100%', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Staff Dashboard</h1>
        <button className="btn btn-danger btn-sm" onClick={() => { setUnlocked(false); setCode(''); }}>Lock 🔒</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee' }}>
        {[
          { key: 'guests', label: '👥 Guests' },
          { key: 'room-reservations', label: '🛏 Room Reservations' },
          { key: 'space-reservations', label: '🏛 Space Reservations' },
          { key: 'upgrades', label: '✨ Upgrades' },
          { key: 'rooms', label: '🏠 Rooms' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #e94560' : '3px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? '#e94560' : '#666',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              marginBottom: '-2px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Loading...</div>}

      {/* Staff booking modal */}
      {bookingGuest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <h2 style={{ marginBottom: '0.25rem' }}>{bookingType === 'room' ? 'Book a Room' : 'Book a Space'}</h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.25rem' }}>for <strong>{bookingGuest.fullname}</strong></p>
            {bookingError && <div className="error">{bookingError}</div>}
            {bookingSuccess && <div className="success">{bookingSuccess}</div>}

            {bookingType === 'room' ? (
              <form onSubmit={handleStaffBookRoom}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Check-In Date</label>
                    <input type="date" required value={bookingForm.checkInDate || ''} onChange={e => {
                      const updated = { ...bookingForm, checkInDate: e.target.value, roomID: '' };
                      setBookingForm(updated);
                      fetchRoomsForDates(e.target.value, bookingForm.checkOutDate);
                    }} />
                  </div>
                  <div className="form-group">
                    <label>Check-Out Date</label>
                    <input type="date" required value={bookingForm.checkOutDate || ''} onChange={e => {
                      const updated = { ...bookingForm, checkOutDate: e.target.value, roomID: '' };
                      setBookingForm(updated);
                      fetchRoomsForDates(bookingForm.checkInDate, e.target.value);
                    }} />
                  </div>
                  <div className="form-group">
                    <label>Room</label>
                    <select required value={bookingForm.roomID || ''} onChange={e => setBookingForm({ ...bookingForm, roomID: e.target.value })}>
                      <option value="">Select a room</option>
                      {availableRooms.map(r => (
                        <option key={r.roomid} value={r.roomid}>Room {r.roomid} — {r.typename} (Floor {r.floor})</option>
                      ))}
                    </select>
                    {bookingForm.checkInDate && bookingForm.checkOutDate && availableRooms.length === 0 && (
                      <p style={{ color: '#e94560', fontSize: '0.8rem', marginTop: '0.3rem' }}>No rooms available for these dates</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Number of Guests</label>
                    <input type="number" min="1" required value={bookingForm.numGuests || ''} onChange={e => setBookingForm({ ...bookingForm, numGuests: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary">Confirm Booking</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setBookingGuest(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStaffBookSpace}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Space</label>
                    <select required value={bookingForm.spaceID || ''} onChange={e => setBookingForm({ ...bookingForm, spaceID: e.target.value })}>
                      <option value="">Select a space</option>
                      {availableSpaces.map(s => (
                        <option key={s.spaceid} value={s.spaceid}>{s.spacename} (cap. {s.capacity}, ${s.hourlyrate}/hr)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Date & Time</label>
                    <input type="datetime-local" required value={bookingForm.startDateTime || ''} onChange={e => setBookingForm({ ...bookingForm, startDateTime: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>End Date & Time</label>
                    <input type="datetime-local" required value={bookingForm.endDateTime || ''} onChange={e => setBookingForm({ ...bookingForm, endDateTime: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Number of Attendees</label>
                    <input type="number" min="1" required value={bookingForm.numAttendees || ''} onChange={e => setBookingForm({ ...bookingForm, numAttendees: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary">Confirm Booking</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setBookingGuest(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Guests Tab */}
      {activeTab === 'guests' && (
        <div>
          {/* Add Guest */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Add New Guest</h2>
            {guestError && <div className="error">{guestError}</div>}
            {guestSuccess && <div className="success">{guestSuccess}</div>}
            <form onSubmit={handleAddGuest}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Guest ID</label>
                  <input type="number" value={guestForm.guestID} onChange={e => setGuestForm({ ...guestForm, guestID: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={guestForm.fullName} onChange={e => setGuestForm({ ...guestForm, fullName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={guestForm.email} onChange={e => setGuestForm({ ...guestForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={guestForm.phone} onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Guest</button>
            </form>
          </div>

          {/* All Guests — expandable rows with reservations + upgrades */}
          <div className="card">
            <h2 style={{ marginBottom: '0.3rem' }}>All Guests ({guests.length})</h2>
            <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1.2rem' }}>Click a guest row to view their reservations and upgrades</p>
            {guests.map(g => {
              const gRoomRes = roomRes.filter(r => Number(r.guestid) === Number(g.guestid));
              const gSpaceRes = spaceRes.filter(r => Number(r.guestid) === Number(g.guestid));
              const activeRoomResIDs = new Set(gRoomRes.filter(r => r.status !== 'cancelled').map(r => Number(r.roomreservationid)));
              const gRoomResIDs = new Set(gRoomRes.map(r => Number(r.roomreservationid)));
              const gUpgrades = resUpgrades.filter(u => activeRoomResIDs.has(Number(u.roomreservationid)));
              const isExpanded = expandedGuest === g.guestid;
              return (
                <div key={g.guestid} style={{ borderBottom: '1px solid #eee' }}>
                  {/* Guest row */}
                  <div
                    onClick={() => setExpandedGuest(isExpanded ? null : g.guestid)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.85rem 0.5rem', cursor: 'pointer',
                      background: isExpanded ? '#f8f9ff' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1 }}>
                      <span style={{ fontWeight: 600, minWidth: 40, color: '#999', fontSize: '0.8rem' }}>#{g.guestid}</span>
                      <span style={{ fontWeight: 700, minWidth: 160 }}>{g.fullname}</span>
                      <span style={{ color: '#555', fontSize: '0.88rem', minWidth: 200 }}>{g.email}</span>
                      <span style={{ color: '#777', fontSize: '0.88rem' }}>{g.phone}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#888' }}>
                        {gRoomRes.filter(r => r.status !== 'cancelled').length} room res · {gSpaceRes.filter(r => r.status !== 'cancelled').length} space res · {gUpgrades.length} upgrades
                      </span>
                      <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDeleteGuest(g.guestid); }}>Delete</button>
                      <span style={{ fontSize: '0.85rem', color: '#aaa', marginLeft: '0.25rem' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ background: '#f8f9ff', padding: '1rem 1.25rem', borderTop: '1px solid #e8eaff' }}>

                      {/* Quick booking buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => openBooking(g, 'room')}>+ Book Room</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openBooking(g, 'space')}>+ Book Space</button>
                      </div>

                      {/* Room Reservations */}
                      <p style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem' }}>Room Reservations</p>
                      {gRoomRes.length === 0 ? (
                        <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem' }}>No room reservations.</p>
                      ) : (
                        <table style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                          <thead>
                            <tr><th>Res. ID</th><th>Room</th><th>Type</th><th>Check-In</th><th>Check-Out</th><th>Guests</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                          </thead>
                          <tbody>
                            {gRoomRes.map(r => (
                              <tr key={r.roomreservationid}>
                                <td>{r.roomreservationid}</td>
                                <td>Room {r.roomid}</td>
                                <td>{r.typename}</td>
                                <td>{new Date(r.checkindate).toLocaleDateString()}</td>
                                <td>{new Date(r.checkoutdate).toLocaleDateString()}</td>
                                <td>{r.numguests}</td>
                                <td><span className={getBadge(r.status)}>{r.status}</span></td>
                                <td>{new Date(r.createdat).toLocaleDateString()}</td>
                                <td>
                                  {r.status !== 'cancelled' && (
                                    <button className="btn btn-danger btn-sm" onClick={() => handleCancelRoom(r.roomreservationid)}>Cancel</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Space Reservations */}
                      <p style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem' }}>Space Reservations</p>
                      {gSpaceRes.length === 0 ? (
                        <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem' }}>No space reservations.</p>
                      ) : (
                        <table style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                          <thead>
                            <tr><th>Res. ID</th><th>Space</th><th>Start</th><th>End</th><th>Attendees</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                          </thead>
                          <tbody>
                            {gSpaceRes.map(r => (
                              <tr key={r.spacereservationid}>
                                <td>{r.spacereservationid}</td>
                                <td>{r.spacename}</td>
                                <td>{new Date(r.startdatetime).toLocaleString()}</td>
                                <td>{new Date(r.enddatetime).toLocaleString()}</td>
                                <td>{r.numattendees}</td>
                                <td><span className={getBadge(r.status)}>{r.status}</span></td>
                                <td>{new Date(r.createdat).toLocaleDateString()}</td>
                                <td>
                                  {r.status !== 'cancelled' && (
                                    <button className="btn btn-danger btn-sm" onClick={() => handleCancelSpace(r.spacereservationid)}>Cancel</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Upgrades */}
                      <p style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem' }}>Upgrades</p>
                      {gUpgrades.length === 0 ? (
                        <p style={{ color: '#aaa', fontSize: '0.85rem' }}>No upgrades on any reservation.</p>
                      ) : (
                        <table style={{ fontSize: '0.85rem' }}>
                          <thead>
                            <tr><th>Res. ID</th><th>Upgrade</th><th>Description</th><th>Qty</th><th>Price/Unit</th><th>Total</th><th>Actions</th></tr>
                          </thead>
                          <tbody>
                            {gUpgrades.map((u, i) => (
                              <tr key={i}>
                                <td>{u.roomreservationid}</td>
                                <td>{u.upgradename}</td>
                                <td style={{ fontSize: '0.8rem', color: '#666' }}>{u.description}</td>
                                <td>{u.quantity}</td>
                                <td>${u.price}</td>
                                <td style={{ color: '#e94560', fontWeight: 700 }}>${Number(u.total).toFixed(2)}</td>
                                <td>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUpgradeFromRes(u.roomreservationid, u.upgradeid)}>Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Reservations Tab */}
      {activeTab === 'room-reservations' && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>All Room Reservations</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Guest</th><th>Room</th><th>Type</th><th>Check-In</th><th>Check-Out</th><th>Guests</th><th>Status</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {roomRes.map(r => (
                <tr key={r.roomreservationid}>
                  <td>{r.roomreservationid}</td>
                  <td>{r.fullname}</td>
                  <td>Room {r.roomid}</td>
                  <td>{r.typename}</td>
                  <td>{new Date(r.checkindate).toLocaleDateString()}</td>
                  <td>{new Date(r.checkoutdate).toLocaleDateString()}</td>
                  <td>{r.numguests}</td>
                  <td><span className={getBadge(r.status)}>{r.status}</span></td>
                  <td>{new Date(r.createdat).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: '0.3rem' }}>
                    {r.status !== 'cancelled' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancelRoom(r.roomreservationid)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Space Reservations Tab */}
      {activeTab === 'space-reservations' && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>All Space Reservations</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Guest</th><th>Space</th><th>Start</th><th>End</th><th>Attendees</th><th>Status</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {spaceRes.map(r => (
                <tr key={r.spacereservationid}>
                  <td>{r.spacereservationid}</td>
                  <td>{r.fullname}</td>
                  <td>{r.spacename}</td>
                  <td>{new Date(r.startdatetime).toLocaleString()}</td>
                  <td>{new Date(r.enddatetime).toLocaleString()}</td>
                  <td>{r.numattendees}</td>
                  <td><span className={getBadge(r.status)}>{r.status}</span></td>
                  <td>{new Date(r.createdat).toLocaleDateString()}</td>
                  <td>
                    {r.status !== 'cancelled' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancelSpace(r.spacereservationid)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="card">
          <h2 style={{ marginBottom: '0.3rem' }}>All Rooms ({rooms.length})</h2>
          <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1.2rem' }}>Update room status — only maintenance can be manually set; occupied/available are computed from reservations</p>
          <table>
            <thead>
              <tr><th>Room ID</th><th>Floor</th><th>Type</th><th>Capacity</th><th>Price/Night</th><th>Status</th><th>Update Status</th></tr>
            </thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.roomid}>
                  <td>{r.roomid}</td>
                  <td>{r.floor}</td>
                  <td>{r.typename}</td>
                  <td>{r.capacity}</td>
                  <td>${r.baseprice}</td>
                  <td><span className={`badge ${r.status === 'available' ? 'badge-available' : r.status === 'occupied' ? 'badge-occupied' : 'badge-maintenance'}`}>{r.status}</span></td>
                  <td>
                    <select
                      value={r.status === 'maintenance' ? 'maintenance' : 'active'}
                      onChange={e => handleUpdateRoomStatus(r, e.target.value === 'maintenance' ? 'maintenance' : 'available')}
                      style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem' }}
                    >
                      <option value="active">Active (auto)</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upgrades Tab */}
      {activeTab === 'upgrades' && (
        <div>
          {/* Upgrades attached to reservations — SQL query #8 */}
          <div className="card">
            <h2 style={{ marginBottom: '0.4rem' }}>Upgrades on Reservations</h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>All upgrades currently attached to room reservations</p>
            {resUpgrades.length === 0 ? (
              <p style={{ color: '#888' }}>No upgrades attached to any reservation yet.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Res. ID</th><th>Guest</th><th>Room</th><th>Type</th><th>Upgrade</th><th>Description</th><th>Qty</th><th>Price/Unit</th><th>Total</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {resUpgrades.map((ru, i) => (
                    <tr key={i}>
                      <td>{ru.roomreservationid}</td>
                      <td>{ru.fullname}</td>
                      <td>Room {ru.roomid}</td>
                      <td>{ru.typename}</td>
                      <td>{ru.upgradename}</td>
                      <td style={{ fontSize: '0.82rem', color: '#666' }}>{ru.description}</td>
                      <td>{ru.quantity}</td>
                      <td>${ru.price}</td>
                      <td style={{ color: '#e94560', fontWeight: 700 }}>${Number(ru.total).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveUpgradeFromRes(ru.roomreservationid, ru.upgradeid)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Delete upgrade from system — SQL query #5 */}
          <div className="card">
            <h2 style={{ marginBottom: '0.4rem' }}>Upgrade Catalog</h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>Delete an upgrade from the system — this also removes it from all reservations</p>
            <table>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Description</th><th>Price</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {upgrades.map(u => (
                  <tr key={u.upgradeid}>
                    <td>{u.upgradeid}</td>
                    <td>{u.upgradename}</td>
                    <td style={{ fontSize: '0.82rem', color: '#666' }}>{u.description}</td>
                    <td>${u.price}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteUpgrade(u.upgradeid, u.upgradename)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}