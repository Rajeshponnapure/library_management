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
  const [newBook, setNewBook] = useState({
    acc_no: '', title: '', author: '', department: 'CSE', 
    total_copies: 1, publisher: '', edition_year: '', 
    pages: '', volume: '', source: '', bill_number: '', cost: ''
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
        setNewBook({ acc_no: '', title: '', author: '', department: 'CSE', total_copies: 1, publisher: '', edition_year: '', pages: '', volume: '', source: '', bill_number: '', cost: '' });
        setShowAddForm(false);
        fetchBooks();
    } catch (err) { alert("Error: " + (err.response?.data?.detail || err.message)); }
  };

  // --- HELPER: COOL STATUS PILLS ---
  const renderStatus = (copies) => {
    const safeCopies = copies || 0;
    if (safeCopies >= 5) {
        return <span style={{background:'rgba(16,185,129,0.1)', color:'#059669', padding:'6px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'700', border:'1px solid rgba(16,185,129,0.2)'}}>✅ {safeCopies} Available</span>;
    } else if (safeCopies > 0) {
        return <span style={{background:'rgba(245,158,11,0.1)', color:'#d97706', padding:'6px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'700', border:'1px solid rgba(245,158,11,0.2)'}}>⚠️ Only {safeCopies} Left</span>;
    } else {
        return <span style={{background:'rgba(239,68,68,0.1)', color:'#dc2626', padding:'6px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'700', border:'1px solid rgba(239,68,68,0.2)'}}>❌ Out of Stock</span>;
    }
  };

  // --- STYLES ---
  const cardStyle = { background: 'rgba(255,255,255,0.95)', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '20px' };
  const inputStyle = { padding: '10px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', outline:'none' };

  return (
    <div className="container" style={{maxWidth: '1200px', marginTop: '20px'}}>
      
      {/* HEADER AREA */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2 style={{color: 'white', margin:0}}>📚 Manage Inventory</h2>
          <button 
            className="btn-gold" 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{background: showAddForm ? '#dc3545' : '#d4a017', padding: '10px 20px'}}
          >
            {showAddForm ? '✖ Cancel' : '➕ Add New Book'}
          </button>
      </div>

      {/* SEARCH BAR (Matches User View) */}
      <div style={cardStyle}>
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
            <input 
                style={{...inputStyle, flex: 2}} 
                placeholder="🔍 Search Title, Author, Acc No..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
            />
            <select style={{...inputStyle, flex: 1}} value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="All">All Departments</option><option value="CSE">CSE</option><option value="ECE">ECE</option>
                <option value="EEE">EEE</option><option value="CIVIL">CIVIL</option><option value="MECH">MECH</option>
                <option value="MBA">MBA</option><option value="General">General</option><option value="BS&H">BS&H</option>
            </select>
          </div>

          {/* ADD BOOK FORM (Collapsible) */}
          {showAddForm && (
            <div style={{background:'#fdfdfd', border:'1px solid #eee', padding:'20px', borderRadius:'10px', marginBottom:'20px', borderLeft:'5px solid #d4a017'}}>
                <h3 style={{marginTop:0, color:'#555'}}>Add New Book</h3>
                <form onSubmit={handleAddBook}>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <input style={inputStyle} placeholder="Acc No *" required value={newBook.acc_no} onChange={e=>setNewBook({...newBook, acc_no:e.target.value})} />
                        <input style={inputStyle} placeholder="Title *" required value={newBook.title} onChange={e=>setNewBook({...newBook, title:e.target.value})} />
                        <input style={inputStyle} placeholder="Author *" required value={newBook.author} onChange={e=>setNewBook({...newBook, author:e.target.value})} />
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <select style={inputStyle} value={newBook.department} onChange={e=>setNewBook({...newBook, department:e.target.value})}>
                            <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option>
                            <option value="CIVIL">CIVIL</option><option value="MECH">MECH</option><option value="MBA">MBA</option>
                            <option value="General">General</option><option value="BS&H">BS&H</option>
                        </select>
                        <input style={inputStyle} placeholder="Publisher" value={newBook.publisher} onChange={e=>setNewBook({...newBook, publisher:e.target.value})} />
                        <input style={inputStyle} placeholder="Edition/Year" value={newBook.edition_year} onChange={e=>setNewBook({...newBook, edition_year:e.target.value})} />
                        <input style={inputStyle} type="number" placeholder="Copies" required min="1" value={newBook.total_copies} onChange={e=>setNewBook({...newBook, total_copies:parseInt(e.target.value)})} />
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                        <input style={inputStyle} placeholder="Volume" value={newBook.volume} onChange={e=>setNewBook({...newBook, volume:e.target.value})} />
                        <input style={inputStyle} placeholder="Pages" value={newBook.pages} onChange={e=>setNewBook({...newBook, pages:e.target.value})} />
                        <input style={inputStyle} placeholder="Source" value={newBook.source} onChange={e=>setNewBook({...newBook, source:e.target.value})} />
                        <input style={inputStyle} placeholder="Cost (₹)" type="number" step="0.01" value={newBook.cost} onChange={e=>setNewBook({...newBook, cost:e.target.value})} />
                    </div>
                    <button type="submit" className="btn-gold" style={{width:'100%'}}>Save Book to Library</button>
                </form>
            </div>
          )}

          {/* TABLE (Matches User View) */}
          {loading ? <p style={{textAlign:'center', padding:'20px'}}>⏳ Loading...</p> : (
            <>
            <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                    <thead>
                        <tr style={{background: 'var(--primary)', color: 'white', textAlign: 'left'}}>
                            <th style={{padding:'12px'}}>Acc No</th>
                            <th style={{padding:'12px'}}>Title / Author</th>
                            <th style={{padding:'12px'}}>Dept</th>
                            <th style={{padding:'12px'}}>Publisher</th>
                            <th style={{padding:'12px'}}>Cost</th>
                            <th style={{padding:'12px'}}>Status</th>
                            <th style={{padding:'12px'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map((book, index) => (
                            <tr key={book.id} style={{borderBottom: '1px solid #eee', background: index % 2 === 0 ? 'white' : '#fcfcfc'}}>
                                <td style={{padding:'12px', fontWeight:'bold', color:'#555'}}>{book.acc_no}</td>
                                <td style={{padding:'12px'}}>
                                    <div style={{fontWeight:'bold', color:'#333'}}>{book.title}</div>
                                    <div style={{fontSize:'0.85rem', color:'#666'}}>{book.author}</div>
                                </td>
                                <td style={{padding:'12px'}}><span className="badge">{book.department}</span></td>
                                <td style={{padding:'12px'}}>
                                    <div>{book.publisher}</div>
                                    <small style={{color:'#888'}}>{book.edition_year}</small>
                                </td>
                                <td style={{padding:'12px', fontWeight:'bold'}}>{book.cost ? `₹${book.cost}` : '-'}</td>
                                <td style={{padding:'12px'}}>
                                    {renderStatus(book.available_copies)}
                                </td>
                                <td style={{padding:'12px'}}>
                                    <button 
                                        onClick={() => handleDelete(book.id)}
                                        style={{padding:'6px 12px', background:'#ef4444', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', fontWeight:'bold', boxShadow:'0 2px 4px rgba(239,68,68,0.3)'}}
                                    >
                                        🗑️ Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {books.length === 0 && <p style={{textAlign:'center', padding:'30px', color:'#777'}}>No books found.</p>}
            </div>

            {/* PAGINATION */}
            <div style={{display:'flex', justifyContent:'center', gap:'15px', marginTop:'25px', alignItems:'center'}}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-gold" style={{opacity: page===1?0.5:1, background:'white', color:'#d4a017', border:'1px solid #d4a017'}}>⬅ Previous</button>
                <span style={{fontWeight:'bold', color:'#555'}}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn-gold" style={{opacity: page>=totalPages?0.5:1, background:'white', color:'#d4a017', border:'1px solid #d4a017'}}>Next ➡</button>
            </div>
            </>
          )}
      </div>
    </div>
  );
}

export default AdminBooks;