// frontend/src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Login from './Login'; 
import Signup from './Signup'; // <--- 1. IMPORT SIGNUP
import './index.css';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/books/search/?query=${searchTerm}`);
      setBooks(response.data);
    } catch (error) {
      console.error("Error", error);
    }
  };

  return (
    <div className="container">
      <div className="search-card">
        <h1>Find Your Book</h1>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search title, author, or acc no..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-gold" onClick={handleSearch}>Search</button>
        </div>
      </div>

      {books.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr><th>Acc No</th><th>Title</th><th>Author</th><th>Status</th></tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.acc_no}</td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td style={{color: book.available_copies > 0 ? 'green' : 'red'}}>
                     {book.available_copies > 0 ? 'Available' : 'Issued'}
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

function App() {
  return (
    <div className="app-wrapper">
      <nav className="navbar">
        <h2>College Library</h2>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          {/* Optional: Add Signup directly to navbar too */}
          <Link to="/signup" className="btn-gold" style={{marginLeft: '15px', color: '#003366'}}>
             Sign Up
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> {/* <--- 2. ADD ROUTE */}
      </Routes>
    </div>
  );
}

export default App;