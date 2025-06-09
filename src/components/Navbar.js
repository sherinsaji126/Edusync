import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <div className="sidebar">
      <h2 className="brand">EduSync</h2>
      <nav>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
    </div>
  );
}

export default Navbar;
