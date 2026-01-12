import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role); 
      if(res.data.role === 'admin') navigate('/admin');
      else navigate('/');
      window.location.reload(); 
    } catch (err) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Welcome Back</h2>
          <p>Please enter your details to sign in.</p>
        </div>
        
        {/* EMAIL INPUT */}
        <div className="input-group">
          <label className="form-label">Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon">📧</span>
            <input 
              className="modern-input"
              placeholder="student@cbit.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
        </div>

        {/* PASSWORD INPUT */}
        <div className="input-group">
          <label className="form-label">Password</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input 
              type="password" 
              className="modern-input"
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <div style={{textAlign:'right', marginTop:'5px'}}>
             <span className="form-link" style={{fontSize:'0.85rem'}}>Forgot Password?</span>
          </div>
        </div>
        
        <button onClick={handleLogin} className="form-btn">
          Sign In
        </button>

        <div className="form-footer">
          Don't have an account? <Link to="/signup" className="form-link">Create Account</Link>
        </div>

      </div>
    </div>
  );
}

export default Login;