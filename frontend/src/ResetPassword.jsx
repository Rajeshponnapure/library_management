import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract token from URL (e.g., ?token=...)
  const token = searchParams.get("token");

  const handleSubmit = async () => {
    if (!token) {
      alert("Invalid Link");
      return;
    }

    try {
      await axios.post('http://127.0.0.1:8000/reset-password', { 
        token: token,
        new_password: password 
      });
      alert("Password Reset Successful! Redirecting to login...");
      navigate('/login');
    } catch (error) {
      alert("Error: " + (error.response?.data?.detail || "Reset failed"));
    }
  };

  return (
    <div className="container" style={{marginTop: '50px'}}>
      <div className="search-card">
        <h1>Reset Password</h1>
        <p>Enter your new password below.</p>
        <input 
          type="password" 
          placeholder="New Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{display: 'block', width: '80%', margin: '10px auto'}} 
        />
        <button className="btn-gold" onClick={handleSubmit}>Update Password</button>
      </div>
    </div>
  );
}

export default ResetPassword;