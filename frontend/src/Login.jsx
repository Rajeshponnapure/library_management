// frontend/src/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './index.css';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false); // <--- NEW STATE
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Admin Hardcoded Login (Fast Track)
    if(formData.email === "admin@cbit.edu.in" && formData.password === "admin123") {
        localStorage.setItem('token', 'admin-dummy-token'); 
        localStorage.setItem('role', 'admin');
        window.location.href = "/admin"; 
        return;
    }

    try {
      const res = await axios.post('http://127.0.0.1:8000/login', new URLSearchParams({
        username: formData.email,
        password: formData.password
      }));
      
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);

      if (res.data.role === 'admin') navigate('/admin');
      else navigate('/profile'); // Redirect student to profile/home
      
      window.location.reload(); 
    } catch (err) {
      setError('Login Failed: Invalid email or password');
    }
  };

  return (
    <div className="container" style={{maxWidth: '400px', marginTop: '80px'}}>
      <div className="glass-card" style={{padding: '40px', textAlign: 'center'}}>
        <h2 style={{color: 'var(--primary)', marginBottom: '30px'}}>Member Login</h2>
        
        {error && <div style={{color: 'red', marginBottom: '15px', background:'#ffe6e6', padding:'10px', borderRadius:'5px'}}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px', textAlign: 'left'}}>
            <label className="form-label">EMAIL ADDRESS</label>
            <input 
              name="email" 
              type="email" 
              className="modern-input" 
              placeholder="📧 student@cbit.edu" 
              onChange={handleChange}
              required 
            />
          </div>

          <div style={{marginBottom: '20px', textAlign: 'left'}}>
            <label className="form-label">PASSWORD</label>
            {/* WRAPPER FOR TOGGLE ICON */}
            <div className="password-input-wrapper">
                <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} // <--- TOGGLES TYPE
                    className="modern-input" 
                    placeholder="🔒 ••••••••" 
                    onChange={handleChange}
                    required 
                />
                <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide Password" : "Show Password"}
                >
                    {showPassword ? "👁️" : "🙈"} 
                </button>
            </div>
          </div>

          <button type="submit" className="btn-gold" style={{width: '100%', padding: '12px'}}>
            Sign In
          </button>
        </form>

        <p style={{marginTop: '20px', fontSize: '0.9rem'}}>
          <Link to="/forgot-password" style={{color: '#666'}}>Forgot Password?</Link>
        </p>

        <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '0.9rem'}}>
          Don't have an account? <Link to="/signup" style={{color: '#d4a017', fontWeight: 'bold'}}>Create Account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;