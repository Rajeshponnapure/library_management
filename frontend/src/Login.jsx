import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '', // FastAPI expects 'username' (which is our email)
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setError('');
    try {
      // 1. Prepare Form Data (FastAPI OAuth2 expects form-data, not JSON)
      const params = new URLSearchParams();
      params.append('username', formData.username);
      params.append('password', formData.password);

      // 2. Send Request
      const response = await axios.post('http://127.0.0.1:8000/token', params);
      
      // 3. Save the "Key" (Token) to Local Storage
      localStorage.setItem('token', response.data.access_token);
      
      alert("Login Successful!");
      navigate('/'); // Redirect to Home
    } catch (err) {
      console.error(err);
      setError("Invalid Email or Password");
    }
  };

  return (
    <div className="container" style={{ marginTop: '50px' }}>
      <div className="search-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ color: '#003366' }}>Login</h1>
        <p>Welcome back</p>
        
        {error && <p style={{color: 'red', fontWeight: 'bold'}}>{error}</p>}

        <input 
          name="username" 
          placeholder="Email Address" 
          onChange={handleChange} 
          style={{ width: '90%', margin: '10px 0' }} 
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          onChange={handleChange} 
          style={{ width: '90%', margin: '10px 0' }} 
        />
        
        <button className="btn-gold" onClick={handleLogin} style={{ width: '100%', marginTop: '20px' }}>
          Sign In
        </button>

        <div style={{ marginTop: '20px' }}>
          <Link to="/signup" style={{ color: '#003366', fontWeight: 'bold' }}>
            Create New Account
          </Link>
        </div>
        
      </div>
    </div>
  );
}

export default Login;