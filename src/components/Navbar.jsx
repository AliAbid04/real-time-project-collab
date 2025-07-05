import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          TeamCollab
        </Link>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/addproject">New Project</Link>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}></div>
      </div>
    </nav>
  );
};

export default Navbar;
