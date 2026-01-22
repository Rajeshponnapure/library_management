// frontend/src/AdminDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import AdminIssue from './AdminIssue'; 
import './index.css';

function AdminDashboard() {
  const [stats, setStats] = useState({ 
    borrow_requests: [], 
    return_requests: [],
    active_loans: [], 
    total_books: 0, 
    books_lent: 0, 
    available_copies: 0 
  });
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); 
  
  const issuedSectionRef = useRef(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/admin/dashboard-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
        const res = await axios.get('http://127.0.0.1:8000/admin/users', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const scrollToIssued = () => {
    issuedSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- HANDLERS ---
  const handleBorrowAction = async (id, type) => {
    try {
        await axios.post(`http://127.0.0.1:8000/admin/requests/${id}/${type}`, {}, { 
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
        });
        alert(`Request ${type}ed!`);
        fetchStats();
    } catch (err) { alert("Failed to process request"); }
  };

  const handleReturnApprove = async (id) => {
    try {
      const res = await axios.post(`http://127.0.0.1:8000/admin/approve-return/${id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(`Return Approved. Fine Collected: ₹${res.data.fine}`);
      fetchStats();
    } catch (err) { alert("Error approving return"); }
  };

  // --- NEW DELETE USER HANDLER ---
  const handleDeleteUser = async (userId) => {
    if(!window.confirm("Are you sure you want to permanently delete this user?")) return;

    try {
        await axios.delete(`http://127.0.0.1:8000/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert("User Deleted Successfully");
        fetchUsers(); // Refresh the list
    } catch (err) {
        alert("Delete Failed: " + (err.response?.data?.detail || "Unknown Error"));
    }
  };

  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <h1 style={{color: 'white', margin:0}}>Admin Dashboard</h1>
        <div>
            <button className={`btn-gold ${activeTab === 'overview' ? '' : 'btn-cancel'}`} onClick={()=>setActiveTab('overview')} style={{marginRight:'10px'}}>Overview</button>
            <button className={`btn-gold ${activeTab === 'users' ? '' : 'btn-cancel'}`} onClick={()=>setActiveTab('users')}>User Management</button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
            {/* 1. STATS CARDS */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'40px'}}>
                <div className="glass-card" style={{padding:'20px', textAlign:'center', borderLeft:'5px solid var(--primary)'}}>
                    <h3 style={{margin:0, color:'#666'}}>Total Titles</h3>
                    <h1 style={{margin:'10px 0', fontSize:'2.5rem', color:'var(--primary)'}}>{stats.total_books}</h1>
                </div>
                <div className="glass-card" style={{padding:'20px', textAlign:'center', borderLeft:'5px solid #28a745'}}>
                    <h3 style={{margin:0, color:'#666'}}>Available Copies</h3>
                    <h1 style={{margin:'10px 0', fontSize:'2.5rem', color:'#28a745'}}>{stats.available_copies}</h1>
                </div>
                
                <div className="glass-card" onClick={scrollToIssued} style={{padding:'20px', textAlign:'center', borderLeft:'5px solid #d4a017', cursor: 'pointer'}}>
                    <h3 style={{margin:0, color:'#666'}}>Books Lent ⇩</h3>
                    <h1 style={{margin:'10px 0', fontSize:'2.5rem', color:'#d4a017'}}>{stats.books_lent}</h1>
                </div>

                <div className="glass-card" style={{padding:'20px', textAlign:'center', borderLeft:'5px solid #dc3545'}}>
                    <h3 style={{margin:0, color:'#666'}}>Pending Actions</h3>
                    <h1 style={{margin:'10px 0', fontSize:'2.5rem', color:'#dc3545'}}>
                        {stats.borrow_requests.length + stats.return_requests.length}
                    </h1>
                </div>
            </div>

            {/* 2. ISSUE BOOK SECTION */}
            <div className="glass-card" style={{marginBottom:'30px'}}>
                <h3 style={{color: 'var(--primary)', borderBottom: '2px solid var(--accent)', display:'inline-block'}}>Issue New Book</h3>
                <AdminIssue />
            </div>

            {/* 3. RETURN REQUESTS */}
            {stats.return_requests.length > 0 && (
                <div className="glass-card" style={{marginBottom:'30px', borderLeft: '5px solid #ffc107', background:'#fffbf2'}}>
                    <h3 style={{color: '#856404'}}>⚠️ Return Requests</h3>
                    <table>
                        <thead>
                            <tr style={{background: '#ffc107', color: '#000'}}>
                                <th>Student</th>
                                <th>Book Returning</th>
                                <th>Due Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.return_requests.map((req) => (
                                <tr key={req.request_id}>
                                    <td>
                                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                            <img src={req.student_photo || "https://via.placeholder.com/40"} style={{width:'40px', height:'40px', borderRadius:'50%'}} />
                                            <div><strong>{req.student_name}</strong><br/><span style={{fontSize:'0.8rem'}}>{req.student_reg}</span></div>
                                        </div>
                                    </td>
                                    <td><b>{req.book_title}</b><br/><span style={{fontSize:'0.8rem'}}>Acc: {req.book_acc_no}</span></td>
                                    <td>{req.due_date}</td>
                                    <td>
                                        <button className="btn-gold" onClick={() => handleReturnApprove(req.request_id)}>
                                            Approve Return
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 4. INCOMING BORROW REQUESTS */}
            {stats.borrow_requests.length > 0 && (
                <div className="glass-card" style={{marginBottom:'30px', borderLeft: '5px solid #28a745'}}>
                    <h3 style={{color: '#155724'}}>📥 Incoming Borrow Requests</h3>
                    <table>
                        <thead>
                            <tr style={{background: '#28a745', color: 'white'}}>
                                <th>Student</th>
                                <th>Requested Book</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.borrow_requests.map((req) => (
                                <tr key={req.request_id}>
                                    <td>
                                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                            <img src={req.student_photo || "https://via.placeholder.com/40"} style={{width:'40px', height:'40px', borderRadius:'50%'}} />
                                            <div><strong>{req.student_name}</strong><br/><span style={{fontSize:'0.8rem'}}>{req.student_reg}</span></div>
                                        </div>
                                    </td>
                                    <td><b>{req.book_title}</b><br/><span style={{fontSize:'0.8rem'}}>Acc: {req.book_acc_no}</span></td>
                                    <td>{req.request_date}</td>
                                    <td>
                                        <button className="btn-gold" style={{marginRight:'10px'}} onClick={() => handleBorrowAction(req.request_id, 'approve')}>Approve</button>
                                        <button className="btn-danger" onClick={() => handleBorrowAction(req.request_id, 'reject')}>Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 5. CURRENTLY ISSUED BOOKS */}
            <div className="glass-card" ref={issuedSectionRef}>
                <h2 style={{color: 'var(--primary)', marginBottom: '20px'}}>
                    Currently Issued Books Details
                    <span style={{fontSize:'1rem', marginLeft:'10px', background:'#eee', padding:'5px 10px', borderRadius:'15px'}}>{stats.active_loans.length}</span>
                </h2>
                {stats.active_loans.length > 0 ? (
                <div style={{overflowX: 'auto'}}>
                  <table style={{minWidth: '100%', borderCollapse:'separate', borderSpacing:'0 10px'}}>
                    <thead>
                      <tr style={{background:'none'}}>
                        <th style={{paddingLeft:'15px'}}>Student Profile</th>
                        <th>Contact Info</th>
                        <th>Book Borrowed</th>
                        <th>Timeline & Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.active_loans.map((loan) => (
                        <tr key={loan.transaction_id} style={{background:'white', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                          <td style={{padding:'15px', borderRadius:'10px 0 0 10px'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                <img src={loan.student_photo || "https://via.placeholder.com/50"} style={{width:'55px', height:'55px', borderRadius:'50%', objectFit:'cover', border:'2px solid var(--accent)'}} />
                                <div>
                                    <div style={{fontWeight:'bold', fontSize:'1.05rem', color:'var(--primary)'}}>{loan.student_name}</div>
                                    <div style={{fontSize:'0.85rem', color:'#555', marginTop:'2px'}}>
                                        {loan.student_reg} 
                                        {loan.student_branch && <span style={{background:'#eee', padding:'1px 6px', borderRadius:'4px', marginLeft:'8px'}}>{loan.student_branch}</span>}
                                        {loan.student_year && <span style={{background:'#eee', padding:'1px 6px', borderRadius:'4px', marginLeft:'5px'}}>{loan.student_year} Year</span>}
                                    </div>
                                </div>
                            </div>
                          </td>
                          <td style={{fontSize:'0.9rem', color:'#444'}}>
                            {loan.student_email ? <div>📧 {loan.student_email}</div> : <div style={{color:'#999'}}>No Email</div>}
                            <div>📞 {loan.student_mobile || "No Mobile"}</div>
                          </td>
                          <td>
                            <div style={{fontWeight:'600', color:'#000'}}>{loan.book_title}</div>
                            <div style={{fontSize:'0.85rem', color:'#666', marginTop:'2px'}}>ACC: {loan.book_acc_no}</div>
                          </td>
                          <td style={{borderRadius:'0 10px 10px 0'}}>
                            <div style={{fontSize:'0.85rem', color:'#666'}}>Issued: {loan.issue_date}</div>
                            <div style={{marginTop:'5px', fontWeight:'bold', color: loan.fine_est > 0 ? '#d32f2f' : '#2e7d32'}}>
                                Due: {loan.due_date}
                                {loan.fine_est > 0 && <span style={{display:'block', fontSize:'0.8rem', background:'#ffebee', padding:'2px 5px', borderRadius:'4px', marginTop:'2px'}}>⚠️ Fine: ₹{loan.fine_est}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                ) : <p style={{color:'#666', fontStyle:'italic'}}>No books are currently issued.</p>}
            </div>
        </>
      ) : (
        /* USER MANAGEMENT TAB */
        <div className="glass-card">
            <h3>Registered Users Directory</h3>
            <table>
                <thead>
                    <tr><th>Photo</th><th>Name / Reg No</th><th>Email</th><th>Role</th><th>Books Held</th><th>Action</th></tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td><img src={u.photo_url || "https://via.placeholder.com/40"} style={{width:'40px', height:'40px', borderRadius:'50%'}} /></td>
                            <td><strong>{u.full_name}</strong><br/><span style={{fontSize:'0.8rem', color:'#666'}}>{u.registration_number || 'N/A'}</span></td>
                            <td>{u.email}</td>
                            <td><span className="badge">{u.role}</span></td>
                            <td style={{fontWeight:'bold', color: u.active_loans > 0 ? 'red' : 'green'}}>{u.active_loans} Active Loans</td>
                            {/* DELETE BUTTON */}
                            <td>
                                {u.role !== 'admin' && (
                                    <button 
                                        onClick={() => handleDeleteUser(u.id)} 
                                        className="btn-danger" 
                                        style={{padding:'5px 10px', fontSize:'0.8rem'}}
                                    >
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;