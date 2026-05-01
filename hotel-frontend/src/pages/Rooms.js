import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ roomID: '', floor: '', status: 'available', roomTypeID: '' });

  const fetchRooms = async () => {
    try {
      const url = filter === 'available' ? `${API}/rooms/available` : `${API}/rooms`;
      const res = await axios.get(url);
      setRooms(res.data);
    } catch (err) {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await axios.get(`${API}/room-types`);
      setRoomTypes(res.data);
    } catch (err) {}
  };

  useEffect(() => { fetchRooms(); }, [filter]);
  useEffect(() => { fetchRoomTypes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await axios.post(`${API}/rooms`, form);
      setSuccess('Room added successfully');
      setForm({ roomID: '', floor: '', status: 'available', roomTypeID: '' });
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add room');
    }
  };

  const getBadge = (status) => {
    const map = { available: 'badge-available', occupied: 'badge-occupied', maintenance: 'badge-maintenance' };
    return `badge ${map[status] || ''}`;
  };

  return (
    <div>
      <h1>Rooms</h1>

      <div className="two-col">
        <div className="card">
          <h2>Add New Room</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Room ID</label>
                <input type="number" value={form.roomID} onChange={e => setForm({...form, roomID: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Floor</label>
                <input type="number" value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Room Type</label>
                <select value={form.roomTypeID} onChange={e => setForm({...form, roomTypeID: e.target.value})} required>
                  <option value="">Select type</option>
                  {roomTypes.map(rt => (
                    <option key={rt.roomtypeid} value={rt.roomtypeid}>{rt.typename} (${rt.baseprice}/night)</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add Room</button>
          </form>
        </div>

        <div className="card">
          <h2>Room Types</h2>
          <table>
            <thead><tr><th>Type</th><th>Capacity</th><th>Price/Night</th></tr></thead>
            <tbody>
              {roomTypes.map(rt => (
                <tr key={rt.roomtypeid}>
                  <td>{rt.typename}</td>
                  <td>{rt.capacity}</td>
                  <td>${rt.baseprice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
          <h2>All Rooms</h2>
          <div style={{display:'flex', gap:'0.5rem'}}>
            <button className={`btn btn-sm ${filter === 'all' ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setFilter('all')}>All</button>
            <button className={`btn btn-sm ${filter === 'available' ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setFilter('available')}>Available Only</button>
          </div>
        </div>
        {loading ? <div className="loading">Loading...</div> : (
          <table>
            <thead>
              <tr><th>Room ID</th><th>Floor</th><th>Type</th><th>Capacity</th><th>Price/Night</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.roomid}>
                  <td>{r.roomid}</td>
                  <td>{r.floor}</td>
                  <td>{r.typename}</td>
                  <td>{r.capacity}</td>
                  <td>${r.baseprice}</td>
                  <td><span className={getBadge(r.status)}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
