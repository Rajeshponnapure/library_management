// frontend/src/AdminBooks.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Book Form State
  const [newBook, setNewBook] = useState({
    title: '', author: '', acc_no: '', department: 'CSE', total_copies: 1
  });

  const token = localStorage.getItem('token');

  const fetchBooks = async (searchQuery = '') => {
    setLoading(true);
    try {
      // Use the existing search API
      const res = await axios.get(`http://127.0.0.1:8000/books/search/?query=${searchQuery}`);
      setBooks(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBooks(); // Load all books initially (or empty query)
  }, []);

  const handleDelete = async (acc_no) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete book with Acc No: ${acc_no}? This cannot be undone.`)) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/admin/books/delete/${acc_no}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Book Deleted Successfully");
      fetchBooks(query);
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Delete Failed"));
    }
  };

  const handleAddBook = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/admin/books/add', newBook, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("New Book Added to Library Inventory!");
      setShowAddForm(false);
      setNewBook({ title: '', author: '', acc_no: '', department: 'CSE', total_copies: 1 });
      fetchBooks(query);
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Add Failed"));
    }
  };

  return (
    <div className="container">
      <div className="glass-card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <h2 style={{ color: '#003366', margin:0 }}>📖 Library Inventory Manager</h2>
            <button className="btn-gold" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Close Form' : '+ Add New Book'}
            </button>
        </div>

        {/* --- ADD BOOK FORM --- */}
        {showAddForm && (
            <div style={{background:'#f8f9fa', padding:'20px', borderRadius:'10px', marginBottom:'30px', border:'1px solid #ddd'}}>
                <h3 style={{marginTop:0}}>Add New Resource</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                    <div>
                        <label className="form-label">Title</label>
                        <input className="modern-input" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} placeholder="Book Name" />
                    </div>
                    <div>
                        <label className="form-label">Author</label>
                        <input className="modern-input" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} placeholder="Author Name" />
                    </div>
                    <div>
                        <label className="form-label">Accession No (Unique)</label>
                        <input className="modern-input" value={newBook.acc_no} onChange={e => setNewBook({...newBook, acc_no: e.target.value})} placeholder="e.g. 5001" />
                    </div>
                    <div>
                        <label className="form-label">Department</label>
                        <select className="modern-input modern-select" value={newBook.department} onChange={e => setNewBook({...newBook, department: e.target.value})}>
                            <option value="CSE">CSE</option><option value="ECE">ECE</option>
                            <option value="EEE">EEE</option><option value="CIVIL">CIVIL</option>
                            <option value="MECH">MECH</option><option value="MBA">MBA</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Total Copies</label>
                        <input type="number" className="modern-input" value={newBook.total_copies} onChange={e => setNewBook({...newBook, total_copies: parseInt(e.target.value)})} />
                    </div>
                </div>
                <button className="btn-gold" style={{marginTop:'15px', width:'100%'}} onClick={handleAddBook}>Save to Database</button>
            </div>
        )}

        {/* --- SEARCH --- */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            className="modern-input"
            placeholder="Search inventory by Title, Author, or ID..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBooks(query)}
          />
          <button className="btn-gold" onClick={() => fetchBooks(query)}>Search</button>
        </div>

        {/* --- TABLE --- */}
        {loading ? <p>Loading inventory...</p> : (
          <table>
            <thead>
                <tr>
                <th>Title / Author</th>
                <th>Acc No</th>
                <th>Stock Status</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {books.map((book) => (
                <tr key={book.id}>
                    <td>
                        <strong>{book.title}</strong><br/>
                        <span style={{fontSize:'0.85rem', color:'#666'}}>{book.author}</span>
                    </td>
                    <td>{book.acc_no}</td>
                    <td>
                        <span style={{fontWeight:'bold', color: book.available_copies > 0 ? 'green' : 'red'}}>
                            {book.available_copies} / {book.total_copies} Available
                        </span>
                    </td>
                    <td>
                        <button 
                            onClick={() => handleDelete(book.acc_no)}
                            style={{padding:'6px 12px', background:'#dc3545', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}
                        >
                            Delete
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
      </div>
    </div>
  );
}

export default AdminBooks;