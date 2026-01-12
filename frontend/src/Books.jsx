// frontend/src/Books.jsx
import React, { useState } from 'react';
import axios from 'axios';

function Books() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/books/search/?query=${query}`);
      setBooks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (bookId) => {
    if (!token) {
      alert("Please login to request books.");
      return;
    }
    try {
      await axios.post(
        `http://127.0.0.1:8000/request-book/${bookId}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Request Sent Successfully! Wait for Admin approval.");
    } catch (err) {
      alert(err.response?.data?.detail || "Request failed");
    }
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h2 style={{ color: '#003366' }}>Library Catalog</h2>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
          <input 
            placeholder="Search by Title, Author, or Accession No..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '10px', width: '60%', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button className="btn-gold" onClick={handleSearch}>Search</button>
        </div>

        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
                <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Availability</th> {/* Renamed Header */}
                <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {books.map((book) => (
                <tr key={book.id}>
                    {/* We removed Acc No column because it's confusing for grouped books */}
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    
                    {/* NEW: Show "3 / 5 Available" */}
                    <td style={{ fontWeight: 'bold', color: book.available_copies > 0 ? 'green' : 'red' }}>
                    {book.available_copies > 0 
                        ? `${book.available_copies} / ${book.total_copies} Copies Available` 
                        : 'Out of Stock'}
                    </td>
                    
                    <td>
                    {(role === 'student' || role === 'faculty') && book.available_copies > 0 && (
                        <button 
                        onClick={() => handleRequest(book.id)}
                        className="btn-gold"
                        style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                        >
                        Request
                        </button>
                    )}
                    {!role && <span style={{fontSize:'0.8rem'}}>Login to rent</span>}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        {books.length === 0 && !loading && <p>Type something to search...</p>}
      </div>
    </div>
  );
}

export default Books;