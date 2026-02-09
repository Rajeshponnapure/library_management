// frontend/src/Books.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './index.css';

function Books() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All'); 
  const navigate = useNavigate();

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/books/search/?query=${query}&department=${department}`);
      setBooks(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchBooks();
  }, [department]); 

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

  return (
    <div className="container" style={{maxWidth: '1200px'}}> {/* Made container wider for table */}
      <div className="glass-card">
        <h2 style={{color: 'var(--primary)', marginBottom: '20px'}}>Search Library Catalog</h2>
        
        {/* SEARCH BAR */}
        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
          <input 
            className="modern-input"
            placeholder="Search by Title, Author, Acc No, or Publisher..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
            style={{flex: 2}}
          />
          <select 
            className="modern-input modern-select" 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)}
            style={{flex: 1}}
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="CIVIL">CIVIL</option>
            <option value="MECH">MECH</option>
            <option value="MBA">MBA</option>
          </select>
          <button className="btn-gold" onClick={fetchBooks}>Search</button>
        </div>

        {/* ACCESSION REGISTER TABLE STYLE */}
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
              <thead>
                  <tr style={{background: 'var(--primary)', color: 'white'}}>
                      <th style={{padding: '10px'}}>Acc No</th>
                      <th style={{padding: '10px'}}>Title / Author</th>
                      <th style={{padding: '10px'}}>Dept</th>
                      <th style={{padding: '10px'}}>Pub / Year</th>
                      <th style={{padding: '10px'}}>Bill Details</th>
                      <th style={{padding: '10px'}}>Cost</th>
                      <th style={{padding: '10px'}}>Status</th>
                      <th style={{padding: '10px'}}>Action</th>
                  </tr>
              </thead>
              <tbody>
                  {books.map((book) => (
                      <tr key={book.id} style={{borderBottom: '1px solid #eee'}}>
                          <td style={{padding: '10px', fontWeight: 'bold'}}>{book.acc_no}</td>
                          <td style={{padding: '10px'}}>
                              <div style={{fontWeight: 'bold', color: '#333'}}>{book.title}</div>
                              <div style={{color: '#666', fontSize: '0.85rem'}}>{book.author}</div>
                              {book.volume && <span style={{fontSize: '0.75rem', background:'#eee', padding:'2px 5px', borderRadius:'3px'}}>{book.volume}</span>}
                          </td>
                          <td style={{padding: '10px'}}><span className="badge">{book.department}</span></td>
                          <td style={{padding: '10px'}}>
                              <div>{book.publisher}</div>
                              <div style={{fontSize: '0.8rem', color: '#666'}}>{book.edition_year}</div>
                          </td>
                          <td style={{padding: '10px', fontSize: '0.85rem', color: '#555'}}>
                              <div>Bill: {book.bill_number || '-'}</div>
                              <div style={{fontSize: '0.8rem', color:'#888'}}>Src: {book.source}</div>
                          </td>
                          <td style={{padding: '10px', fontWeight: 'bold'}}>
                              {book.cost ? `₹${book.cost}` : '-'}
                          </td>
                          <td style={{padding: '10px', verticalAlign: 'middle'}}>
                                <span className={`status-badge ${(book.available_copies || 0) > 0 ? 'status-available' : 'status-out'}`}>
                                    {(book.available_copies || 0) > 0 ? `✅ ${book.available_copies} Avl` : '❌ Out'}
                                </span>
                            </td>
                          <td style={{padding: '10px'}}>
                              <button 
                                  className="btn-gold" 
                                  style={{padding: '5px 10px', fontSize: '0.8rem', opacity: book.available_copies > 0 ? 1 : 0.5}}
                                  disabled={book.available_copies === 0}
                                  onClick={() => handleRequest(book.id)}
                              >
                                  Request
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {books.length === 0 && <p style={{textAlign: 'center', padding: '20px', color: '#666'}}>No books found matching criteria.</p>}
      </div>

      </div>
    </div>
  );
}

export default Books;