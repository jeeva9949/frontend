import React from "react";
import { useNavigate } from "react-router-dom";
import "./header.css"; // Custom styles for Header

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("auth");

    // Redirect to login page
    navigate("/");
  };

  // Retrieve session data
  const user = JSON.parse(sessionStorage.getItem("auth"));

  return (
    <header className="headerBlock">
      <div className="logo">
        <img
          src="/img/SSTLOGO.jpg"
          alt="Logo"
          style={{ width: "125px", height: "auto" }}
        />
      </div>
      <nav className="nav-links">
        <a href="/dashboard">Home</a>
        <a href="/invoiceGrid">Invoice Details</a>
        <a href="/cdGrid">Consignee Details</a>
        <a href="#">link 3</a>
      </nav>
      <div className="profile">
        {user ? (
          <>
            <span>{user.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button onClick={() => navigate("/")}>Login</button>
        )}
      </div>
    </header>
  );
};

export default Header;
