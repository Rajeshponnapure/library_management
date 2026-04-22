// frontend/src/AdminBooks.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function AdminBooks() {
  // --- STATE ---
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All'); 
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Admin Specific
  const [showAddForm, setShowAddForm] = useState(false);
  
  // FORM STATE: Captures all 12 fields from your Excel sheets
  const [newBook, setNewBook] = useState({
    acc_no: '', 
    title: '', 
    author: '', 
    department: 'CSE', 
    total_copies: 1, 
    publisher: '', 
    edition_year: '', 
    pages: '', 
    volume: '', 
    source: '', 
    bill_number: '', 
    cost: ''
  });

  const token = localStorage.getItem('token');

  // --- EFFECTS ---
  useEffect(() => { setPage(1); }, [query, department]); // Reset page on search
  useEffect(() => { fetchBooks(); }, [page, query, department]); // Fetch on change

  // --- FETCH BOOKS (With Pagination) ---
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/books/search/?query=${query}&department=${department}&page=${page}&limit=20`);
      if (res.data && Array.isArray(res.data.data)) {
          setBooks(res.data.data);
          setTotalPages(res.data.total_pages || 1);
      } else {
          setBooks([]);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // --- DELETE BOOK ---
  const handleDelete = async (bookId) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this book permanently?")) return;
    try {
        await axios.delete(`http://127.0.0.1:8000/books/${bookId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Book Deleted");
        fetchBooks();
    } catch (err) { alert("Delete Failed"); }
  };

  // --- ADD BOOK ---
  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
        const payload = { ...newBook, cost: parseFloat(newBook.cost || 0) };
        await axios.post('http://127.0.0.1:8000/books/', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Book Added Successfully!");
        
        // Reset Form to blank
        setNewBook({ acc_no: '', title: '', author: '', department: 'CSE', total_copies: 1, publisher: '', edition_year: '', pages: '', volume: '', source: '', bill_number: '', cost: '' });
        setShowAddForm(false);
        fetchBooks();
    } catch (err) { alert("Error: " + (err.response?.data?.detail || err.message)); }
  };

  // --- HELPER: COOL STATUS PILLS (Matches User View) ---
  const renderStatus = (copies) => {
    const safeCopies = copies || 0;
    if (safeCopies >= 5) {
        return (
            <div style={{display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
                <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#10b981', boxShadow:'0 0 4px #10b981'}}></span>
                {safeCopies} Available
            </div>
        );
    } else if (safeCopies > 0) {
        return (
            <div style={{display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid rgba(245, 158, 11, 0.2)'}}>
                <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 4px #f59e0b'}}></span>
                Only {safeCopies} Left
            </div>
        );
    } else {
        return (
            <div style={{display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid rgba(239, 68, 68, 0.15)'}}>
                <span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#ef4444'}}></span>
                Out of Stock
            </div>
        );
    }
  };

  // --- STYLES ---
  const cardStyle = { background: 'rgba(255, 255, 255, 0.98)', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #eaeaea', marginTop: '20px' };
  const inputStyle = { padding: '12px 16px', border: '1px solid #e1e4e8', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#f8fafc', width: '100%' };

  return (
    <div className="container" style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
      
      {/* HEADER AREA */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
          <h2 style={{color: '#1a202c', margin:0, display:'flex', alignItems:'center', gap:'10px'}}>
              📚 <span style={{background: 'linear-gradient(90deg, #d4a017, #f6c855)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Manage Inventory</span>
          </h2>
          <button 
            className="btn-gold" 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{background: showAddForm ? '#dc3545' : 'linear-gradient(135deg, #d4a017 0%, #b8860b 100%)', padding: '10px 24px', borderRadius: '10px', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600'}}
          >
            {showAddForm ? '✖ Cancel' : '➕ Add New Book'}
          </button>
      </div>

      {/* SEARCH BAR (Matches User View) */}
      <div style={cardStyle}>
          <div style={{display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap'}}>
            <input 
                style={{...inputStyle, flex: 2, minWidth: '220px'}} 
                placeholder="🔍 Search Title, Author, Acc No..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
            />
            <select style={{...inputStyle, flex: 1, minWidth: '150px'}} value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="All">All Departments</option><option value="CSE">CSE</option><option value="ECE">ECE</option>
                <option value="EEE">EEE</option><option value="CIVIL">CIVIL</option><option value="MECH">MECH</option>
                <option value="MBA">MBA</option><option value="General">General</option><option value="BS&H">BS&H</option>
            </select>
          </div>

          {/* ADD BOOK FORM (Detailed Excel Fields) */}
          {showAddForm && (
            <div style={{background:'#fcfcfc', border:'1px solid #e2e8f0', padding:'25px', borderRadius:'12px', marginBottom:'30px', borderLeft:'5px solid #d4a017'}}>
                <h3 style={{marginTop:0, marginBottom:'20px', color:'#1e293b'}}>📖 Enter Book Details</h3>
                <form onSubmit={handleAddBook}>
                    
                    {/* Row 1: Identification */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr 2fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Accession No *</label>
                        <input style={inputStyle} placeholder="e.g. 5001" required value={newBook.acc_no} onChange={e=>setNewBook({...newBook, acc_no:e.target.value})} /></div>
                        
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Book Title *</label>
                        <input style={inputStyle} placeholder="e.g. Advanced Engineering Math" required value={newBook.title} onChange={e=>setNewBook({...newBook, title:e.target.value})} /></div>
                        
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Copies *</label>
                        <input style={inputStyle} type="number" required min="1" value={newBook.total_copies} onChange={e=>setNewBook({...newBook, total_copies:parseInt(e.target.value)})} /></div>
                    </div>

                    {/* Row 2: Details */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Author *</label>
                        <input style={inputStyle} placeholder="Author Name" required value={newBook.author} onChange={e=>setNewBook({...newBook, author:e.target.value})} /></div>
                        
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Department</label>
                        <select style={inputStyle} value={newBook.department} onChange={e=>setNewBook({...newBook, department:e.target.value})}>
                            <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option>
                            <option value="CIVIL">CIVIL</option><option value="MECH">MECH</option><option value="MBA">MBA</option>
                            <option value="General">General</option><option value="BS&H">BS&H</option>
                        </select></div>

                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Publisher</label>
                        <input style={inputStyle} placeholder="Publisher Name" value={newBook.publisher} onChange={e=>setNewBook({...newBook, publisher:e.target.value})} /></div>
                    </div>

                    {/* Row 3: Specifications */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Edition / Year</label>
                        <input style={inputStyle} placeholder="3rd / 2024" value={newBook.edition_year} onChange={e=>setNewBook({...newBook, edition_year:e.target.value})} /></div>
                        
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Pages</label>
                        <input style={inputStyle} placeholder="e.g. 450" value={newBook.pages} onChange={e=>setNewBook({...newBook, pages:e.target.value})} /></div>

                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Volume</label>
                        <input style={inputStyle} placeholder="Vol-1" value={newBook.volume} onChange={e=>setNewBook({...newBook, volume:e.target.value})} /></div>

                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Cost (₹)</label>
                        <input style={inputStyle} type="number" step="0.01" placeholder="0.00" value={newBook.cost} onChange={e=>setNewBook({...newBook, cost:e.target.value})} /></div>
                    </div>

                     {/* Row 4: Purchase Info */}
                     <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'20px'}}>
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Source / Vendor</label>
                        <input style={inputStyle} placeholder="Where was it bought?" value={newBook.source} onChange={e=>setNewBook({...newBook, source:e.target.value})} /></div>
                        
                        <div><label style={{fontSize:'0.85rem', fontWeight:'bold', color:'#64748b'}}>Bill No & Date</label>
                        <input style={inputStyle} placeholder="Invoice Details" value={newBook.bill_number} onChange={e=>setNewBook({...newBook, bill_number:e.target.value})} /></div>
                    </div>

                    <button type="submit" className="btn-gold" style={{width:'100%', padding:'12px', fontWeight:'bold', fontSize:'1rem'}}>💾 Save Book to Library</button>
                </form>
            </div>
          )}

          {/* TABLE (Matches User View + Delete Action) */}
          {loading ? (
             <div style={{textAlign:'center', padding:'60px', color:'#94a3b8'}}>
                <div style={{fontSize:'2rem', marginBottom:'10px'}}>⏳</div>
                <p>Loading Inventory...</p>
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
                                <td style={{padding:'16px'}}>
                                    {renderStatus(book.available_copies)}
                                </td>
                                <td style={{padding:'16px'}}>
                                    <button 
                                        onClick={() => handleDelete(book.id)}
                                        style={{
                                            padding: '8px 16px', 
                                            background: '#fee2e2', 
                                            color: '#dc2626', 
                                            border: '1px solid #fecaca', 
                                            borderRadius: '8px', 
                                            cursor: 'pointer', 
                                            fontSize: '0.85rem', 
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        🗑️ Delete
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

            {/* MODERN PAGINATION */}
            <div style={{display:'flex', justifyContent:'center', gap:'12px', marginTop:'30px', alignItems:'center'}}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{padding: '10px 20px', border: '1px solid #e2e8f0', background: 'white', color: page === 1 ? '#cbd5e1' : '#475569', borderRadius: '8px', fontWeight: '600', cursor: page === 1 ? 'not-allowed' : 'pointer'}}>⬅ Previous</button>
                <span style={{fontWeight:'bold', color:'#555'}}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} style={{padding: '10px 20px', border: '1px solid #e2e8f0', background: 'white', color: page >= totalPages ? '#cbd5e1' : '#475569', borderRadius: '8px', fontWeight: '600', cursor: page >= totalPages ? 'not-allowed' : 'pointer'}}>Next ➡</button>
            </div>
            </>
          )}
      </div>
    </div>
  );
}

export default AdminBooks;