// frontend/src/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <div className="glass-card" style={{ maxWidth: '800px', margin: '50px auto' }}>
        <h1 style={{ color: '#003366', fontSize: '2.5rem' }}>Welcome to CBIT Library</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#444' }}>
          Our library is a hub of knowledge featuring a vast collection of resources 
          tailored for every branch of engineering and management.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '40px 0', flexWrap: 'wrap' }}>
          <div style={{ margin: '10px' }}>
            <h2 style={{ color: '#FFD700', fontSize: '2.5rem', margin: 0 }}>5000+</h2>
            <p>Books Available</p>
          </div>
          <div style={{ margin: '10px' }}>
            <h2 style={{ color: '#FFD700', fontSize: '2.5rem', margin: 0 }}>8+</h2>
            <p>Departments</p>
          </div>
          <div style={{ margin: '10px' }}>
            <h2 style={{ color: '#FFD700', fontSize: '2.5rem', margin: 0 }}>24/7</h2>
            <p>Digital Access</p>
          </div>
        </div>

        <p>
          <strong>Departments:</strong> CSE, ECE, EEE, Civil, Mechanical, MBA, and BS&H.
        </p>

        <div style={{ marginTop: '30px' }}>
          <Link to="/books">
            <button className="btn-gold" style={{ padding: '15px 40px', fontSize: '1.2rem' }}>
              Search Books
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;