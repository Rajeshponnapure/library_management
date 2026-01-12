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
  const navigate = useNavigate();

  const handleLogout = () => {
      localStorage.clear(); 
      window.location.href = '/login'; 
  };

  return (
    <div className="app-wrapper">
      {/* The Overlay creates the cool dark-blue tint over the image */}
      <div className="overlay">
        
        <nav className="navbar">
          <div style={{display:'flex', alignItems:'center', cursor:'pointer'}} onClick={()=>navigate('/')}>
              <h2>CBIT Library</h2>
          </div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/books">Search Books</Link>
            
            {role === 'admin' && (
              <Link to="/admin" style={{color:'#FFD700'}}>Admin Dashboard</Link>
            )}

            {role === 'student' && <Link to="/profile">My Profile</Link>}

            {isLoggedIn ? (
              <button onClick={handleLogout} className="btn-gold" style={{marginLeft:'20px'}}>Logout</button>
            ) : (
              <>
                  <Link to="/login">Login</Link>
                  <Link to="/signup">
                    <button className="btn-gold" style={{marginLeft:'10px', padding: '8px 20px', fontSize:'0.9rem'}}>Sign Up</button>
                  </Link>
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
    </div>
  );
}

export default App;