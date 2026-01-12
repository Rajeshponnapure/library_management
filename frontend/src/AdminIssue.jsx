// frontend/src/AdminIssue.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

function AdminIssue() {
  const [formData, setFormData] = useState({
    student_email: '',
    book_acc_no: ''
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIssue = async () => {
    setMessage(null);
    setError(null);

    // Basic Validation
    if(!formData.student_email || !formData.book_acc_no) {
        setError("Please enter both Email and Accession Number");
        return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/admin/issue-book', formData);
      setMessage(response.data); // Stores the success message
      
      // Clear form on success
      setFormData({ student_email: '', book_acc_no: '' });
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Could not issue book");
    }
  };

  return (
    <div className="container" style={{marginTop: '50px'}}>
      <div className="search-card" style={{ maxWidth: '600px', margin: '0 auto', borderTop: '5px solid #003366' }}>
        <h1 style={{ color: '#003366' }}>📚 Librarian Console</h1>
        <p>Issue a book to a Student or Faculty member.</p>

        {/* Success Message */}
        {message && (
            <div style={{background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px', marginBottom: '15px', textAlign: 'left'}}>
                <strong>Success!</strong><br/>
                Issued <b>{message.book}</b> to <b>{message.student}</b>.<br/>
                Return by: <b>{message.due_date}</b>
            </div>
        )}

        {/* Error Message */}
        {error && (
            <div style={{background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '5px', marginBottom: '15px'}}>
                {error}
            </div>
        )}

        <div style={{textAlign: 'left'}}>
            <label style={{fontWeight: 'bold'}}>Student Email:</label>
            <input 
                name="student_email" 
                placeholder="e.g. student@college.edu" 
                value={formData.student_email}
                onChange={handleChange}
                style={{width: '95%', marginBottom: '15px'}}
            />

            <label style={{fontWeight: 'bold'}}>Book Accession No:</label>
            <input 
                name="book_acc_no" 
                placeholder="e.g. 1045" 
                value={formData.book_acc_no}
                onChange={handleChange}
                style={{width: '95%', marginBottom: '15px'}}
            />
        </div>

        <button className="btn-gold" onClick={handleIssue} style={{width: '100%', marginTop: '10px'}}>
            Confirm Issue
        </button>

      </div>
    </div>
  );
}

export default AdminIssue;