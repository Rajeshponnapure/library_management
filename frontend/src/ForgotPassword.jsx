import React, { useState } from 'react';
import axios from 'axios';

function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/forgot-password', { email });
      alert("Reset link has been 'sent'! Check your Backend Terminal/Console.");
    } catch (error) {
      alert("Error: " + (error.response?.data?.detail || "Something went wrong"));
    }
  };

  return (
    <div className="container" style={{marginTop: '50px'}}>
      <div className="search-card">
        <h1>Forgot Password</h1>
        <p>Enter your registered email address.</p>
        <input 
          type="text" 
          placeholder="Enter Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{display: 'block', width: '80%', margin: '10px auto'}} 
        />
        <button className="btn-gold" onClick={handleSubmit}>Send Reset Link</button>
      </div>
    </div>
  );
}

export default ForgotPassword;