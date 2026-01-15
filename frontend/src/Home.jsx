import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const token = localStorage.getItem('token');

  return (
    <div className="container" style={{textAlign: 'center', marginTop: '80px'}}>
      <div className="glass-card" style={{maxWidth: '900px', margin: '0 auto'}}>
        <h1 style={{fontSize: '3rem', color: '#003366', marginBottom: '10px'}}>CBIT Digital Library</h1>
        <p style={{fontSize: '1.2rem', color: '#555', marginBottom: '40px'}}>
          Access thousands of resources from Engineering to Management. <br/>
          Request books, track your due dates, and manage your account online.
        </p>

        {/* Stats Grid */}
        <div style={{display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '50px', flexWrap: 'wrap'}}>
          <div>
            <h2 style={{fontSize: '2.5rem', color: '#d4a017', margin: 0}}>15k+</h2>
            <span style={{fontWeight: 'bold', color: '#666'}}>Books</span>
          </div>
          <div>
            <h2 style={{fontSize: '2.5rem', color: '#d4a017', margin: 0}}>8+</h2>
            <span style={{fontWeight: 'bold', color: '#666'}}>Departments</span>
          </div>
          <div>
            <h2 style={{fontSize: '2.5rem', color: '#d4a017', margin: 0}}>24/7</h2>
            <span style={{fontWeight: 'bold', color: '#666'}}>Access</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!token ? (
          <div>
             <Link to="/login"><button className="btn-gold" style={{marginRight: '20px'}}>Login to Portal</button></Link>
             <Link to="/books"><button className="btn-cancel" style={{color: '#003366', borderColor: '#003366'}}>Browse Books</button></Link>
          </div>
        ) : (
          <div>
             <Link to="/books"><button className="btn-gold" style={{marginRight: '20px'}}>Find a Book</button></Link>
             <Link to="/profile"><button className="btn-cancel" style={{color: '#003366', borderColor: '#003366'}}>My Dashboard</button></Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;