import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-tagline">Welcome to</p>
          <h1 className="hero-title">Grand Vista Hotel</h1>
          <p className="hero-sub">Luxury stays & premier event spaces in the heart of the city</p>
          <div className="hero-buttons">
            <button className="hero-btn hero-btn-primary" onClick={() => navigate('/room-reservations')}>
              Book a Room
            </button>
            <button className="hero-btn hero-btn-secondary" onClick={() => navigate('/space-reservations')}>
              Reserve a Space
            </button>
          </div>
        </div>
        <div className="hero-scroll-hint">↓ Explore</div>
      </section>

      {/* Options Section */}
      <section className="options-section">
        <h2 className="options-heading">What are you looking for?</h2>
        <div className="options-grid">
          <div className="option-card" onClick={() => navigate('/room-reservations')}>
            <div className="option-img option-img-room" />
            <div className="option-body">
              <h3>Room Reservations</h3>
              <p>Book a comfortable overnight stay. Choose from Standard, Deluxe, Suite, Executive, Family, Penthouse, and Accessible rooms.</p>
              <button className="option-btn">Book Now →</button>
            </div>
          </div>

          <div className="option-card" onClick={() => navigate('/space-reservations')}>
            <div className="option-img option-img-space" />
            <div className="option-body">
              <h3>Space Reservations</h3>
              <p>Reserve a venue for your next event. From intimate board rooms to grand banquet halls — billed by the hour.</p>
              <button className="option-btn">Reserve Now →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats-section">
        <div className="stat"><span className="stat-num">25</span><span className="stat-label">Rooms</span></div>
        <div className="stat-divider" />
        <div className="stat"><span className="stat-num">6</span><span className="stat-label">Event Spaces</span></div>
        <div className="stat-divider" />
        <div className="stat"><span className="stat-num">7</span><span className="stat-label">Room Types</span></div>
        <div className="stat-divider" />
        <div className="stat"><span className="stat-num">6</span><span className="stat-label">Upgrades Available</span></div>
      </section>

      {/* Upgrades teaser */}
      <section className="upgrades-section">
        <div className="upgrades-text">
          <h2>Enhance Your Stay</h2>
          <p>Add optional upgrades to any room reservation — breakfast, late checkout, extra beds, airport transfers, parking, and spa access.</p>
          <button className="option-btn" onClick={() => navigate('/upgrades')}>View Upgrades →</button>
        </div>
        <div className="upgrades-img" />
      </section>
    </div>
  );
}
