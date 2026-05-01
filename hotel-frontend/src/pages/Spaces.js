import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api';

export default function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ spaceID: '', spaceName: '', capacity: '', hourlyRate: '', status: 'available' });

  const fetchSpaces = async () => {
    try {
      const res = await axios.get(`${API}/spaces`);
      setSpaces(res.data);
    } catch (err) {
      setError('Failed to load spaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSpaces(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await axios.post(`${API}/spaces`, form);
      setSuccess('Space added successfully');
      setForm({ spaceID: '', spaceName: '', capacity: '', hourlyRate: '', status: 'available' });
      fetchSpaces();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add space');
    }
  };

  const getBadge = (status) => {
    const map = { available: 'badge-available', reserved: 'badge-reserved', maintenance: 'badge-maintenance' };
    return `badge ${map[status] || ''}`;
  };

  return (
    <div>
      <h1>Spaces</h1>

      <div className="two-col">
        <div className="card">
          <h2>Add New Space</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Space ID</label>
                <input type="number" value={form.spaceID} onChange={e => setForm({...form, spaceID: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Space Name</label>
                <input type="text" value={form.spaceName} onChange={e => setForm({...form, spaceName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input type="number" step="0.01" value={form.hourlyRate} onChange={e => setForm({...form, hourlyRate: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add Space</button>
          </form>
        </div>

        <div className="card">
          <h2>Space Summary</h2>
          <p style={{marginBottom:'0.5rem', color:'#888', fontSize:'0.85rem'}}>Total spaces: {spaces.length}</p>
          <p style={{color:'#888', fontSize:'0.85rem'}}>Available: {spaces.filter(s => s.status === 'available').length}</p>
        </div>
      </div>

      <div className="card">
        <h2>All Spaces</h2>
        {loading ? <div className="loading">Loading...</div> : (
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Capacity</th><th>Hourly Rate</th><th>Status</th></tr>
            </thead>
            <tbody>
              {spaces.map(s => (
                <tr key={s.spaceid}>
                  <td>{s.spaceid}</td>
                  <td>{s.spacename}</td>
                  <td>{s.capacity}</td>
                  <td>${s.hourlyrate}/hr</td>
                  <td><span className={getBadge(s.status)}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
