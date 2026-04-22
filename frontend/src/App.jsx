// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './Login'; 
import Signup from './Signup'; 
import Profile from './Profile';
import Home from './Home';
import Books from './Books';
import AdminBooks from './AdminBooks';
import AdminDashboard from './AdminDashboard'; 
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import './index.css';

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
      
      {/* HEADER */}
      <header className="header-logo-container">
        <div className="container" style={{margin: '0 auto', padding: '0 10px'}}>
             <img src="/header_logo.png" alt="CBIT Library Header" className="header-logo-img" />
        </div>
      </header>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-links">
            <Link to="/">Home</Link>
            
            {role === 'admin' ? (
                <Link to="/admin/books" style={{color:'#d4a017'}}>Manage Books</Link>
            ) : (
                <Link to="/books">Search Books</Link>
            )}
            
            {role === 'admin' && <Link to="/admin">Dashboard</Link>}
            {role === 'student' && <Link to="/profile">My Profile</Link>}

            {isLoggedIn ? (
              <button onClick={handleLogout} className="btn-gold" style={{marginLeft:'20px', padding: '5px 15px', fontSize:'0.9rem'}}>Logout</button>
            ) : (
              <Link to="/login"><button className="btn-gold" style={{marginLeft:'10px', padding: '5px 15px', fontSize:'0.9rem'}}>Login</button></Link>
            )}
        </div>
      </nav>

      {/* ROUTES */}
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          
          {/* ✅ THESE MUST BE WRAPPED IN < ... /> */}
          <Route path="/admin/books" element={<AdminBooks />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>

    </div>
  );
}

export default App;