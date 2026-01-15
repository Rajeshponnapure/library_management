// frontend/src/Profile.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './index.css';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      const res = await axios.get('http://127.0.0.1:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      const { photo_url, ...textData } = res.data;
      setFormData(textData);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
        await axios.post('http://127.0.0.1:8000/users/me/photo', fd, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' }
        });
        alert("Photo Updated!");
        fetchProfile();
    } catch (error) { alert("Failed to upload photo."); }
  };

  const handleSave = async () => {
    try {
      await axios.put('http://127.0.0.1:8000/users/me', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Profile Text Updated!");
      setIsEditing(false);
      fetchProfile();
    } catch (err) { alert("Update failed"); }
  };

  const handleReturnRequest = async (txnId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/user/return-request/${txnId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Return Request Sent!");
      fetchProfile();
    } catch (err) { alert("Request failed"); }
  };

  if (!profile) return <div className="container" style={{textAlign:'center', marginTop:'50px'}}>Loading...</div>;

  return (
    <div className="container">
      <div className="profile-header-card">
        <div style={{display:'flex', alignItems:'flex-start'}}>
          <div className="profile-img-container" onClick={() => isEditing && fileInputRef.current.click()}>
            <img src={profile.photo_url || "https://via.placeholder.com/150?text=No+Img"} className="profile-img-large" alt="Profile"/>
            <div className={`img-overlay ${isEditing ? 'visible' : ''}`}><span className="camera-icon">📷</span></div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display: 'none'}} accept="image/*"/>
          </div>

          <div style={{flex:1}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h1 style={{margin:0, fontSize:'2.2rem'}}>
                {isEditing ? 'Edit Profile' : profile.full_name}
                {!isEditing && <span style={{fontSize:'0.9rem', background:'rgba(255,255,255,0.15)', border:'1px solid #c5a017', color:'#c5a017', padding:'4px 12px', borderRadius:'20px', marginLeft:'15px', verticalAlign:'middle'}}>
                  {profile.role.toUpperCase()}
                </span>}
              </h1>
              <button className={isEditing ? "btn-danger" : "btn-gold"} onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Done" : "Edit Profile"}
              </button>
            </div>
            <p style={{opacity:0.8, fontSize:'1.1rem', marginTop: '5px'}}>{profile.email}</p>
            
            <div className="profile-details-grid">
               <div className="detail-item"><label>Full Name</label>{isEditing ? <input className="edit-input" value={formData.full_name || ''} onChange={e=>setFormData({...formData, full_name:e.target.value})} /> : <span>{profile.full_name}</span>}</div>
               <div className="detail-item"><label>Mobile Number</label>{isEditing ? <input className="edit-input" value={formData.mobile_number || ''} onChange={e=>setFormData({...formData, mobile_number:e.target.value})} /> : <span>{profile.mobile_number || 'Not Set'}</span>}</div>
               {profile.role === 'student' && (
                 <>
                   <div className="detail-item"><label>Reg No</label>{isEditing ? <input className="edit-input" value={formData.registration_number||''} onChange={e=>setFormData({...formData, registration_number:e.target.value})} /> : <span>{profile.registration_number || 'Not Set'}</span>}</div>
                   <div className="detail-item"><label>Branch</label>{isEditing ? <input className="edit-input" value={formData.branch||''} onChange={e=>setFormData({...formData, branch:e.target.value})} /> : <span>{profile.branch || 'Not Set'}</span>}</div>
                 </>
               )}
            </div>
            {isEditing && <div style={{marginTop:'20px', textAlign:'right', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'15px'}}><button className="btn-gold" style={{padding:'10px 30px'}} onClick={handleSave}>Save Details</button></div>}
          </div>
        </div>
      </div>

     {/* --- PENDING REQUESTS SECTION --- */}
      {profile.pending_requests && profile.pending_requests.length > 0 && (
        <>
            {/* CHANGED COLOR TO WHITE HERE */}
            <h2 style={{color: 'white', borderLeft: '5px solid #ffc107', paddingLeft: '15px', marginTop: '40px'}}>
              Pending Requests
            </h2>
            <div className="books-grid">
                {profile.pending_requests.map((req) => (
                    <div key={req.request_id} className="book-card" style={{borderLeftColor: '#ffc107', background: '#fffcf5'}}>
                        <span className="status-badge" style={{background: '#ffecb3', color: '#856404'}}>Waiting Approval</span>
                        <h3 style={{marginBottom:'5px', color:'var(--primary)'}}>{req.title}</h3>
                        <p style={{color:'#666', fontSize:'0.9rem', margin:0}}>ACC: {req.acc_no}</p>
                        <p style={{fontSize:'0.8rem', color:'#888', marginTop:'10px'}}>Requested on: {req.request_date}</p>
                    </div>
                ))}
            </div>
        </>
      )}

      {/* --- BORROWED BOOKS SECTION --- */}
      {/* CHANGED COLOR TO WHITE HERE */}
      <h2 style={{color: 'white', borderLeft: '5px solid var(--accent)', paddingLeft: '15px', marginTop: '40px'}}>
        Borrowed Books
      </h2>
      
      <div className="books-grid">
        {profile.active_loans?.length > 0 ? profile.active_loans.map((loan) => (
             <div key={loan.transaction_id} className="book-card">
               <span className={`status-badge ${loan.status === 'Return Requested' ? 'status-requested' : 'status-issued'}`}>
                 {loan.status === 'Return Requested' ? 'Return Pending' : 'Active'}
               </span>
               <h3 style={{marginBottom:'5px', color:'var(--primary)'}}>{loan.title}</h3>
               <p style={{color:'#666', fontSize:'0.9rem', margin:0}}>ACC: {loan.acc_no}</p>
               <div style={{marginTop:'15px', paddingTop:'15px', borderTop:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                 <span style={{fontSize:'0.9rem'}}>Due: <b>{loan.due_date}</b></span>
                 {loan.status === 'Issued' && (
                   <button onClick={() => handleReturnRequest(loan.transaction_id)} style={{color:'var(--primary)', background:'none', border:'1px solid var(--primary)', borderRadius:'4px', cursor:'pointer'}}>Return</button>
                 )}
               </div>
             </div>
        )) : (
            // ALSO CHANGED "No Active Loans" TEXT TO WHITE/LIGHT GREY
            <p style={{color:'rgba(255,255,255,0.7)', marginLeft:'15px', fontStyle:'italic'}}>No active loans.</p>
        )}
      </div>
    </div>
  );
}
export default Profile;