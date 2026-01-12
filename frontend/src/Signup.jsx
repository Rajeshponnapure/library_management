import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [formData, setFormData] = useState({
    full_name: '', 
    email: '', 
    password: '', 
    role: 'student',
    registration_number: '', // Roll Number
    branch: 'CSE',           // Default Branch
    year: '1'                // Default Year
  });
  
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      // We send all data; backend will ignore extra fields if role is 'admin' etc.
      await axios.post('http://127.0.0.1:8000/signup', formData);
      alert("Account Created! Please Login.");
      navigate('/login');
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Signup Failed"));
    }
  };

  return (
    <div className="form-container" style={{maxWidth: '500px'}}> {/* Slightly wider for 2 columns */}
      <div className="form-card">
        <div className="form-header">
          <h2>Create Account</h2>
          <p>Join the CBIT Library portal today.</p>
        </div>

        {/* FULL NAME */}
        <div className="input-group">
          <label className="form-label">Full Name</label>
          <div className="input-wrapper">
            <span className="input-icon">👤</span>
            <input 
              className="modern-input"
              placeholder="e.g. Rahul Sharma" 
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
        </div>

        {/* EMAIL */}
        <div className="input-group">
          <label className="form-label">Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon">📧</span>
            <input 
              className="modern-input"
              placeholder="student@cbit.edu" 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="input-group">
          <label className="form-label">Password</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input 
              type="password" 
              className="modern-input"
              placeholder="Create a strong password" 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
        </div>
        
        {/* ROLE SELECTION */}
        <div className="input-group">
            <label className="form-label">I am a...</label>
            <div className="input-wrapper">
                <span className="input-icon">🎓</span>
                <select 
                    className="modern-input modern-select"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty Member</option>
                </select>
            </div>
        </div>

        {/* --- STUDENT SPECIFIC FIELDS (Only show if role is Student) --- */}
        {formData.role === 'student' && (
          <>
            {/* ROLL NUMBER */}
            <div className="input-group">
              <label className="form-label">Roll Number</label>
              <div className="input-wrapper">
                <span className="input-icon">🆔</span>
                <input 
                  className="modern-input"
                  placeholder="e.g. 232p1a****" 
                  onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                />
              </div>
            </div>

            {/* BRANCH & YEAR (Side by Side) */}
            <div style={{display: 'flex', gap: '15px'}}>
              
              <div className="input-group" style={{flex: 1}}>
                <label className="form-label">Branch</label>
                <div className="input-wrapper">
                  <span className="input-icon">📚</span>
                  <select 
                    className="modern-input modern-select"
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="MECH">MECH</option>
                    <option value="MBA">MBA</option>
                    
                  </select>
                </div>
              </div>

              <div className="input-group" style={{flex: 1}}>
                <label className="form-label">Year</label>
                <div className="input-wrapper">
                  <span className="input-icon">📅</span>
                  <select 
                    className="modern-input modern-select"
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

            </div>
          </>
        )}

        <button onClick={handleSignup} className="form-btn">
          Create Account
        </button>

        <div className="form-footer">
          Already have an account? <Link to="/login" className="form-link">Sign In</Link>
        </div>

      </div>
    </div>
  );
}

export default Signup;