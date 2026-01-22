import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login'; 
import Signup from './Signup'; 
import Profile from './Profile';
import Home from './Home';
import Books from './Books';
import AdminBooks from './AdminBooks';
import AdminDashboard from './AdminDashboard'; 
import './index.css';
import ForgotPassword from './ForgotPassword'; // <--- Import
import ResetPassword from './ResetPassword';   // <--- Import

// frontend/src/App.jsx
// ... imports remain the same ...

function App() {
  const role = localStorage.getItem('role');
  const isLoggedIn = !!localStorage.getItem('token');
  const navigate = useNavigate();

  const handleLogout = () => {
      localStorage.clear(); 
      window.location.href = '/login'; 
  };

  return (
    <div className="app-wrapper">
      
      {/* 1. NEW LOGO HEADER (White Background) */}
      <header className="header-logo-container">
        <div className="container" style={{margin: '0 auto', padding: '0 10px'}}>
             <img src="/header_logo.png" alt="CBIT Library Header" className="header-logo-img" />
        </div>
      </header>

      {/* 2. NAVIGATION BAR (Blue Background) */}
      <nav className="navbar">
        <div className="nav-links">
            <Link to="/">Home</Link>
            
            {/* Role-based Links */}
            {role === 'admin' ? (
                <Link to="/admin/books" style={{color:'#d4a017'}}>Manage Books</Link>
            ) : (
                <Link to="/books">Search Books</Link>
            )}
            
            {role === 'admin' && <Link to="/admin">Dashboard</Link>}
            {role === 'student' && <Link to="/profile">My Profile</Link>}

            {/* Login/Logout */}
            {isLoggedIn ? (
              <button onClick={handleLogout} className="btn-gold" style={{marginLeft:'20px', padding: '5px 15px', fontSize:'0.9rem'}}>Logout</button>
            ) : (
              <Link to="/login"><button className="btn-gold" style={{marginLeft:'10px', padding: '5px 15px', fontSize:'0.9rem'}}>Login</button></Link>
            )}
        </div>
      </nav>

      {/* 3. MAIN CONTENT */}
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/admin/books" element={<AdminBooks />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>

    </div>
  );
}

export default App;