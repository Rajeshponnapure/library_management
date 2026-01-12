import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <div className="glass-card" style={{ maxWidth: '800px', margin: '50px auto' }}>
        <h1 style={{ fontSize: '2.5rem', borderBottom: 'none', color: '#003366' }}>Welcome to CBIT Library</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#333' }}>
          Our library is a hub of knowledge featuring a vast collection of resources 
          tailored for every branch of engineering and management.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '40px 0', flexWrap: 'wrap', textAlign: 'center' }}>
          <div style={{ margin: '10px' }}>
            <h2 style={{ color: '#d4a017', fontSize: '2.5rem', margin: 0 }}>15,000+</h2>
            <p style={{fontWeight:'bold', color: '#555'}}>Books Available</p>
          </div>
          <div style={{ margin: '10px' }}>
            <h2 style={{ color: '#d4a017', fontSize: '2.5rem', margin: 0 }}>8+</h2>
            <p style={{fontWeight:'bold', color: '#555'}}>Departments</p>
          </div>
          <div style={{ margin: '10px' }}>
            <h2 style={{ color: '#d4a017', fontSize: '2.5rem', margin: 0 }}>24/7</h2>
            <p style={{fontWeight:'bold', color: '#555'}}>Digital Access</p>
          </div>
        </div>

        <p style={{ color: '#555' }}>
          <strong>Departments:</strong> CSE, ECE, EEE, Civil, Mechanical, MBA, and BS&H.
        </p>

        {/* --- CENTERED BUTTON FIX --- */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}> 
          <Link to="/books">
            <button className="btn-gold" style={{ padding: '15px 50px', fontSize: '1.2rem' }}>
              Search Books
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Home;