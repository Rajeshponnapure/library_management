// frontend/src/Login.jsx
import React from 'react';
import './index.css';

function Login() {
  return (
    <div className="container" style={{textAlign: 'center', marginTop: '50px'}}>
      <div className="search-card">
        <h1>Login</h1>
        <p>Student & Faculty Login Portal</p>
        <input type="text" placeholder="Email ID" style={{display: 'block', width: '80%', margin: '10px auto'}} />
        <input type="password" placeholder="Password" style={{display: 'block', width: '80%', margin: '10px auto'}} />
        <button className="btn-gold" style={{marginTop: '20px'}}>Sign In</button>
      </div>
    </div>
  );
}

export default Login;