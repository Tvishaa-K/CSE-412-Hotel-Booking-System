import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import RoomReservations from './pages/RoomReservations';
import SpaceReservations from './pages/SpaceReservations';
import Upgrades from './pages/Upgrades';
import Staff from './pages/Staff';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <NavLink to="/" end className="nav-brand" style={{textDecoration:'none', color:'white'}}>🏨 Grand Vista Hotel</NavLink>
          <div className="nav-links">
            <NavLink to="/room-reservations">Room Reservations</NavLink>
            <NavLink to="/space-reservations">Space Reservations</NavLink>
            <NavLink to="/upgrades">Upgrades</NavLink>
            <NavLink to="/staff" style={({ isActive }) => ({
              color: isActive ? 'white' : '#aaa',
              background: isActive ? '#e94560' : 'rgba(255,255,255,0.08)',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
            })}>🔐 Staff</NavLink>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room-reservations" element={<div className="main-content"><RoomReservations /></div>} />
          <Route path="/space-reservations" element={<div className="main-content"><SpaceReservations /></div>} />
          <Route path="/upgrades" element={<div className="main-content"><Upgrades /></div>} />
          <Route path="/staff" element={<div className="main-content"><Staff /></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
