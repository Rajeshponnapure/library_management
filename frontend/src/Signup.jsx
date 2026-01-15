// frontend/src/Signup.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './index.css'; 

function Signup() {
  const [formData, setFormData] = useState({
    full_name: '', 
    email: '', 
    password: '', 
    mobile_number: '', 
    role: 'student',
    registration_number: '',
    branch: 'CSE',
    year: '1'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault(); 

    // --- 1. SECURITY CHECK: Enforce College Domain ---
    const allowedDomain = '@cbit.edu.in'; 
    if (!formData.email.toLowerCase().endsWith(allowedDomain)) {
      alert(`Access Restricted! \n\nYou must use your official college email (${allowedDomain}) to register.`);
      return;
    }

    // --- 2. VALIDATION: Check if Email Matches Reg No (Students Only) ---
    if (formData.role === 'student') {
        // Extract the ID part from email (e.g., "232p1a3201" from "232p1a3201@cbit.edu.in")
        const emailIdPart = formData.email.split('@')[0].toLowerCase();
        const regNo = formData.registration_number.toLowerCase();

        if (emailIdPart !== regNo) {
            alert(`Identity Mismatch! \n\nYour email "${formData.email}" does not match your Registration Number "${formData.registration_number}".\n\nEmail should be: ${formData.registration_number}${allowedDomain}`);
            return;
        }
    }
    // -------------------------------------------------------------------

    try {
      await axios.post('http://127.0.0.1:8000/signup', formData);
      alert("Account Created! Please Login.");
      navigate('/login');
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Signup Failed"));
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="container" style={{maxWidth: '600px', marginTop: '50px'}}>
      <div className="glass-card" style={{padding: '40px'}}>
        <h2 style={{color: '#003366', textAlign: 'center'}}>Create Account</h2>
        <p style={{textAlign:'center', color:'#666', marginBottom:'30px'}}>Join the CBIT Library portal.</p>

        <form onSubmit={handleSignup}>
          
          {/* Full Name */}
          <div className="input-group" style={{marginBottom: '15px'}}>
            <label className="form-label">
                Full Name <span style={{color: 'red'}}>*</span>
            </label>
            <input 
              className="modern-input" 
              name="full_name" 
              placeholder="John Doe" 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* Email & Mobile */}
          <div style={{display:'flex', gap:'15px', marginBottom: '15px'}}>
            <div className="input-group" style={{flex:1}}>
              <label className="form-label">
                Email <span style={{color: 'red'}}>*</span>
              </label>
              <input 
                className="modern-input" 
                name="email" 
                type="email" 
                placeholder="232p1a...@cbit.edu.in" 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="input-group" style={{flex:1}}>
              <label className="form-label">
                Mobile No <span style={{color: 'red'}}>*</span>
              </label>
              <input 
                className="modern-input" 
                name="mobile_number" 
                placeholder="9876543210" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          {/* Password with Toggle */}
          <div className="input-group" style={{marginBottom: '15px'}}>
            <label className="form-label">
                Password <span style={{color: 'red'}}>*</span>
            </label>
            <div className="password-input-wrapper">
                <input 
                  className="modern-input" 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="••••••" 
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

          {/* Role Select */}
          <div className="input-group" style={{marginBottom: '15px'}}>
            <label className="form-label">
                Role <span style={{color: 'red'}}>*</span>
            </label>
            <select className="modern-input modern-select" name="role" onChange={handleChange} required>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          {/* Student Fields */}
          {formData.role === 'student' && (
            <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '20px'}}>
              <div className="input-group" style={{marginBottom: '10px'}}>
                <label className="form-label">
                    Registration No <span style={{color: 'red'}}>*</span>
                </label>
                <input 
                  className="modern-input" 
                  name="registration_number" 
                  placeholder="232P1A****" 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div style={{display:'flex', gap:'15px'}}>
                <div className="input-group" style={{flex:1}}>
                  <label className="form-label">
                    Branch <span style={{color: 'red'}}>*</span>
                  </label>
                  <select className="modern-input modern-select" name="branch" onChange={handleChange} required>
                    <option value="CSE">CSE</option><option value="ECE">ECE</option>
                    <option value="EEE">EEE</option><option value="CIVIL">CIVIL</option>
                    <option value="MECH">MECH</option><option value="MBA">MBA</option>
                  </select>
                </div>
                <div className="input-group" style={{flex:1}}>
                  <label className="form-label">
                    Year <span style={{color: 'red'}}>*</span>
                  </label>
                  <select className="modern-input modern-select" name="year" onChange={handleChange} required>
                    <option value="1">1st</option><option value="2">2nd</option>
                    <option value="3">3rd</option><option value="4">4th</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn-gold" style={{width:'100%', padding:'12px'}}>Create Account</button>
        </form>

        <div style={{textAlign:'center', marginTop:'15px'}}>
          Already have an account? <Link to="/login" style={{color:'#d4a017', fontWeight:'bold'}}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;