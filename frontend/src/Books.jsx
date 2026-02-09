// frontend/src/Books.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './index.css';

function Books() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All'); 
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setPage(1); }, [query, department]);
  useEffect(() => { fetchBooks(); }, [page, department, query]); 

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/books/search/?query=${query}&department=${department}&page=${page}&limit=20`);
      if (res.data && Array.isArray(res.data.data)) {
          setBooks(res.data.data);
          setTotalPages(res.data.total_pages || 1);
      } else if (Array.isArray(res.data)) {
          setBooks(res.data);
      }
    } catch (err) { console.error("Error fetching books:", err); } 
    finally { setLoading(false); }
  };

  const handleRequest = async (bookId) => {
    try {
        await axios.post(`http://127.0.0.1:8000/request-book/${bookId}`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert("Request Sent! Admin will review.");
    } catch (err) {
        if(err.response?.status === 401) navigate('/login');
        else alert(err.response?.data?.detail || "Request Failed");
    }
  };

  // --- NEW: COOL STATUS BADGE GENERATOR ---
  const renderStatus = (copies) => {
    const safeCopies = copies || 0;
    
    // 1. HIGH STOCK (Green)
    if (safeCopies >= 5) {
        return (
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(16, 185, 129, 0.1)', // Soft Green
                color: '#059669',
                padding: '6px 12px', borderRadius: '20px',
                fontSize: '0.8rem', fontWeight: '700',
                border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
                <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#10b981', boxShadow:'0 0 4px #10b981'}}></span>
                {safeCopies} Available
            </div>
        );
    } 
    // 2. LOW STOCK (Orange)
    else if (safeCopies > 0) {
        return (
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(245, 158, 11, 0.1)', // Soft Orange
                color: '#d97706',
                padding: '6px 12px', borderRadius: '20px',
                fontSize: '0.8rem', fontWeight: '700',
                border: '1px solid rgba(245, 158, 11, 0.2)'
            }}>
                <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 4px #f59e0b'}}></span>
                Only {safeCopies} Left
            </div>
        );
    } 
    // 3. OUT OF STOCK (Red/Gray)
    else {
        return (
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(239, 68, 68, 0.08)', // Soft Red
                color: '#dc2626',
                padding: '6px 12px', borderRadius: '20px',
                fontSize: '0.8rem', fontWeight: '600',
                border: '1px solid rgba(239, 68, 68, 0.15)'
            }}>
                <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#ef4444'}}></span>
                Out of Stock
            </div>
        );
    }
  };

  // INLINE STYLES (To ensure visibility without extra CSS files)
  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.98)',
    padding: '30px', borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #eaeaea', marginTop: '20px'
  };

  const inputStyle = {
    padding: '12px 16px', border: '1px solid #e1e4e8',
    borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
    transition: 'border-color 0.2s', backgroundColor: '#f8fafc'
  };

  const btnStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #d4a017 0%, #b8860b 100%)',
    color: 'white', border: 'none', borderRadius: '10px',
    cursor: 'pointer', fontWeight: '600',
    boxShadow: '0 2px 4px rgba(212, 160, 23, 0.3)'
  };

  return (
    <div className="container" style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
      <div style={cardStyle}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px', borderBottom:'2px solid #f0f0f0', paddingBottom:'15px'}}>
            <h2 style={{color: '#1a202c', margin:0, display:'flex', alignItems:'center', gap:'10px'}}>
                📚 <span style={{background: 'linear-gradient(90deg, #d4a017, #f6c855)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Library Catalog</span>
            </h2>
            <span style={{fontSize:'0.9rem', color:'#666', background:'#f7f7f7', padding:'5px 10px', borderRadius:'8px'}}>
                Page {page} of {totalPages}
            </span>
        </div>
        
        {/* MODERN SEARCH BAR */}
        <div style={{display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap'}}>
          <input 
            style={{...inputStyle, flex: 2, minWidth: '220px'}}
            placeholder="🔍 Search Title, Author, ID..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onKeyDown={(e)=>e.key==='Enter'&&fetchBooks()} 
          />
          <select style={{...inputStyle, flex: 1, minWidth: '150px', cursor:'pointer'}} value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="All">All Departments</option><option value="CSE">CSE</option><option value="ECE">ECE</option>
            <option value="EEE">EEE</option><option value="CIVIL">CIVIL</option><option value="MECH">MECH</option>
            <option value="MBA">MBA</option><option value="General">General</option><option value="BS&H">BS&H</option>
          </select>
          <button style={btnStyle} onClick={fetchBooks}>Search Books</button>
        </div>

        {loading ? (
            <div style={{textAlign:'center', padding:'60px', color:'#94a3b8'}}>
                <div style={{fontSize:'2rem', marginBottom:'10px'}}>⏳</div>
                <p>Loading Library Data...</p>
            </div>
        ) : (
            <>
            <div style={{overflowX: 'auto', borderRadius: '12px', border: '1px solid #edf2f7'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '900px'}}>
                    <thead>
                        <tr style={{background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0'}}>
                            <th style={{padding:'16px', fontWeight:'600'}}>Acc No</th>
                            <th style={{padding:'16px', fontWeight:'600'}}>Book Details</th>
                            <th style={{padding:'16px', fontWeight:'600'}}>Dept</th>
                            <th style={{padding:'16px', fontWeight:'600'}}>Publication</th>
                            <th style={{padding:'16px', fontWeight:'600'}}>Cost</th>
                            <th style={{padding:'16px', fontWeight:'600'}}>Status</th>
                            <th style={{padding:'16px', fontWeight:'600'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map((book, index) => (
                            <tr key={book.id} style={{
                                borderBottom: '1px solid #f1f5f9', 
                                background: index % 2 === 0 ? 'white' : '#fcfcfc',
                                transition: 'background 0.2s'
                            }}>
                                <td style={{padding:'16px', fontFamily:'monospace', color:'#64748b', fontWeight:'bold'}}>{book.acc_no}</td>
                                <td style={{padding:'16px'}}>
                                    <div style={{fontWeight:'700', color:'#1e293b', fontSize:'0.95rem'}}>{book.title}</div>
                                    <div style={{fontSize:'0.85rem', color:'#64748b', marginTop:'4px'}}>{book.author}</div>
                                    {book.volume && <span style={{background:'#e2e8f0', color:'#475569', padding:'2px 6px', borderRadius:'4px', fontSize:'0.7rem', marginTop:'6px', display:'inline-block', fontWeight:'bold'}}>{book.volume}</span>}
                                </td>
                                <td style={{padding:'16px'}}>
                                    <span style={{background:'#eff6ff', color:'#2563eb', padding:'4px 10px', borderRadius:'6px', fontWeight:'600', fontSize:'0.8rem', border:'1px solid #dbeafe'}}>
                                        {book.department}
                                    </span>
                                </td>
                                <td style={{padding:'16px'}}>
                                    <div style={{color:'#334155'}}>{book.publisher}</div>
                                    <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>{book.edition_year}</div>
                                </td>
                                <td style={{padding:'16px', fontWeight:'600', color:'#475569', fontFamily:'monospace'}}>
                                    {book.cost ? `₹${book.cost}` : '-'}
                                </td>
                                
                                {/* COOL STATUS COLUMN */}
                                <td style={{padding: '16px'}}>
                                    {renderStatus(book.available_copies)}
                                </td>

                                <td style={{padding:'16px'}}>
                                    <button 
                                        onClick={()=>handleRequest(book.id)} 
                                        disabled={book.available_copies===0}
                                        style={{
                                            padding: '8px 16px', 
                                            fontSize: '0.85rem', 
                                            borderRadius: '8px',
                                            border: 'none',
                                            fontWeight: '600',
                                            background: book.available_copies > 0 ? '#0f172a' : '#cbd5e1',
                                            color: 'white',
                                            cursor: book.available_copies > 0 ? 'pointer' : 'not-allowed',
                                            boxShadow: book.available_copies > 0 ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                                        }}
                                    >
                                        Request
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {books.length === 0 && (
                    <div style={{textAlign: 'center', padding: '60px', color: '#94a3b8'}}>
                        <p style={{fontSize: '1.1rem'}}>No books found matching criteria.</p>
                    </div>
                )}
            </div>

            {/* MODERN PAGINATION CONTROLS */}
            <div style={{display:'flex', justifyContent:'center', gap:'12px', marginTop:'30px', alignItems:'center'}}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{
                        padding: '10px 20px', border: '1px solid #e2e8f0', background: 'white',
                        color: page === 1 ? '#cbd5e1' : '#475569', borderRadius: '8px', fontWeight: '600',
                        cursor: page === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                    }}>
                    ⬅ Previous
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                    style={{
                        padding: '10px 20px', border: '1px solid #e2e8f0', background: 'white',
                        color: page >= totalPages ? '#cbd5e1' : '#475569', borderRadius: '8px', fontWeight: '600',
                        cursor: page >= totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                    }}>
                    Next ➡
                </button>
            </div>
            </>
        )}
      </div>
    </div>
  );
}

export default Books;