import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login'; 
import Signup from './Signup'; 
import Profile from './Profile';
import Home from './Home';
import Books from './Books';
import AdminDashboard from './AdminDashboard'; 
import './index.css';

function App() {
  const role = localStorage.getItem('role');
  const isLoggedIn = !!localStorage.getItem('token');
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const handleLogout = () => {
      localStorage.clear(); 
      window.location.href = '/login'; 
  };

  return (
    // The CSS 'body' handles the image. 
    // This div handles the Tint/Blur effect on top of it.
    <div className={isHomePage ? "overlay-home" : "overlay-page"}>
      
      <nav className="navbar">
        <div style={{display:'flex', alignItems:'center'}}>
            <h2 style={{margin:0, color: '#FFD700', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
              CBIT Library
            </h2>
        </div>
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active-link' : ''}>Home</Link>
          <Link to="/books" className={location.pathname === '/books' ? 'active-link' : ''}>Search Books</Link>
          
          {role === 'admin' && (
            <Link to="/admin" style={{color:'#FFD700'}}>Admin Dashboard</Link>
          )}

          {role === 'student' && <Link to="/profile">My Profile</Link>}

          {isLoggedIn ? (
             <button onClick={handleLogout} className="btn-gold" style={{marginLeft:'15px'}}>Logout</button>
          ) : (
            <>
                <Link to="/login">Login</Link>
                <Link to="/signup" className="btn-gold" style={{marginLeft:'15px'}}>Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;