import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api';

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ guestID: '', fullName: '', email: '', phone: '' });

  const fetchGuests = async () => {
    try {
      const res = await axios.get(`${API}/guests`);
      setGuests(res.data);
    } catch (err) {
      setError('Failed to load guests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await axios.post(`${API}/guests`, form);
      setSuccess('Guest added successfully');
      setForm({ guestID: '', fullName: '', email: '', phone: '' });
      fetchGuests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add guest');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this guest?')) return;
    try {
      await axios.delete(`${API}/guests/${id}`);
      fetchGuests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete guest');
    }
  };

  return (
    <div>
      <h1>Guests</h1>

      <div className="two-col">
        <div className="card">
          <h2>Add New Guest</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Guest ID</label>
                <input type="number" value={form.guestID} onChange={e => setForm({...form, guestID: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add Guest</button>
          </form>
        </div>

        <div className="card">
          <h2>Total Guests: {guests.length}</h2>
          <p style={{color:'#888', fontSize:'0.85rem'}}>All registered guests in the system</p>
        </div>
      </div>

      <div className="card">
        <h2>All Guests</h2>
        {loading ? <div className="loading">Loading...</div> : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map(g => (
                <tr key={g.guestid}>
                  <td>{g.guestid}</td>
                  <td>{g.fullname}</td>
                  <td>{g.email}</td>
                  <td>{g.phone}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.guestid)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
