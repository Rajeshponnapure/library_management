// frontend/src/Signup.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './index.css';

function Signup() {
  const navigate = useNavigate();
  
  // State to hold all form data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student', // Default is student
    registration_number: '',
    branch: '',
    year: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      // Send data to backend
      await axios.post('http://127.0.0.1:8000/signup', formData);
      alert("Account Created Successfully! Please Login.");
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error(error);
      alert("Error: " + (error.response?.data?.detail || "Signup failed"));
    }
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <div className="search-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ color: '#003366' }}>Create Account</h1>
        
        {/* Basic Info */}
        <input name="full_name" placeholder="Full Name" onChange={handleChange} style={{width: '90%', margin:'10px 0'}} />
        <input name="email" placeholder="Email Address" onChange={handleChange} style={{width: '90%', margin:'10px 0'}} />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} style={{width: '90%', margin:'10px 0'}} />
        
        {/* Role Selector */}
        <div style={{ textAlign: 'left', width: '90%', margin: '10px auto' }}>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>I am a:</label>
          <select name="role" onChange={handleChange} value={formData.role} style={{ padding: '8px' }}>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        {/* CONDITIONAL RENDERING: Only show this if 'student' is selected */}
        {formData.role === 'student' && (
          <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <p style={{margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666'}}>Student Details</p>
            <input name="registration_number" placeholder="Registration No" onChange={handleChange} style={{width: '90%', margin:'5px 0'}} />
            <input name="branch" placeholder="Branch" onChange={handleChange} style={{width: '90%', margin:'5px 0'}} />
            <input name="year" placeholder="Year of Study" onChange={handleChange} style={{width: '90%', margin:'5px 0'}} />
          </div>
        )}

        <button className="btn-gold" onClick={handleSignup} style={{ width: '100%', marginTop: '20px' }}>
          Sign Up
        </button>
        
        <div style={{ marginTop: '15px' }}>
            <Link to="/login" style={{color: '#003366'}}>Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;