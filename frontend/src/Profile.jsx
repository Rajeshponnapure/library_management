// frontend/src/Profile.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './index.css';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Please login first!");
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://127.0.0.1:8000/users/me', {
          headers: { Authorization: `Bearer ${token}` } // Send Token to Backend
        });
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.response && error.response.status === 401) {
            alert("Session expired. Please login again.");
            navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      {/* 1. User Details Card */}
      <div className="search-card" style={{textAlign: 'left', marginBottom: '20px'}}>
        <h1 style={{color: '#003366'}}>My Profile</h1>
        <div style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap'}}>
            <div>
                <p><strong>Name:</strong> {profile.full_name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role.toUpperCase()}</p>
            </div>
            <div style={{background: '#f0f8ff', padding: '15px', borderRadius: '8px'}}>
                <h3 style={{margin: 0, color: '#003366'}}>{profile.tokens_used} / {profile.tokens_total}</h3>
                <p style={{margin: 0, fontSize: '0.9rem'}}>Tokens Used</p>
            </div>
        </div>
      </div>

      {/* 2. Borrowed Books Table */}
      <div className="table-card">
        <h3>My Borrowed Books</h3>
        {profile.active_loans.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Borrowed On</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {profile.active_loans.map((loan, index) => (
                <tr key={index}>
                  <td>
                    <strong>{loan.title}</strong><br/>
                    <span style={{fontSize: '0.8rem', color: '#666'}}>{loan.acc_no}</span>
                  </td>
                  <td>{loan.issue_date}</td>
                  <td style={{
                      color: new Date(loan.due_date) < new Date() ? 'red' : 'black',
                      fontWeight: 'bold'
                  }}>
                    {loan.due_date}
                  </td>
                  <td>
                    {loan.fine_est > 0 ? (
                        <span style={{color: 'red'}}>Overdue (Fine: ₹{loan.fine_est})</span>
                    ) : (
                        <span style={{color: 'green'}}>On Time</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>You have not borrowed any books yet.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;