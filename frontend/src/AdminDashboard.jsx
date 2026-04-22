// frontend/src/AdminDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import AdminIssue from './AdminIssue'; 
import './index.css';

function AdminDashboard() {
  // --- STATE ---
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
  const [fileUrl, setFileUrl] = useState(''); // Moved INSIDE the component

  const pendingActionsRef = useRef(null);
  const issuedSectionRef = useRef(null);
  const fileInputRef = useRef(null); 

  // --- EFFECTS ---
  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  // --- API CALLS ---
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

  // --- HANDLERS ---
  const handleUrlImport = async () => {
    if (!fileUrl) return;
    try {
        alert("Fetching file from URL...");
        await axios.post('http://127.0.0.1:8000/admin/import-from-url', 
            { url: fileUrl }, 
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
        );
        alert("Success! Books imported.");
        fetchStats();
    } catch (err) {
        alert("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
        alert("Uploading... Please wait.");
        const res = await axios.post('http://127.0.0.1:8000/admin/upload-books', formData, {
            headers: { 
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}` 
            }
        });
        alert(res.data.message);
        fetchStats(); 
    } catch (err) {
        alert("Upload Failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const scrollToIssued = () => {
    issuedSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPendingActions = () => {
    pendingActionsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleBorrowAction = async (id, type) => {
    try {
        await axios.post(`http://127.0.0.1:8000/admin/requests/${id}/${type}`, {}, { 
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
        });
        alert(type === 'approve' ? 'Request approved and book issued!' : 'Request rejected.');
        fetchStats();
    } catch (err) { alert(err.response?.data?.detail || "Failed to process request"); }
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

  const handleDeleteUser = async (userId) => {
    if(!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
        await axios.delete(`http://127.0.0.1:8000/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert("User Deleted Successfully");
        fetchUsers(); 
    } catch (err) {
        alert("Delete Failed: " + (err.response?.data?.detail || "Unknown Error"));
    }
  };

  // --- RENDER ---
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
                <div className="glass-card" onClick={scrollToPendingActions} style={{padding:'20px', textAlign:'center', borderLeft:'5px solid #dc3545', cursor:'pointer'}}>
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

            {/* BULK UPLOAD SECTION */}
            <div className="glass-card" style={{marginBottom:'30px', borderLeft:'5px solid #007bff'}}>
                <h3 style={{color: '#0056b3'}}>📂 Bulk Upload Books</h3>
                <p style={{color:'#666', fontSize:'0.9rem'}}>Upload your Library Accession Register (Excel file) to add books instantly.</p>
                <input type="file" ref={fileInputRef} style={{display: 'none'}} accept=".xlsx, .xls" onChange={handleFileUpload} />
                <button className="btn-gold" style={{background:'#007bff', color:'white', border:'none'}} onClick={() => fileInputRef.current.click()}>
                    Select Excel File
                </button>
            </div>

            {/* URL IMPORT SECTION */}
            <div className="glass-card" style={{marginBottom:'30px', borderLeft:'5px solid #28a745'}}>
                <h3>☁️ Import from Link</h3>
                <p style={{fontSize:'0.9rem', color:'#666'}}>Paste a direct download link (Dropbox/Google Drive Direct Link).</p>
                <div style={{display: 'flex', gap: '10px'}}>
                    <input className="modern-input" placeholder="https://example.com/books.xlsx" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} style={{flex: 1}} />
                    <button className="btn-gold" style={{background: '#28a745'}} onClick={handleUrlImport}>Import</button>
                </div>
            </div>
            
            {/* MANUAL ADD BOOK */}
            <div className="glass-card" style={{marginTop: '30px', borderLeft: '5px solid #d4a017'}}>
                <h3 style={{color: 'var(--primary)', borderBottom:'2px solid #eee', paddingBottom:'10px'}}>📖 Add New Book Manually</h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const bookData = {
                        acc_no: form.acc_no.value, title: form.title.value, author: form.author.value,
                        department: form.department.value, total_copies: parseInt(form.total_copies.value),
                        publisher: form.publisher.value, edition_year: form.edition_year.value,
                        pages: form.pages.value, volume: form.volume.value, source: form.source.value,
                        bill_number: form.bill_number.value, cost: parseFloat(form.cost.value || 0)
                    };
                    try {
                        await axios.post('http://127.0.0.1:8000/books/', bookData, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                        alert("Book Added Successfully!"); form.reset(); fetchStats();
                    } catch (err) { alert("Error: " + (err.response?.data?.detail || err.message)); }
                }}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                        <input name="acc_no" className="modern-input" placeholder="Acc No *" required />
                        <input name="title" className="modern-input" placeholder="Book Title *" required />
                        <input name="author" className="modern-input" placeholder="Author *" required />
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                        <select name="department" className="modern-input">
                            <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option>
                            <option value="MECH">MECH</option><option value="CIVIL">CIVIL</option><option value="MBA">MBA</option>
                            <option value="General">General</option><option value="BS&H">BS&H</option>
                        </select>
                        <input name="publisher" className="modern-input" placeholder="Publisher" />
                        <input name="edition_year" className="modern-input" placeholder="Edition / Year" />
                        <input name="total_copies" type="number" className="modern-input" defaultValue="1" min="1" placeholder="Copies" />
                    </div>
                    <button type="submit" className="btn-gold" style={{width:'100%'}}>➕ Add Book</button>
                </form>
            </div>

            {/* PENDING REQUESTS */}
            <div className="glass-card" ref={pendingActionsRef} style={{marginTop:'30px', marginBottom:'30px', borderLeft:'5px solid #dc3545'}}>
                <h2 style={{color:'var(--primary)', marginBottom:'10px'}}>Pending Requests</h2>
                <p style={{color:'#666', marginTop:0}}>
                    Review student borrow requests and return confirmations.
                </p>

                {stats.borrow_requests.length === 0 && stats.return_requests.length === 0 ? (
                    <p style={{color:'#666', fontStyle:'italic', marginBottom:0}}>No pending requests right now.</p>
                ) : (
                    <>
                        {stats.borrow_requests.length > 0 && (
                            <div style={{marginTop:'25px'}}>
                                <h3 style={{color:'#155724', marginBottom:'12px'}}>Borrow Requests</h3>
                                <div style={{overflowX:'auto'}}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Requested Book</th>
                                                <th>Requested On</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.borrow_requests.map((req) => (
                                                <tr key={`borrow-${req.request_id}`}>
                                                    <td>
                                                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                                            <img src={req.student_photo || "https://via.placeholder.com/40"} alt="" style={{width:'42px', height:'42px', borderRadius:'50%', objectFit:'cover'}} />
                                                            <div>
                                                                <strong>{req.student_name}</strong>
                                                                <div style={{fontSize:'0.82rem', color:'#666'}}>{req.student_reg || 'No registration number'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <strong>{req.book_title}</strong>
                                                        <div style={{fontSize:'0.82rem', color:'#666'}}>Acc: {req.book_acc_no}</div>
                                                    </td>
                                                    <td>{req.request_date}</td>
                                                    <td>
                                                        <button className="btn-gold" style={{marginRight:'10px', padding:'8px 14px'}} onClick={() => handleBorrowAction(req.request_id, 'approve')}>
                                                            Approve
                                                        </button>
                                                        <button className="btn-danger" style={{padding:'8px 14px'}} onClick={() => handleBorrowAction(req.request_id, 'reject')}>
                                                            Reject
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {stats.return_requests.length > 0 && (
                            <div style={{marginTop:'30px'}}>
                                <h3 style={{color:'#856404', marginBottom:'12px'}}>Return Requests</h3>
                                <div style={{overflowX:'auto'}}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Returning Book</th>
                                                <th>Due Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.return_requests.map((req) => (
                                                <tr key={`return-${req.request_id}`}>
                                                    <td>
                                                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                                            <img src={req.student_photo || "https://via.placeholder.com/40"} alt="" style={{width:'42px', height:'42px', borderRadius:'50%', objectFit:'cover'}} />
                                                            <div>
                                                                <strong>{req.student_name}</strong>
                                                                <div style={{fontSize:'0.82rem', color:'#666'}}>{req.student_reg || 'No registration number'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <strong>{req.book_title}</strong>
                                                        <div style={{fontSize:'0.82rem', color:'#666'}}>Acc: {req.book_acc_no}</div>
                                                    </td>
                                                    <td>{req.due_date}</td>
                                                    <td>
                                                        <button className="btn-gold" style={{padding:'8px 14px'}} onClick={() => handleReturnApprove(req.request_id)}>
                                                            Approve Return
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

             {/* 5. CURRENTLY ISSUED BOOKS */}
            <div className="glass-card" ref={issuedSectionRef} style={{marginTop:'30px'}}>
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
                                    <div style={{fontSize:'0.85rem', color:'#555', marginTop:'2px'}}>{loan.student_reg}</div>
                                </div>
                            </div>
                          </td>
                          <td>{loan.student_email}</td>
                          <td>{loan.book_title}<br/>Acc: {loan.book_acc_no}</td>
                          <td>Issued: {loan.issue_date}<br/>Due: {loan.due_date}</td>
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
                    <tr><th>Photo</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td><img src={u.photo_url || "https://via.placeholder.com/40"} style={{width:'40px', height:'40px', borderRadius:'50%'}} /></td>
                            <td>{u.full_name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>
                                {u.role !== 'admin' && (
                                    <button onClick={() => handleDeleteUser(u.id)} className="btn-danger">Delete</button>
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
