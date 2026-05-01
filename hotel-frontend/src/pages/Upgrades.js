import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001/api';

const UPGRADE_IMAGES = {
  'Breakfast':        'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&q=80',
  'Late Checkout':    'https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?w=600&q=80',
  'Extra Bed':        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80',
  'Airport Transfer': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',
  'Parking':          'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=600&q=80',
  'Spa Access':       'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
};

export default function Upgrades() {
  const [upgrades, setUpgrades] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [addForm, setAddForm] = useState({ reservationID: '', quantity: 1 });

  const fetchAll = async () => {
    try {
      const [upgradeRes, resRes] = await Promise.all([
        axios.get(`${API}/upgrades`),
        axios.get(`${API}/room-reservations`),
      ]);
      setUpgrades(upgradeRes.data);
      setReservations(resRes.data.filter(r => r.status !== 'cancelled'));
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSelectUpgrade = (u) => {
    setSelectedUpgrade(u);
    setAddForm({ reservationID: '', quantity: 1 });
    setTimeout(() => document.getElementById('upgrade-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleAddUpgrade = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await axios.post(`${API}/room-reservations/${addForm.reservationID}/upgrades`, {
        upgradeID: selectedUpgrade.upgradeid,
        quantity: addForm.quantity,
      });
      setSuccess(`${selectedUpgrade.upgradename} added to reservation #${addForm.reservationID}!`);
      setSelectedUpgrade(null);
      setAddForm({ reservationID: '', quantity: 1 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add upgrade');
    }
  };

  return (
    <div>
      <h1>Upgrades</h1>

      <div className="card">
        <h2>Select an Upgrade</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Choose an upgrade to add to your room reservation</p>
        {loading ? <div className="loading">Loading...</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {upgrades.map(u => {
              const isSelected = selectedUpgrade?.upgradeid === u.upgradeid;
              return (
                <div
                  key={u.upgradeid}
                  onClick={() => handleSelectUpgrade(u)}
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #e94560' : '2px solid transparent',
                    boxShadow: isSelected ? '0 0 0 4px rgba(233,69,96,0.15)' : '0 4px 15px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s',
                    background: 'white',
                  }}
                >
                  <div style={{
                    height: 150,
                    backgroundImage: `url('${UPGRADE_IMAGES[u.upgradename] || ''}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }} />
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.2rem' }}>{u.upgradename}</h3>
                    <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.4rem' }}>{u.description}</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' }}>
                      ${u.price} <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#888' }}>per unit</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add to Reservation Form */}
      {selectedUpgrade && (
        <div className="card" id="upgrade-form">
          <h2>Add {selectedUpgrade.upgradename} to a Reservation</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <form onSubmit={handleAddUpgrade}>
            <div className="form-grid">
              <div className="form-group">
                <label>Reservation</label>
                <select value={addForm.reservationID} onChange={e => setAddForm({ ...addForm, reservationID: e.target.value })} required>
                  <option value="">Select reservation</option>
                  {reservations.map(r => (
                    <option key={r.roomreservationid} value={r.roomreservationid}>
                      #{r.roomreservationid} — {r.fullname} (Room {r.roomid})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" min="1" value={addForm.quantity} onChange={e => setAddForm({ ...addForm, quantity: e.target.value })} required />
              </div>
            </div>
            {addForm.quantity > 0 && (
              <div style={{ background: '#f0f4ff', border: '1px solid #d0d9ff', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
                <strong>{selectedUpgrade.upgradename}</strong> × {addForm.quantity}
                <span style={{ marginLeft: '1rem', color: '#e94560', fontWeight: 700 }}>
                  Total: ${(selectedUpgrade.price * addForm.quantity).toFixed(2)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary">Add Upgrade</button>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedUpgrade(null)}>← Back</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}