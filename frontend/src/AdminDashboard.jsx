import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './index.css';

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    // 1. Security Check: Redirect if not Admin
    if (!token || role !== 'admin') {
      alert("Access Denied: Admins Only");
      navigate('/');
      return;
    }
    fetchRequests();
  }, [navigate, token, role]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/admin/requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      // action is either "approve" or "reject"
      await axios.post(
        `http://127.0.0.1:8000/admin/requests/${requestId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Request ${action}ed successfully!`);
      // Refresh list to remove the processed item
      fetchRequests();
    } catch (err) {
      alert("Error processing request: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h1 style={{ color: '#003366', borderBottom: '2px solid #FFD700', paddingBottom: '10px' }}>
          Admin Dashboard
        </h1>
        <h3 style={{ textAlign: 'left', color: '#666' }}>Pending Book Requests</h3>

        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr style={{ background: '#003366', color: 'white' }}>
                <th>Request ID</th>
                <th>Student Name</th>
                <th>Book Title</th>
                <th>Accession No</th>
                <th>Requested Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.request_id}>
                    <td>#{req.request_id}</td>
                    <td>
                      <strong>{req.user_name}</strong><br/>
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>{req.user_email}</span>
                    </td>
                    <td>{req.book_title}</td>
                    <td>{req.book_acc_no}</td>
                    <td>{req.request_date}</td>
                    <td>
                      <button 
                        className="btn-gold" 
                        onClick={() => handleAction(req.request_id, 'approve')}
                        style={{ marginRight: '10px', padding: '5px 15px', fontSize: '0.9rem' }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(req.request_id, 'reject')}
                        style={{ 
                          padding: '5px 15px', 
                          background: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '5px', 
                          cursor: 'pointer' 
                        }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    No pending requests at the moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;